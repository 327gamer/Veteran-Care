import { supabase } from "../supabase";
import { aiConfig } from "./config";

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
  const detectedCategories = detectCategories(userMessage);
  // Strip the user's known city from search terms — it's already encoded in
  // the location filter; leaving it in dilutes the text search by matching
  // every record that mentions the city in its title.
  const extraStop = new Set<string>();
  if (userCity) {
    for (const w of userCity.toLowerCase().split(/\s+/)) extraStop.add(w);
  }
  const searchTerms = extractSearchTerms(userMessage).filter(t => !extraStop.has(t));
  const termSet = new Set(searchTerms);

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
  if (searchTerms.length > 0) {
    const textQuery = searchTerms.slice(0, 4).join(" ");
    if (userState) tasks.push(searchByText(textQuery, userState, userCity));
    tasks.push(searchByText(textQuery));
  }

  const allBatches = await Promise.all(tasks);

  // Merge by id, keeping the best instance and computing a relevance score.
  const seen = new Map<string, { r: MatchedResource; score: number }>();
  for (const batch of allBatches) {
    for (const r of batch) {
      const score = scoreResource(r, termSet, userCity, userState);
      const existing = seen.get(r.id);
      if (!existing || score > existing.score) {
        seen.set(r.id, { r, score });
      }
    }
  }

  const merged = Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .map(x => x.r);

  // Last-resort fallback: nothing matched at all → broad text search in user state
  if (merged.length === 0 && userState && searchTerms.length > 0) {
    const broad = await searchByText(searchTerms.slice(0, 3).join(" "), userState);
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

  // Small baseline so category-bucket records still rank if they had no term hits
  if (score === 0) score = 1;

  return score;
}

export function detectCategories(message: string): string[] {
  const lower = message.toLowerCase();
  const scored: { slug: string; bestLen: number; matchCount: number }[] = [];

  for (const [slug, keywords] of Object.entries(aiConfig.categoryKeywords)) {
    let bestLen = 0;
    let matchCount = 0;
    for (const kw of keywords) {
      if (matchesKeyword(lower, kw)) {
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
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map(r => ({
    id: r.id,
    title: r.title,
    short_description: r.short_description,
    phone: r.phone,
    website_url: r.website_url,
    city: r.city,
    state: r.state,
    eligibility: r.eligibility,
    subcategory: r.subcategory,
    category_slug: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.slug || null,
    category_name: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.name || null,
  })).sort((a, b) => {
    const aScore = getLocationScore(a.city, a.state, userCity, userState);
    const bScore = getLocationScore(b.city, b.state, userCity, userState);
    return aScore - bScore;
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
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map(r => ({
    id: r.id,
    title: r.title,
    short_description: r.short_description,
    phone: r.phone,
    website_url: r.website_url,
    city: r.city,
    state: r.state,
    eligibility: r.eligibility,
    subcategory: r.subcategory,
    category_slug: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.slug || null,
    category_name: Array.isArray(r.resource_categories) && r.resource_categories[0]?.categories?.name || null,
  })).sort((a, b) => {
    const aScore = getLocationScore(a.city, a.state, userCity, userState);
    const bScore = getLocationScore(b.city, b.state, userCity, userState);
    return aScore - bScore;
  });
}
