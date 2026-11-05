/**
 * Live Facility Location Resolver
 * 
 * Fetches the real geographic location (City, State) of a healthcare facility
 * from the internet using the free Wikipedia API when missing on a resume.
 * Zero fabricated or hardcoded facility lists.
 */

const locationCache = new Map<string, string>();

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
    const firstHit = data.query?.search?.[0];
    if (!firstHit) return '';

    const snippetText = `${firstHit.title} ${firstHit.snippet}`.replace(/<[^>]+>/g, ' ');

    // Match City, State abbreviation (e.g., "Sacramento, CA" or "Houston, TX")
    const match = snippetText.match(/\b([A-Z][a-zA-Z\s.-]{2,20}),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/);

    if (match) {
      const city = match[1].trim();
      const state = match[2].trim().toUpperCase();
      const location = `${city}, ${state}`;
      locationCache.set(cleanQuery, location);
      return location;
    }
  } catch {
    // Offline or network error
  }

  return '';
}
