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
  limit: number = 5
): Promise<MatchedResource[]> {
  const detectedCategories = detectCategories(userMessage);
  let allResults: MatchedResource[] = [];

  if (detectedCategories.length > 0) {
    const primaryCategory = detectedCategories[0];
    const primaryResults = await searchByCategory([primaryCategory], userState, userCity);
    allResults.push(...primaryResults.slice(0, 4));

    if (allResults.length < 3 && detectedCategories.length > 1) {
      const secondaryResults = await searchByCategory([detectedCategories[1]], userState, userCity);
      for (const r of secondaryResults) {
        if (allResults.length >= limit) break;
        if (!allResults.find(existing => existing.id === r.id)) {
          allResults.push(r);
        }
      }
    }
  }

  if (allResults.length < 2) {
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
      allResults.push(...broadResults.slice(0, 3));
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
    .limit(10);

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
    if (userCity) {
      const aLocal = a.city?.toLowerCase() === userCity.toLowerCase() ? 0 : 1;
      const bLocal = b.city?.toLowerCase() === userCity.toLowerCase() ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
    }
    if (userState) {
      const aState = a.state === userState ? 0 : 1;
      const bState = b.state === userState ? 0 : 1;
      return aState - bState;
    }
    return 0;
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
    .limit(5);

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
  }));
}
