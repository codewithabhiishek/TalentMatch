/**
 * Live Facility Location Resolver
 * 
 * Fetches the real geographic location (City, State) of a healthcare facility
 * from the internet using the free Wikipedia API when missing on a resume.
 * Zero fabricated or hardcoded facility lists.
 */

const locationCache = new Map<string, string>();

const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC'
};

const fullStateNamesPattern = Object.keys(STATE_NAME_TO_CODE).join('|');

/**
 * Searches the internet in real-time for where a facility or hospital is located.
 * Returns "" if not found so no fake data is generated.
 */
export async function fetchFacilityLocationFromWeb(facilityName: string): Promise<string> {
  if (!facilityName || facilityName.trim().length < 3) return '';

  const cleanQuery = facilityName.trim();
  if (locationCache.has(cleanQuery)) {
    return locationCache.get(cleanQuery)!;
  }

  if (typeof fetch === 'undefined') return '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s network limit

    // Search Wikipedia API for the facility
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanQuery + ' hospital medical center'
    )}&utf8=&format=json&origin=*`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return '';

    const data = await res.json();
    const hits = data.query?.search;
    if (!Array.isArray(hits) || hits.length === 0) return '';

    // Check top 3 hits to avoid missing if first hit is a disambiguation page
    for (const hit of hits.slice(0, 3)) {
      const snippetText = `${hit.title} ${hit.snippet}`.replace(/<[^>]+>/g, ' ');

      // 1. Match City, 2-letter State code (e.g. "Sacramento, CA" or "Dallas, TX")
      const abbrMatch = snippetText.match(/\b([A-Z][a-zA-Z\s.-]{2,20}),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/);

      if (abbrMatch) {
        const rawCity = abbrMatch[1].replace(/^(?:.*\b(?:in|near|at|of|the|located in|based in|campus in)\s+)?/i, '').trim();
        const state = abbrMatch[2].trim().toUpperCase();
        if (rawCity && rawCity.length > 2 && rawCity.split(/\s+/).length <= 3) {
          const location = `${rawCity}, ${state}`;
          locationCache.set(cleanQuery, location);
          return location;
        }
      }

      // 2. Match City, Full State Name (e.g. "Bolingbrook, Illinois" or "Houston, Texas")
      const fullStateRegex = new RegExp(`\\b([A-Z][a-zA-Z\\s.-]{2,20}),\\s*(${fullStateNamesPattern})\\b`, 'i');
      const fullMatch = snippetText.match(fullStateRegex);

      if (fullMatch) {
        const rawCity = fullMatch[1].replace(/^(?:.*\b(?:in|near|at|of|the|located in|based in|campus in)\s+)?/i, '').trim();
        const stateCode = STATE_NAME_TO_CODE[fullMatch[2].toLowerCase()];
        if (rawCity && rawCity.length > 2 && rawCity.split(/\s+/).length <= 3 && stateCode) {
          const location = `${rawCity}, ${stateCode}`;
          locationCache.set(cleanQuery, location);
          return location;
        }
      }
    }
  } catch {
    // Offline or network error
  }

  return '';
}
