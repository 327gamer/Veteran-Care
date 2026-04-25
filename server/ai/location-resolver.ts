/**
 * AI Navigator location resolver.
 *
 * Extracts a US state (and optionally a city) from free-text user messages
 * so that the chatbot can serve any state — never assuming SC by default.
 *
 * Conservative: only matches known state names / abbreviations from a fixed
 * table. Returns undefined fields when nothing reliable can be parsed.
 */

const STATE_NAME_TO_CODE: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "district of columbia": "DC", "washington dc": "DC", "washington d.c.": "DC",
  "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
  "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
  "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
  "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
  "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX",
  "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
  "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
};

const STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
]);

/**
 * Well-known cities seeded so single-word mentions like "Atlanta" or
 * "Charleston" can hint at a state when the user didn't include one.
 * Kept intentionally small — we ONLY auto-resolve unambiguous, well-known
 * metros. If a city name maps to multiple states, leave it out of this map
 * and let the engine ask for clarification instead.
 */
const KNOWN_CITY_TO_STATE: Record<string, string> = {
  // Southeast (current launch footprint)
  "atlanta": "GA", "savannah": "GA", "augusta": "GA", "macon": "GA",
  "athens": "GA", "columbus ga": "GA",
  "charleston": "SC", "charleston sc": "SC", "columbia sc": "SC",
  "myrtle beach": "SC", "greenville sc": "SC", "spartanburg": "SC",
  "hilton head": "SC", "rock hill": "SC", "north charleston": "SC",
  "charlotte": "NC", "raleigh": "NC", "durham": "NC", "greensboro": "NC",
  "winston-salem": "NC", "winston salem": "NC", "asheville": "NC",
  "wilmington nc": "NC", "fayetteville": "NC", "cary": "NC", "high point": "NC",
  "miami": "FL", "orlando": "FL", "tampa": "FL", "jacksonville fl": "FL",
  "tallahassee": "FL", "fort lauderdale": "FL", "st petersburg": "FL",
  "saint petersburg": "FL", "pensacola": "FL", "gainesville fl": "FL",
  // Other major US metros for early national readiness
  "new york": "NY", "new york city": "NY", "nyc": "NY", "brooklyn": "NY",
  "los angeles": "CA", "san francisco": "CA", "san diego": "CA", "sacramento": "CA",
  "chicago": "IL", "houston": "TX", "dallas": "TX", "austin": "TX",
  "san antonio": "TX", "el paso": "TX", "fort worth": "TX",
  "phoenix": "AZ", "tucson": "AZ", "philadelphia": "PA", "pittsburgh": "PA",
  "san jose": "CA", "seattle": "WA", "denver": "CO", "boston": "MA",
  "nashville": "TN", "memphis": "TN", "knoxville": "TN", "chattanooga": "TN",
  "louisville": "KY", "lexington": "KY",
  "richmond": "VA", "virginia beach": "VA", "norfolk": "VA", "arlington va": "VA",
  "washington": "DC", "washington dc": "DC",
  "detroit": "MI", "milwaukee": "WI", "minneapolis": "MN", "st paul": "MN",
  "saint paul": "MN", "kansas city": "MO", "st louis": "MO", "saint louis": "MO",
  "indianapolis": "IN", "columbus": "OH", "cleveland": "OH", "cincinnati": "OH",
  "portland": "OR", "salt lake city": "UT", "albuquerque": "NM",
  "oklahoma city": "OK", "tulsa": "OK", "las vegas": "NV", "reno": "NV",
  "honolulu": "HI", "anchorage": "AK", "boise": "ID",
  "new orleans": "LA", "baton rouge": "LA", "birmingham": "AL", "huntsville": "AL",
  "mobile al": "AL", "montgomery": "AL", "jackson ms": "MS",
  "little rock": "AR", "des moines": "IA", "omaha": "NE",
  "providence": "RI", "hartford": "CT", "burlington vt": "VT",
  "manchester nh": "NH", "portland me": "ME", "newark": "NJ",
  "jersey city": "NJ", "wilmington de": "DE", "baltimore": "MD",
  "annapolis": "MD", "charleston wv": "WV", "fargo": "ND", "sioux falls": "SD",
  "billings": "MT", "cheyenne": "WY",
};

export interface ExtractedLocation {
  /** Two-letter state code (uppercase) when found. */
  state?: string;
  /** Best-effort city string when found (lowercased, trimmed). */
  city?: string;
  /** True when both city and state were extracted from the message itself. */
  isExplicit: boolean;
}

/**
 * Parse the user message for a US city / state hint.
 * Returns `{ state, city, isExplicit }`. Conservative — undefined when nothing
 * unambiguous matches.
 */
export function extractLocationFromMessage(text: string): ExtractedLocation {
  if (!text) return { isExplicit: false };
  const lower = text.toLowerCase();

  let foundState: string | undefined;
  let foundCity: string | undefined;
  let explicit = false;

  // Pattern A: "<City>, <State>" anywhere in the message — comma is required
  // to keep this path high-precision. Examples that match:
  //   "food help in atlanta, georgia", "housing in charlotte, nc", "wichita, ks"
  // Examples that intentionally do NOT match here (handled by C or by asking):
  //   "in the VA system" (no comma → no false-positive city="the" state="VA"),
  //   "housing in charlotte nc" (handled by KNOWN_CITY_TO_STATE fallback).
  const STATE_REGEX_PART = "[a-z]{2}|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|district of columbia|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming";
  const cityStateRe = new RegExp(`\\b([a-z][a-z .'-]{1,40}?),\\s*(${STATE_REGEX_PART})\\b`, "i");
  const m = lower.match(cityStateRe);
  if (m) {
    const cityCandidate = m[1].trim();
    const stateRaw = m[2].toLowerCase();
    const stateCode = stateRaw.length === 2
      ? stateRaw.toUpperCase()
      : STATE_NAME_TO_CODE[stateRaw];
    // Reject city candidates that are obviously non-city stopwords picked up
    // by greedy backtracking (e.g. "the", "a", "and").
    const stopwordCities = new Set([
      "the", "a", "an", "and", "or", "but", "for", "to", "from",
      "this", "that", "these", "those", "my", "our", "your", "their",
      "his", "her", "us", "we", "i", "me", "you", "yes", "no", "ok",
      "hi", "hello", "thanks", "please", "help", "anywhere", "somewhere",
    ]);
    if (
      stateCode &&
      STATE_CODES.has(stateCode) &&
      !stopwordCities.has(cityCandidate.toLowerCase()) &&
      cityCandidate.length >= 3
    ) {
      foundState = stateCode;
      foundCity = cityCandidate;
      explicit = true;
    }
  }

  // Pattern B: explicit state name (no city), e.g. "I live in Georgia"
  // or "looking for help in west virginia". Only if Pattern A didn't match.
  // Sort by descending length so multi-word names like "west virginia" beat
  // the substring "virginia" — same strategy as Pattern C below.
  if (!foundState) {
    const stateNamesByLength = Object.keys(STATE_NAME_TO_CODE).sort(
      (a, b) => b.length - a.length,
    );
    for (const name of stateNamesByLength) {
      const code = STATE_NAME_TO_CODE[name];
      const re = new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (re.test(lower)) {
        foundState = code;
        explicit = true;
        break;
      }
    }
  }
  if (!foundState) {
    // Two-letter codes are only safe to interpret when they appear DIRECTLY
    // after a location preposition ("in NC", "from GA", "near FL"). This
    // prevents false positives like:
    //   - "VA benefits"  → "VA" must NOT be read as Virginia
    //   - "PA system"    → "PA" must NOT be read as Pennsylvania
    //   - "OK thanks"    → "OK" must NOT be read as Oklahoma
    //   - "based in CA"  → safe to extract CA
    const prepLocRe = /\b(?:in|from|near|around|at|outside|throughout|across|live in|moving to|based in|located in)\s+([a-z]{2})\b/i;
    const prepMatch = lower.match(prepLocRe);
    if (prepMatch) {
      const code = prepMatch[1].toUpperCase();
      if (STATE_CODES.has(code)) {
        foundState = code;
        explicit = true;
      }
    }
  }

  // Pattern C: well-known single-city mention ("food in atlanta", "atlanta").
  // Iterate longest keys first so disambiguating suffixes like "charleston wv"
  // match before the shorter, default-state "charleston" entry. Without this,
  // "housing in charleston wv" would resolve to SC instead of WV.
  if (!foundState || !foundCity) {
    const cityKeysByLength = Object.keys(KNOWN_CITY_TO_STATE).sort(
      (a, b) => b.length - a.length,
    );
    for (const city of cityKeysByLength) {
      const code = KNOWN_CITY_TO_STATE[city];
      const re = new RegExp(`\\b${city.replace(/[.+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
      if (re.test(lower)) {
        if (!foundState) foundState = code;
        if (!foundCity) foundCity = city.replace(/\s[a-z]{2}$/i, "").trim();
        explicit = true;
        break;
      }
    }
  }

  return { state: foundState, city: foundCity, isExplicit: explicit };
}

/**
 * Resolve the effective location for an AI Navigator turn.
 *
 * Priority (FOUNDER DIRECTIVE 2026-04-25):
 *   1. EXPLICIT location inside THIS turn's user message wins over EVERYTHING
 *      else — browser GPS, saved profile, URL params, prior conversation.
 *      Reason: a veteran physically in NC may be asking for a friend in SC
 *      ("housing in South Carolina"). Their message intent must override the
 *      hard metadata about where their device is sitting.
 *   2. Frontend-provided userState (browser geolocation / saved profile / URL)
 *      — used only when the message itself contains no location.
 *   3. Undefined — caller must ask the user for city/state.
 *
 * Never returns a hardcoded fallback state — national expansion safe.
 *
 * Note on city carry-forward: when the message names a NEW state but no city,
 * we DO NOT carry the previously-provided city forward. A providedCity tied to
 * a different state is stale context and would mis-route the search (e.g.
 * browser sends Charlotte / NC, user types "in Georgia", we must search
 * statewide GA, never Charlotte/GA).
 */
export function resolveLocation(
  providedState: string | undefined,
  providedCity: string | undefined,
  userMessage: string,
): { state?: string; city?: string; source: "message" | "provided" | "none" } {
  const extracted = extractLocationFromMessage(userMessage);

  // PRIORITY 1: explicit location in the user's message.
  if (extracted.state) {
    const messageState = extracted.state.toUpperCase();
    let city = extracted.city;
    // Only inherit providedCity when it actually belongs to the same state the
    // user just named — otherwise drop it to avoid stale cross-state leakage.
    if (
      !city &&
      providedCity &&
      providedState &&
      providedState.toUpperCase() === messageState
    ) {
      city = providedCity;
    }
    return { state: messageState, city, source: "message" };
  }

  // PRIORITY 2: frontend-provided context (browser GPS, profile, URL).
  if (providedState) {
    return { state: providedState.toUpperCase(), city: providedCity, source: "provided" };
  }

  // PRIORITY 3: nothing reliable — caller will ask for city/state.
  return { state: undefined, city: providedCity, source: "none" };
}

/**
 * A request is "location-sensitive" if it asks for local services. We treat
 * almost everything as location-sensitive EXCEPT national-by-design categories.
 *
 * Crisis-help is handled separately (988 always shown first), so it never
 * triggers a location clarification.
 */
const NATIONAL_BY_DEFAULT = new Set<string>([
  // Crisis is short-circuited earlier in the engine; included for safety.
  "crisis-help",
]);

export function isLocationSensitive(detectedCategory: string | null): boolean {
  if (!detectedCategory) return true; // unknown intent → ask for location anyway
  return !NATIONAL_BY_DEFAULT.has(detectedCategory);
}

export const locationClarificationResponse =
  `I can definitely help with that. So I can pull the right local resources, ` +
  `**what city and state should I search in?** ` +
  `(For example: "Atlanta, GA" or "Charlotte, NC".) ` +
  `You can also enable location in your browser for better results and a more personalized experience.`;
