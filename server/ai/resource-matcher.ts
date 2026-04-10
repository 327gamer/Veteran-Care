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

export async function matchResources(
  userMessage: string,
  userState?: string,
  userCity?: string,
  limit: number = 8
): Promise<MatchedResource[]> {
  const detectedCategories = detectCategories(userMessage);
  let allResults: MatchedResource[] = [];

  if (detectedCategories.length > 0) {
    const primaryCategory = detectedCategories[0];
    const primaryResults = await searchByCategory([primaryCategory], userState, userCity);
    allResults.push(...primaryResults.slice(0, limit));
  }

  if (allResults.length < 3) {
    const searchTerms = extractSearchTerms(userMessage);
    if (searchTerms.length > 0) {
      const textResults = await searchByText(searchTerms.slice(0, 3).join(" "), userState, userCity);
      for (const r of textResults) {
        if (allResults.length >= limit) break;
        if (!allResults.find(existing => existing.id === r.id)) {
          allResults.push(r);
        }
      }
    }
  }

  if (allResults.length === 0 && userState) {
    const searchTerms = extractSearchTerms(userMessage);
    if (searchTerms.length > 0) {
      const broadResults = await searchByText(searchTerms.slice(0, 3).join(" "), userState);
      allResults.push(...broadResults.slice(0, 5));
    }
  }

  return allResults.slice(0, limit);
}

export function detectCategories(message: string): string[] {
  const lower = message.toLowerCase();
  const matched: string[] = [];

  for (const [slug, keywords] of Object.entries(aiConfig.categoryKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.push(slug);
        break;
      }
    }
  }

  return matched;
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
  ]);

  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

const SC_NEARBY_CITIES: Record<string, string[]> = {
  "charleston": ["north charleston", "mount pleasant", "summerville", "goose creek", "james island", "west ashley", "hanahan"],
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
    .limit(15);

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
