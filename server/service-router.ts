import { supabaseAdmin } from "./supabase";

interface KeywordMapping {
  keywords: string[];
  categorySlug: string;
}

const KEYWORD_MAP: KeywordMapping[] = [
  {
    categorySlug: "housing-home",
    keywords: [
      "housing", "house", "home", "mortgage", "va loan", "va home loan",
      "rent", "rental", "apartment", "moving", "relocation", "real estate",
      "realtor", "property", "landlord", "lease", "homeless", "shelter",
      "hud-vash", "hudvash",
    ],
  },
  {
    categorySlug: "legal-services",
    keywords: [
      "lawyer", "attorney", "legal", "law firm", "court", "lawsuit",
      "disability claim", "appeal", "divorce", "custody", "expungement",
      "criminal record", "legal aid", "pro bono",
    ],
  },
  {
    categorySlug: "financial-credit",
    keywords: [
      "financial", "finance", "credit", "credit score", "debt", "loan",
      "banking", "savings", "investment", "tax", "taxes", "budgeting",
      "credit counseling", "credit repair", "bankruptcy",
    ],
  },
  {
    categorySlug: "insurance",
    keywords: [
      "insurance", "life insurance", "health insurance", "auto insurance",
      "home insurance", "coverage", "policy", "premium", "tricare",
    ],
  },
  {
    categorySlug: "education-training",
    keywords: [
      "education", "school", "college", "university", "degree", "training",
      "gi bill", "certification", "vocational", "trade school",
      "tuition", "scholarship", "online courses",
    ],
  },
  {
    categorySlug: "employment-support",
    keywords: [
      "job", "jobs", "employment", "career", "resume", "interview",
      "hiring", "work", "employer", "staffing", "workforce",
      "job fair", "linkedin", "occupation",
    ],
  },
  {
    categorySlug: "benefits-assistance",
    keywords: [
      "benefits", "va benefits", "disability", "compensation", "pension",
      "claims", "va claim", "rating", "c&p exam", "service connected",
      "va disability", "aid and attendance",
    ],
  },
  {
    categorySlug: "wellness-recovery",
    keywords: [
      "rehab", "rehabilitation", "recovery", "addiction", "substance",
      "ptsd", "mental health", "counseling", "therapy", "wellness",
      "sober", "sobriety", "detox", "treatment",
    ],
  },
];

export interface TrustedServiceSuggestion {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_featured: boolean;
  category_name: string;
  category_slug: string;
}

export function detectServiceCategory(message: string): string | null {
  const lower = message.toLowerCase();

  for (const mapping of KEYWORD_MAP) {
    for (const kw of mapping.keywords) {
      const pattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (pattern.test(lower)) {
        return mapping.categorySlug;
      }
    }
  }

  return null;
}

export async function fetchTrustedServiceSuggestions(
  categorySlug: string,
  userState?: string | null,
  limit: number = 3
): Promise<TrustedServiceSuggestion[]> {
  try {
    const { data: category } = await supabaseAdmin
      .from("trusted_service_categories")
      .select("id, name")
      .eq("slug", categorySlug)
      .single();

    if (!category) return [];

    let query = supabaseAdmin
      .from("trusted_services")
      .select("id, name, description, city, state, phone, email, website, is_featured")
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
      .limit(limit);

    if (userState) {
      const { data: stateResults } = await query.eq("state", userState);
      if (stateResults && stateResults.length > 0) {
        return stateResults.map((s) => ({
          ...s,
          category_name: category.name,
          category_slug: categorySlug,
        }));
      }
    }

    const { data: results } = await query;
    if (!results) return [];

    return results.map((s) => ({
      ...s,
      category_name: category.name,
      category_slug: categorySlug,
    }));
  } catch (err: any) {
    console.log(`[service-router] Error fetching suggestions for ${categorySlug}:`, err?.message);
    return [];
  }
}

export async function routeToTrustedServices(
  userMessage: string,
  userState?: string | null
): Promise<{ categorySlug: string; categoryName: string; providers: TrustedServiceSuggestion[] } | null> {
  const slug = detectServiceCategory(userMessage);
  if (!slug) return null;

  const providers = await fetchTrustedServiceSuggestions(slug, userState);
  if (providers.length === 0) return null;

  return {
    categorySlug: slug,
    categoryName: providers[0].category_name,
    providers,
  };
}
