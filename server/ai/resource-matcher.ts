import { supabase } from "../supabase";
import { aiConfig } from "./config";
import {
  detectNamedPartner,
  detectRegionalAlias,
  isTrustedPartnerTitle,
  NAMED_PARTNERS,
  type NamedPartner,
} from "./named-partners";

interface MatchedResource {
  id: string;
  title: string;
  short_description: string | null;
  phone: string | null;
  website_url: string | null;
  city: string | null;
  state: string | null;
  eligibility: string | null;
  subcategory: string | null;
  category_slug: string | null;
  category_name: string | null;
  // Pass 5: ALL category slugs this resource is joined to (m2m). Used by the
  // primary-category boost so multi-category records get +6 reliably even
  // when category_slug from the join order happens to be a secondary one.
  category_slugs?: string[];
}

const MIN_RESULTS = 5;

/**
 * Pass 4 (2026-04-18): blended matcher.
 * Always runs both category-bucket and text searches in parallel, then scores
 * every candidate by query-term hits in title (weight 10), subcategory (7),
 * short_description (3), eligibility (2). Adds a location proximity boost
 * (0–5). Highest combined score wins. m2m mirror links are honored because
 * searchByCategory uses an !inner join through resource_categories.
 */
export async function matchResources(
  userMessage: string,
  userState?: string,
  userCity?: string,
  limit: number = 8
): Promise<MatchedResource[]> {
  // QA-2 (2026-04-26): Regional-alias upgrade. If the user references a metro
  // by nickname (e.g. "tri-county", "lowcountry") and we have no city, treat
  // the canonical metro hub as the effective city so getLocationScore tilts
  // the ranking toward partners in that region.
  const aliasCity = detectRegionalAlias(userMessage);
  if (aliasCity && !userCity) userCity = aliasCity;

  // QA-2: Named-partner pre-fetch. When the user names a verified partner
  // directly (e.g. "Tri-County Veterans Support Network"), pull the partner's
  // rows by title substring and prepend them to the merged result list with a
  // very high score so they always surface first regardless of category
  // routing or text-search recall.
  const namedPartner = detectNamedPartner(userMessage);
  let partnerRows: MatchedResource[] = [];
  if (namedPartner) {
    partnerRows = await searchByTitleSubstring(namedPartner.titleSubstring);
  }

  // QA-2: Trusted-partner state-scoped pre-fetch. The category-bucket query
  // is capped at 25 rows with no ORDER BY, so a trusted partner can be
  // randomly excluded from scoring entirely on a busy category in a
  // well-populated state. This pre-fetch guarantees every trusted partner in
  // the user's state enters the scoring pool, where the +20 trusted boost +
  // proximity boost will float them to the top of relevant queries.
  const trustedStateRows = userState
    ? await searchTrustedPartnersInState(userState)
    : [];

  const detectedCategories = detectCategories(userMessage);
  // Strip the user's known city from search terms — it's already encoded in
  // the location filter; leaving it in dilutes the text search by matching
  // every record that mentions the city in its title.
  const extraStop = new Set<string>();
  if (userCity) {
    for (const w of userCity.toLowerCase().split(/\s+/)) extraStop.add(w);
  }
  const rawTerms = extractSearchTerms(userMessage).filter(t => !extraStop.has(t));
  // Pass 5 (2026-04-19): lightweight stemming — strip trailing "s" on tokens
  // length ≥4 so "jobs"/"job", "veterans"/"veteran", "clinics"/"clinic",
  // "benefits"/"benefit" all collapse to a single canonical form. Because
  // scoring uses .includes(), the singular form matches both inflections in
  // record text. Skip "ss"-ending words (e.g. "access", "address").
  const stemmed = rawTerms.map(stem);
  // Pass 5: employment-synonym layer. If any employment cue is present (e.g.
  // user types "jobs"), broaden the term set to include the canonical
  // employment vocabulary used by record titles ("hiring", "career",
  // "employment") so employer-program records surface even when their titles
  // don't contain the literal word "jobs".
  const expanded = expandEmploymentSynonyms(stemmed);
  const termSet = new Set(expanded);
  const primarySlug: string | undefined = detectedCategories[0];

  const tasks: Promise<MatchedResource[]>[] = [];

  // Category-bucket searches (m2m-aware via !inner join in searchByCategory).
  // Note: searchByCategory only filters by state at the DB level; userCity
  // is used for client-side sorting only — so we only need ONE state-scoped
  // query (passing userCity for the local-first sort) plus a national fallback.
  if (detectedCategories.length > 0) {
    const primaryCategory = detectedCategories[0];
    if (userState) {
      tasks.push(searchByCategory([primaryCategory], userState, userCity));
    }
    tasks.push(searchByCategory([primaryCategory]));
    // Also pull from secondary detected category (often the right specialty match)
    if (detectedCategories.length > 1 && userState) {
      tasks.push(searchByCategory([detectedCategories[1]], userState, userCity));
    }
  }

  // Always run text search in parallel (no longer gated by MIN_RESULTS).
  // This guarantees title / subcategory / short_description matches surface
  // even when a broad category bucket already returned plenty of generic rows.
  if (rawTerms.length > 0) {
    const textQuery = rawTerms.slice(0, 4).join(" ");
    if (userState) tasks.push(searchByText(textQuery, userState, userCity));
    tasks.push(searchByText(textQuery));
  }

  const allBatches = await Promise.all(tasks);
  if (trustedStateRows.length > 0) allBatches.push(trustedStateRows);

  // Merge by id, keeping the best instance and computing a relevance score.
  // Pass 5: primary-category boost. Records whose joined category_slug
  // matches the FIRST detected category get +6, ensuring primary-intent
  // results win over secondary-category leakage. Magnitude is roughly half a
  // title hit (+10), so it tilts ties without overpowering true keyword hits.
  const seen = new Map<string, { r: MatchedResource; score: number }>();
  for (const batch of allBatches) {
    for (const r of batch) {
      let score = scoreResource(r, termSet, userCity, userState);
      // Pass 5 reliability fix: check ALL joined slugs, not just the
      // arbitrary first-joined one (especially important for searchByText
      // results, where the join order is non-deterministic for m2m records).
      if (primarySlug) {
        const slugs = r.category_slugs && r.category_slugs.length > 0
          ? r.category_slugs
          : (r.category_slug ? [r.category_slug] : []);
        if (slugs.includes(primarySlug)) score += 6;
      }
      const existing = seen.get(r.id);
      if (!existing || score > existing.score) {
        seen.set(r.id, { r, score });
      }
    }
  }

  const merged = Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .map(x => x.r);

  // QA-2: Prepend named-partner rows to the head of the result list,
  // de-duplicating by id against the merged matches. This is the deterministic
  // recall guarantee — "Tri-County Veterans Support Network" must surface even
  // when the category/text passes wouldn't have ranked it #1.
  if (partnerRows.length > 0) {
    const seenIds = new Set(partnerRows.map(p => p.id));
    const tail = merged.filter(m => !seenIds.has(m.id));
    return [...partnerRows, ...tail].slice(0, limit);
  }

  // Last-resort fallback: nothing matched at all → broad text search in user state
  if (merged.length === 0 && userState && rawTerms.length > 0) {
    const broad = await searchByText(rawTerms.slice(0, 3).join(" "), userState);
    return broad.slice(0, limit);
  }

  return merged.slice(0, limit);
}

function scoreResource(
  r: MatchedResource,
  terms: Set<string>,
  userCity?: string,
  userState?: string,
): number {
  let score = 0;
  const title = (r.title || "").toLowerCase();
  const sub = (r.subcategory || "").toLowerCase();
  const desc = (r.short_description || "").toLowerCase();
  const elig = (r.eligibility || "").toLowerCase();

  for (const t of terms) {
    if (!t) continue;
    if (title.includes(t)) score += 10;
    if (sub.includes(t)) score += 7;
    if (desc.includes(t)) score += 3;
    if (elig.includes(t)) score += 2;
  }

  // Location proximity boost (getLocationScore returns 0..5, lower = closer):
  // same city +5, nearby city +4, same state +3, no city listed +2,
  // out-of-state +1, no location signal at all +0.
  const locScore = getLocationScore(r.city, r.state, userCity, userState);
  score += Math.max(0, 5 - locScore);

  // Small bonus for records with a populated subcategory — these are the
  // taxonomy-rich, well-curated records (often specialized programs) and
  // should win ties against generic untagged office records.
  if (sub) score += 2;

  // QA-2 (2026-04-26): Verified-trusted-partner boost. Resources on the
  // founder-curated partner allowlist (server/ai/named-partners.ts) get a
  // +20 boost — large enough to outrank a perfect title hit on a generic
  // record (10) plus same-city (5) plus subcategory bonus (2) so trusted
  // local partners win category queries in their region.
  if (isTrustedPartnerTitle(r.title)) score += 20;

  // Small baseline so category-bucket records still rank if they had no term hits
  if (score === 0) score = 1;

  return score;
}

export function detectCategories(message: string): string[] {
  const lower = message.toLowerCase();
  // Pass 5 (2026-04-19): also build a stem-normalized haystack so that
  // pluralized user words like "jobs"/"clinics"/"benefits"/"veterans"
  // still match singular keyword entries like "job"/"clinic"/"benefits".
  // Word-boundary matching is preserved on this stemmed copy.
  const stemmedHaystack = lower
    .split(/\b/)
    .map(t => /^[a-z]{4,}$/.test(t) ? stem(t) : t)
    .join("");
  const scored: { slug: string; bestLen: number; matchCount: number }[] = [];

  for (const [slug, keywords] of Object.entries(aiConfig.categoryKeywords)) {
    let bestLen = 0;
    let matchCount = 0;
    for (const kw of keywords) {
      if (matchesKeyword(lower, kw) || matchesKeyword(stemmedHaystack, kw)) {
        matchCount++;
        if (kw.length > bestLen) bestLen = kw.length;
      }
    }
    if (matchCount > 0) {
      scored.push({ slug, bestLen, matchCount });
    }
  }

  scored.sort((a, b) => {
    const aScore = a.matchCount * 3 + a.bestLen;
    const bScore = b.matchCount * 3 + b.bestLen;
    return bScore - aScore;
  });

  return scored.map(s => s.slug);
}

/**
 * Word-boundary-aware keyword match. Single short words (e.g., "art", "race",
 * "farm") use \b boundaries to avoid matching "start", "embrace", "pharmacy".
 * Multi-word phrases ("music therapy", "fly fishing") use plain substring
 * because they're long enough to be self-disambiguating.
 */
function matchesKeyword(haystack: string, kw: string): boolean {
  if (kw.includes(" ") || kw.includes("-")) {
    return haystack.includes(kw);
  }
  // Escape regex metacharacters in keyword (defensive — current set has none)
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/**
 * Pass 5 (2026-04-19): lightweight stemming. Strips a trailing "s" on tokens
 * length ≥4, except double-"s" endings ("access", "address", "business").
 * Intentionally minimal — only solves the singular/plural mismatch that hurt
 * the 26-query validation suite ("jobs"/"job", "veterans"/"veteran",
 * "benefits"/"benefit", "clinics"/"clinic"). Not a full Porter stemmer.
 */
function stem(token: string): string {
  if (token.length < 4) return token;
  // Skip endings that aren't English plural markers:
  //   "ss"  → access, address, business
  //   "is"  → crisis, analysis, basis, diagnosis
  //   "us"  → bonus, focus, virus, campus
  //   "ous" → famous, serious (already covered by "us")
  if (token.endsWith("ss") || token.endsWith("is") || token.endsWith("us")) return token;
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

const EMPLOYMENT_CUES = new Set(["job", "hire", "hiring", "career", "employment", "employer", "employed"]);
const EMPLOYMENT_EXPANSIONS = ["job", "hiring", "career", "employment", "employer"];

/**
 * Pass 5 (2026-04-19): employment-synonym expansion. If any employment cue
 * appears in the user's stemmed terms, broaden the term set to include the
 * canonical employment vocabulary used by record titles. Used at scoring
 * time only — does NOT influence category routing (avoids over-routing
 * non-employment queries that happen to mention work).
 */
function expandEmploymentSynonyms(terms: string[]): string[] {
  const has = terms.some(t => EMPLOYMENT_CUES.has(t));
  if (!has) return terms;
  const out = new Set(terms);
  for (const e of EMPLOYMENT_EXPANSIONS) out.add(e);
  return Array.from(out);
}

function extractSearchTerms(message: string): string[] {
  const stopWords = new Set([
    "i", "me", "my", "we", "our", "you", "your", "the", "a", "an",
    "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should",
    "can", "may", "might", "shall", "to", "of", "in", "for", "on",
    "with", "at", "by", "from", "as", "into", "about", "between",
    "after", "before", "during", "without", "through", "and", "but",
    "or", "nor", "not", "so", "if", "then", "than", "that", "this",
    "what", "where", "when", "how", "who", "which", "there", "here",
    "it", "its", "any", "some", "need", "help", "want", "looking",
    "find", "get", "know", "please", "thanks", "thank", "hi", "hello",
    "hey", "im", "ive", "dont", "cant", "veteran", "veterans",
    // Geo / locator terms — too broad for ilike search; location filter
    // already handles these via state/city columns.
    "near", "around", "close", "nearby", "local",
    "south", "north", "east", "west", "carolina", "sc", "ga", "georgia",
    "state", "city", "county", "area", "region",
  ]);

  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

const SC_NEARBY_CITIES: Record<string, string[]> = {
  "charleston": ["north charleston", "mount pleasant", "summerville", "goose creek", "james island", "west ashley", "hanahan", "johns island", "daniel island"],
  "columbia": ["west columbia", "lexington", "irmo", "cayce", "forest acres", "blythewood"],
  "greenville": ["greer", "mauldin", "simpsonville", "travelers rest", "easley", "taylors"],
  "myrtle beach": ["north myrtle beach", "conway", "surfside beach", "garden city", "pawleys island", "georgetown"],
  "spartanburg": ["boiling springs", "duncan", "inman", "wellford"],
  "rock hill": ["fort mill", "lake wylie", "clover", "york"],
  "mount pleasant": ["charleston", "sullivan's island", "isle of palms"],
  "north charleston": ["charleston", "goose creek", "hanahan", "summerville"],
  "summerville": ["charleston", "north charleston", "goose creek", "ladson"],
  "florence": ["hartsville", "darlington", "lake city", "effingham"],
  "hilton head island": ["bluffton", "beaufort", "port royal"],
  "beaufort": ["port royal", "hilton head island", "bluffton"],
};

function getLocationScore(resourceCity: string | null, resourceState: string | null, userCity?: string, userState?: string): number {
  if (!userCity && !userState) return 5;
  const rCity = resourceCity?.toLowerCase()?.trim();
  const uCity = userCity?.toLowerCase()?.trim();
  const rState = resourceState?.toUpperCase()?.trim();
  const uState = userState?.toUpperCase()?.trim();

  if (uCity && rCity === uCity) return 0;
  if (uCity && rCity) {
    const nearby = SC_NEARBY_CITIES[uCity] || [];
    if (nearby.includes(rCity)) return 1;
  }
  if (uState && rState === uState) return 2;
  if (!rState) return 3;
  return 4;
}

async function searchByCategory(
  categorySlugs: string[],
  userState?: string,
  userCity?: string,
): Promise<MatchedResource[]> {
  let query = supabase
    .from("resources")
    .select("id, title, short_description, phone, website_url, city, state, eligibility, subcategory, resource_categories!inner(categories!inner(slug, name))")
    .eq("status", "approved")
    .in("resource_categories.categories.slug", categorySlugs)
    .limit(25);

  if (userState) {
    query = query.or(`state.eq.${userState},state.is.null`);
  } else {
    // National-expansion safety: when no state is known, never silently
    // surface state-tagged rows (which would bias toward whichever state
    // happens to have the most data, e.g. SC during early launch).
    query = query.is("state", null);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map(r => {
    const slugs = Array.isArray(r.resource_categories)
      ? r.resource_categories.map((rc: any) => rc?.categories?.slug).filter(Boolean)
      : [];
    return {
      id: r.id,
      title: r.title,
      short_description: r.short_description,
      phone: r.phone,
      website_url: r.website_url,
      city: r.city,
      state: r.state,
      eligibility: r.eligibility,
      subcategory: r.subcategory,
      category_slug: slugs[0] || null,
      category_name: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.name || null,
      category_slugs: slugs,
    };
  }).sort((a, b) => {
    const aScore = getLocationScore(a.city, a.state, userCity, userState);
    const bScore = getLocationScore(b.city, b.state, userCity, userState);
    return aScore - bScore;
  });
}

/**
 * QA-2 (2026-04-26): Title-substring lookup used by the named-partner
 * pre-fetch path. Always runs nationally (no state filter) because the user
 * has named the entity directly — geography is irrelevant to recall when
 * the entity is uniquely named.
 */
/**
 * QA-2 (2026-04-26): State-scoped trusted-partner pre-fetch. Pulls every
 * resource row in the user's state whose title matches any verified partner
 * substring on the founder allowlist. Used as a recall guarantee so trusted
 * partners are never silently dropped by the 25-row category-bucket cap.
 */
async function searchTrustedPartnersInState(userState: string): Promise<MatchedResource[]> {
  if (NAMED_PARTNERS.length === 0) return [];
  const orClauses = NAMED_PARTNERS
    .map(p => `title.ilike.%${p.titleSubstring}%`)
    .join(",");
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, short_description, phone, website_url, city, state, eligibility, subcategory, resource_categories(categories(slug, name))")
    .eq("status", "approved")
    .eq("state", userState)
    .or(orClauses)
    .limit(20);
  if (error || !data) return [];
  return (data as any[]).map(r => {
    const slugs = Array.isArray(r.resource_categories)
      ? r.resource_categories.map((rc: any) => rc?.categories?.slug).filter(Boolean)
      : [];
    return {
      id: r.id,
      title: r.title,
      short_description: r.short_description,
      phone: r.phone,
      website_url: r.website_url,
      city: r.city,
      state: r.state,
      eligibility: r.eligibility,
      subcategory: r.subcategory,
      category_slug: slugs[0] || null,
      category_name: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.name || null,
      category_slugs: slugs,
    };
  });
}

async function searchByTitleSubstring(titleSubstring: string): Promise<MatchedResource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, short_description, phone, website_url, city, state, eligibility, subcategory, resource_categories(categories(slug, name))")
    .eq("status", "approved")
    .ilike("title", `%${titleSubstring}%`)
    .limit(10);
  if (error || !data) return [];
  return (data as any[]).map(r => {
    const slugs = Array.isArray(r.resource_categories)
      ? r.resource_categories.map((rc: any) => rc?.categories?.slug).filter(Boolean)
      : [];
    return {
      id: r.id,
      title: r.title,
      short_description: r.short_description,
      phone: r.phone,
      website_url: r.website_url,
      city: r.city,
      state: r.state,
      eligibility: r.eligibility,
      subcategory: r.subcategory,
      category_slug: slugs[0] || null,
      category_name: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.name || null,
      category_slugs: slugs,
    };
  });
}

async function searchByText(
  searchText: string,
  userState?: string,
  userCity?: string,
): Promise<MatchedResource[]> {
  const words = searchText.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
  if (words.length === 0) return [];

  const ilikeClauses = words.map(w =>
    `title.ilike.%${w}%,short_description.ilike.%${w}%,subcategory.ilike.%${w}%,city.ilike.%${w}%,eligibility.ilike.%${w}%`
  ).join(",");

  let query = supabase
    .from("resources")
    .select("id, title, short_description, phone, website_url, city, state, eligibility, subcategory, resource_categories(categories(slug, name))")
    .eq("status", "approved")
    .or(ilikeClauses)
    .limit(30);

  if (userState) {
    query = query.or(`state.eq.${userState},state.is.null`);
  } else {
    // National-only fallback when state is unknown — see searchByCategory.
    query = query.is("state", null);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map(r => {
    const slugs = Array.isArray(r.resource_categories)
      ? r.resource_categories.map((rc: any) => rc?.categories?.slug).filter(Boolean)
      : [];
    return {
      id: r.id,
      title: r.title,
      short_description: r.short_description,
      phone: r.phone,
      website_url: r.website_url,
      city: r.city,
      state: r.state,
      eligibility: r.eligibility,
      subcategory: r.subcategory,
      category_slug: slugs[0] || null,
      category_name: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.name || null,
      category_slugs: slugs,
    };
  }).sort((a, b) => {
    const aScore = getLocationScore(a.city, a.state, userCity, userState);
    const bScore = getLocationScore(b.city, b.state, userCity, userState);
    return aScore - bScore;
  });
}
