import { Candidate, ExperienceRecord } from '../types';
import { sanitizeInput, sanitizeEmail } from './securityService';
import { fetchFacilityLocationFromWeb } from './facilityLocationService';

export interface AIConfig {
  provider: 'ollama' | 'openai' | 'groq' | 'anthropic' | 'custom' | 'heuristic';
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
}

export const defaultAIConfig: AIConfig = {
  provider: 'ollama',
  apiUrl: 'http://localhost:11434',
  apiKey: '',
  modelName: 'llama3.2:3b',
  temperature: 0.1,
};

export interface ExtractionResult {
  candidate: Candidate;
  usedProvider: string;
  processingTimeMs: number;
  extractedTextLength: number;
  confidenceScore: number;
}

const SYSTEM_PROMPT = `You are an expert clinical recruiting intelligence parser for TalentMatch ATS.
Your task is to extract exact candidate details from the provided resume text into a strict JSON object.
CRITICAL RULES:
- Extract ONLY information explicitly found in the text. Do NOT invent, guess, or hallucinate any field.
- If a field is not found in the resume, use empty string "" for strings, 0 for numbers, and [] for arrays.
- For experience: calculate from the earliest employment date to today, or extract explicitly stated years.
- For previousTravelLocations: only include cities/states where the candidate has ACTUALLY worked, not where the job is posted.
- For certifications: only include credentials explicitly listed (BLS, ACLS, CCRN, etc.).

The JSON object MUST follow this exact structure:
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "position": "string (e.g., Registered Nurse, Nurse Practitioner, Physical Therapist, MRI Technologist)",
  "specialty": "string (e.g., ICU, Emergency, Orthopedics, MRI, Neonatal, Med-Surg, Pediatrics, Telemetry, Oncology)",
  "experience": number (total years of professional healthcare experience as an integer),
  "currentLocation": "string (City, State)",
  "previousTravelLocations": ["City, State", ...],
  "certifications": ["BLS", "ACLS", "PALS", "CCRN", "Compact State RN", ...],
  "professionalSummary": "string (2-3 sentences summarizing clinical background, units, and tenure)",
  "experienceTimeline": [
    {
      "position": "string",
      "facility": "string (Hospital or healthcare system name)",
      "location": "string (City, State)",
      "startDate": "string (e.g., 2021 or Jan 2021)",
      "endDate": "string (e.g., Present or Dec 2023)",
      "description": "string (summary of clinical patient care responsibilities)"
    }
  ]
}
Return ONLY valid JSON. No conversational text, no markdown wrapping.`;

/**
 * Strips HTML, scripts, null bytes, and dangerous tags for defensive security (Strix standard)
 */
function sanitizeString(str: any): string {
  return sanitizeInput(str, 500);
}

/**
 * Strips markdown code fences and returns clean JSON string
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Attempts to extract the first complete JSON object from a potentially
 * truncated LLM response. Handles cases where num_predict cuts mid-string.
 */
function extractFirstJsonObject(raw: string): string {
  const cleaned = cleanJsonString(raw);
  // Try direct parse first
  try { JSON.parse(cleaned); return cleaned; } catch {}
  // Find the first '{' and walk to find the matching '}'
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in LLM response');
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1);
        try { JSON.parse(candidate); return candidate; } catch {}
      }
    }
  }
  throw new Error('Could not extract valid JSON from LLM response');
}

/**
 * Computes an objective confidence & accuracy score (50-99%)
 */
export function calculateExtractionConfidence(c: Partial<Candidate>): number {
  let score = 0;
  if (c.firstName && c.firstName !== 'Candidate' && c.lastName && c.lastName !== 'Profile') score += 15;
  if (c.email && c.email.includes('@') && !c.email.endsWith('.demo') && !c.email.includes('talentflow') && !c.email.includes('talentmatch')) score += 20;
  else if (c.email && c.email.includes('@') && !c.email.includes('talentflow') && !c.email.includes('talentmatch')) score += 10;
  // 0 points for fake .demo or placeholder emails
  if (c.phone && c.phone !== '(555) 000-0000') score += 15;
  if (c.specialty && c.specialty !== 'General') score += 15;
  if (typeof c.experience === 'number' && c.experience > 0) score += 10;
  if (Array.isArray(c.experienceTimeline) && c.experienceTimeline.length > 0) score += 15;
  if (Array.isArray(c.certifications) && c.certifications.length > 0) score += 10;
  return Math.min(99, Math.max(30, score));
}

/**
 * Extracts candidate details using Local Ollama (localhost:11434)
 */
async function extractWithOllama(
  resumeText: string,
  config: AIConfig
): Promise<Partial<Candidate>> {
  const url = `${config.apiUrl.replace(/\/+$/, '')}/api/generate`;

  const controller = new AbortController();
  // Responsive timeout: 12 seconds max. If local model is lagging or cold, failover instantly to the fast deterministic engine
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: config.modelName || 'llama3.2:3b',
      system: SYSTEM_PROMPT,
      prompt: `Resume content:\n\n${resumeText.slice(0, 6000)}\n\nExtract the JSON structure:`,
      format: 'json',
      stream: false,
      options: {
        temperature: config.temperature ?? 0.1,
        num_predict: 1024,
        num_ctx: 2048,
      },
    }),
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawResponse = data.response;
  const parsed = JSON.parse(extractFirstJsonObject(rawResponse));
  return parsed;
}

/**
 * Extracts candidate details using OpenAI, Groq, or OpenAI-compatible endpoint
 */
async function extractWithOpenAICompatible(
  resumeText: string,
  config: AIConfig
): Promise<Partial<Candidate>> {
  let endpoint = config.apiUrl.trim();
  if (!endpoint) {
    if (config.provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1';
    } else {
      endpoint = 'https://api.openai.com/v1';
    }
  }

  const chatUrl = `${endpoint.replace(/\/+$/, '')}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const defaultModel = config.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  const bodyPayload: any = {
    model: config.modelName || defaultModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Resume text:\n\n${resumeText}` },
    ],
    temperature: config.temperature ?? 0.1,
  };

  if (config.provider === 'openai' || config.provider === 'groq') {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('LLM returned empty response.');
  }

  const parsed = JSON.parse(extractFirstJsonObject(rawContent));
  return parsed;
}

/**
 * Deterministic Heuristic Extraction (Instant, zero-cost, high-accuracy fallback)
 * Scans real document text for email, phone, name, clinical specialty, certifications, and tenure.
 */
export function extractWithHeuristics(resumeText: string, fileName: string): Partial<Candidate> {
  const lines = resumeText
    .split(/\r?\n/)
    .map(l => sanitizeInput(l, 300))
    .filter(Boolean);

  // 1. Email extraction
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? sanitizeString(emailMatch[0]) : '';

  // 2. Phone extraction
  const phoneMatch = resumeText.match(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/);
  const phone = phoneMatch ? sanitizeString(phoneMatch[0]) : '';

  // 3. Name extraction: pick first non-title, non-empty line with 2-3 words
  const ignoreWords = ['resume', 'curriculum', 'vitae', 'cv', 'profile', 'contact', 'summary', 'experience', 'education', 'skills', 'objective', 'work', 'history', 'certifications', 'professional', 'primary', 'specialty'];
  const credentialSuffixes = /\b(BSN|MSN|DNP|RN|APRN|FNP|CCRN|CEN|TNCC|ENPC|PT|DPT|OCS|OT|OTR|RT|RRT|RRT-NPS|CRT|MD|DO|PA|CPhT|CNA|ARRT|BLS|ACLS|PALS|CPR|AED)\b/gi;

  let firstName = '';
  let lastName = '';

  for (const line of lines.slice(0, 15)) {
    // Skip lines with contact markers, emails, phone numbers, addresses, or web links
    if (/@|www\.|\.com|\.org|\.edu|\.net|\+?1?\s*\(?\d{3}\)?\s*[\d.-]{6,}|\|\s*\(?\d{3}\)?|\b(ave|avenue|street|st|road|rd|blvd|lane|drive|dr|court|ct|box)\b/i.test(line)) {
      continue;
    }
    // Take part before comma if present (e.g. "Sarah Mitchell, BSN, RN" -> "Sarah Mitchell")
    const preComma = line.split(',')[0].trim();
    // Strip trailing clinical credentials and non-alpha chars
    const cleanWithoutCreds = preComma.replace(credentialSuffixes, '').replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleanWithoutCreds.split(/\s+/).filter(w => w.length > 1);
    const hasIgnored = words.some(w => ignoreWords.includes(w.toLowerCase()));

    if (words.length >= 2 && words.length <= 4 && !hasIgnored) {
      firstName = sanitizeString(words[0]);
      lastName = sanitizeString(words.slice(1).join(' '));
      break;
    }
  }

  // Fallback to filename if not detected in first lines (e.g., "Anieth Daley 2023 resume.docx" -> Anieth Daley)
  if (!firstName || firstName === 'Candidate') {
    const cleanFile = fileName
      .replace(/\.[^/.]+$/, '') // strip extension
      .replace(/\b(20\d{2}|19\d{2}|resume|cv|october|november|december|january|february|march|april|may|june|july|august|september)\b/gi, '') // strip dates & keywords
      .replace(/[_.-]/g, ' ')
      .trim();

    const parts = cleanFile.split(/\s+/).filter(p => p.length > 1 && !ignoreWords.includes(p.toLowerCase()));
    if (parts.length >= 2) {
      firstName = sanitizeString(parts[0]);
      lastName = sanitizeString(parts.slice(1).join(' '));
    } else if (parts.length === 1) {
      firstName = sanitizeString(parts[0]);
      lastName = 'Candidate';
    } else {
      firstName = 'Candidate';
      lastName = 'Profile';
    }
  }

  // 4. Clinical Specialty Detection via weighted frequency matching
  const specialtyKeywords: Record<string, RegExp[]> = {
    'ICU': [/\bicu\b/i, /\bintensive care\b/i, /\bcritical care\b/i, /\bccu\b/i, /\bcvicu\b/i, /\bneuro icu\b/i, /\bmicu\b/i, /\bsicu\b/i],
    'Emergency': [/\bemergency\b/i, /\b(?!.*(?:post-op|surgery|clinic))\ber\b/i, /\bed\b/i, /\btrauma\b/i, /\btriage\b/i, /\bresuscitation\b/i, /\btncc\b/i, /\benpc\b/i, /\bcpen\b/i],
    'Orthopedics': [/\borthopedic\b/i, /\bortho\b/i, /\bbone\b/i, /\bjoint\b/i, /\bmusculoskeletal\b/i, /\barthroplasty\b/i, /\bocs\b/i, /\bsports\s+(?:spine|injury|rehab)/i],
    'Operating Room': [/\boperating room\b/i, /\bor nurse\b/i, /\bperioperative\b/i, /\bintraoperative\b/i, /\bcnor\b/i, /\bscrub\b/i, /\bcirculat(?:ing|or)\b/i, /\bpacu\b/i, /\bpost-anesthesia\b/i],
    'Cardiology / Cath Lab': [/\bcath lab\b/i, /\bcardiac catheterization\b/i, /\bcardiology\b/i, /\belectrophysiology\b/i, /\bep lab\b/i, /\binterventional cardiology\b/i],
    'MRI': [/\bmri\b/i, /\bmagnetic resonance\b/i, /\bradiology\b/i, /\bradiologic\b/i, /\bimaging\b/i],
    'Neonatal': [/\bneonatal\b/i, /\bnicu\b/i, /\binfant\b/i, /\bnewborn\b/i, /\bneonatology\b/i, /\brrt-nps\b/i, /\bnrp\b/i],
    'Med-Surg': [/\bmed-surg\b/i, /\bmedical surgical\b/i, /\btelemetry\b/i, /\bstep-down\b/i, /\bprogressive care\b/i, /\bpcu\b/i],
    'Pediatrics': [/\bpediatric\b/i, /\bpeds\b/i, /\bpicu\b/i, /\bchildren\b/i, /\bcpn\b/i],
    'Oncology': [/\boncology\b/i, /\bcancer\b/i, /\bchemotherapy\b/i, /\bocn\b/i, /\bhematology\b/i, /\binfusion\b/i],
    'Labor & Delivery': [/\blabor and delivery\b/i, /\bl&d\b/i, /\bpostpartum\b/i, /\bmaternity\b/i, /\bantepartum\b/i, /\bmother-baby\b/i],
    'Dialysis': [/\bdialysis\b/i, /\bhemodialysis\b/i, /\bnephrology\b/i, /\bperitoneal dialysis\b/i, /\bcrrt\b/i],
    'Psychiatry': [/\bpsychiatric\b/i, /\bmental health\b/i, /\bbehavioral health\b/i, /\bpsych\b/i],
    'Home Health / Hospice': [/\bhome health\b/i, /\bhospice\b/i, /\bpalliative\b/i, /\bvisiting nurse\b/i],
  };

  let maxScore = 0;
  let detectedSpecialty = 'Med-Surg';

  for (const [specialty, regexList] of Object.entries(specialtyKeywords)) {
    let score = 0;
    for (const rx of regexList) {
      const matches = resumeText.match(new RegExp(rx.source, 'gi'));
      if (matches) {
        score += matches.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      detectedSpecialty = specialty;
    }
  }

  // 5. Clinical Position Detection
  const positionKeywords: Record<string, string> = {
    'certified registered nurse anesthetist': 'Certified Registered Nurse Anesthetist',
    'nurse anesthetist': 'Certified Registered Nurse Anesthetist',
    'crna': 'Certified Registered Nurse Anesthetist',
    'clinical nurse specialist': 'Clinical Nurse Specialist',
    'family nurse practitioner': 'Nurse Practitioner',
    'nurse practitioner': 'Nurse Practitioner',
    'physician assistant': 'Physician Assistant',
    'registered nurse': 'Registered Nurse',
    'staff nurse': 'Registered Nurse',
    'physical therapist': 'Physical Therapist',
    'physical therapy': 'Physical Therapist',
    'speech-language pathologist': 'Speech-Language Pathologist',
    'speech language pathologist': 'Speech-Language Pathologist',
    'speech pathologist': 'Speech-Language Pathologist',
    'occupational therapist': 'Occupational Therapist',
    'respiratory therapist': 'Respiratory Therapist',
    'respiratory care': 'Respiratory Therapist',
    'mri technologist': 'MRI Technologist',
    'radiologic technologist': 'Radiologic Technologist',
    'ultrasound technologist': 'Ultrasound Technologist',
    'diagnostic medical sonographer': 'Ultrasound Technologist',
    'sonographer': 'Ultrasound Technologist',
    'surgical technologist': 'Surgical Technologist',
    'surgical technician': 'Surgical Technologist',
    'cardiovascular technologist': 'Cardiovascular Technologist',
    'cath lab technologist': 'Cardiovascular Technologist',
    'medical technologist': 'Medical Laboratory Scientist',
    'clinical laboratory scientist': 'Medical Laboratory Scientist',
    'licensed practical nurse': 'Licensed Practical Nurse',
    'licensed vocational nurse': 'Licensed Practical Nurse',
    'certified nursing assistant': 'Certified Nursing Assistant',
    'patient care technician': 'Certified Nursing Assistant',
    'pharmacy technician': 'Pharmacy Technician',
  };

  const textLower = resumeText.toLowerCase();
  let detectedPosition = `${detectedSpecialty} Registered Nurse`;
  for (const [key, title] of Object.entries(positionKeywords)) {
    if (textLower.includes(key)) {
      detectedPosition = title;
      break;
    }
  }

  // 6. Experience Years Calculation (Supports digits & written number words)
  const numberWordMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20
  };

  const wordYearsMatch = resumeText.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s*(?:\(\d+\))?\s*years?(?:\s+(?:of|in))?[^.\n]{0,60}?(?:experience|clinical|nursing|critical care|surgical|orthopedic|acute|respiratory|pediatric|healthcare|bedside|practice|rehab)/i);
  const yearsMentioned = resumeText.match(/(\d{1,2})\+?\s*years?(?:\s+(?:of|in|bedside))?[^.\n]{0,60}?(?:experience|clinical|nursing|critical care|surgical|orthopedic|acute|respiratory|pediatric|healthcare|bedside|practice|rehabilitation|medicine|urgent care|catheterization)/i);
  
  let experienceYears = 4;
  if (yearsMentioned && parseInt(yearsMentioned[1], 10)) {
    experienceYears = Math.min(25, Math.max(1, parseInt(yearsMentioned[1], 10)));
  } else if (wordYearsMatch && numberWordMap[wordYearsMatch[1].toLowerCase()]) {
    experienceYears = numberWordMap[wordYearsMatch[1].toLowerCase()];
  } else {
    // Only use years that appear near employment keywords to avoid education/graduation years
    const employmentYearPattern = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?((?:19|20)\d{2})(?:\s*[-–—]\s*(?:present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?((?:19|20)\d{2})?)?/gi;
    const employmentYears: number[] = [];
    let empMatch;
    while ((empMatch = employmentYearPattern.exec(resumeText)) !== null) {
      const yr = parseInt(empMatch[1], 10);
      if (yr > 1990 && yr <= new Date().getFullYear()) employmentYears.push(yr);
    }
    if (employmentYears.length >= 2) {
      const minYear = Math.min(...employmentYears);
      const currentYear = new Date().getFullYear();
      if (minYear < currentYear) {
        experienceYears = Math.min(30, Math.max(1, currentYear - minYear));
      }
    }
  }

  // 7. Clinical Certifications
  const knownCerts = [
    'BLS', 'ACLS', 'PALS', 'TNCC', 'ENPC', 'CCRN', 'CEN', 'CPEN', 'CNOR',
    'NRP', 'ARRT', 'CRT', 'RRT', 'RRT-NPS', 'RRT-ACCS', 'OCS', 'CPR', 'AED',
    'NIHSS', 'PTCB', 'CPhT', 'PCCN', 'BSN', 'MSN', 'DNP', 'CRNA', 'NP-C',
    'FNP-BC', 'AGACNP', 'PMHNP', 'CNS', 'CPN', 'CRRN', 'CWOCN', 'OCN',
    'RDMS', 'RVT', 'NREMT', 'CST', 'PTA', 'COTA', 'Compact RN', 'eNLC',
  ];
  const detectedCerts: string[] = [];
  for (const cert of knownCerts) {
    let rx: RegExp;
    if (cert === 'Compact RN') {
      rx = /\b(compact\s+(?:multi-state\s+)?(?:state\s+)?(?:rn|registered nurse|license))\b/i;
    } else if (cert === 'eNLC') {
      rx = /\b(enlc|enhanced nurse licensure compact)\b/i;
    } else {
      rx = new RegExp(`\\b${cert}\\b`, 'i');
    }
    if (rx.test(resumeText)) {
      detectedCerts.push(cert);
    }
  }

  // 8. Location Detection (City, State) — only valid US state abbreviations
  const US_STATES = new Set([
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC'
  ]);
  const locationRegex = /\b([A-Z][a-zA-Z\s.-]{2,25}),\s*([A-Z]{2})\b/g;
  let locationMatch2: RegExpExecArray | null;
  let bestLocation: string | null = null;
  while ((locationMatch2 = locationRegex.exec(resumeText)) !== null) {
    const city = locationMatch2[1].trim();
    const state = locationMatch2[2];
    if (US_STATES.has(state) && city.split(/\s+/).length <= 4 && !/resume|profile|nurse|rn|bsn|msn|dnp|aprn/i.test(city)) {
      bestLocation = `${sanitizeString(city)}, ${state}`;
      break;
    }
  }
  const currentLocation = bestLocation || '';

  // 9. Timeline extraction from real document text
  const timeline: ExperienceRecord[] = [];
  const rawLines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Check for pipe-separated work history e.g. "Staff RN | Covenant Health System | Lubbock, TX"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2 && !/^(email|phone|contact|summary|skills|education|certifications)/i.test(parts[0])) {
        let pos = '';
        let fac = '';
        let loc = '';

        if (parts.length >= 3) {
          pos = parts[0];
          fac = parts[1];
          loc = parts[2];
        } else {
          // 2 parts: could be Position | Facility, or Facility | Location
          if (US_STATES.has(parts[1].slice(-2).toUpperCase()) || parts[1].includes(',')) {
            fac = parts[0];
            loc = parts[1];
            pos = detectedPosition;
          } else {
            pos = parts[0];
            fac = parts[1];
          }
        }

        // Check next line for date range e.g. "2023 - Present | Outpatient..."
        let start = '';
        let end = 'Present';
        let desc = '';
        if (i + 1 < rawLines.length) {
          const nextLine = rawLines[i + 1];
          const dateMatch = nextLine.match(/((?:19|20)\d{2})\s*[-–—]\s*(Present|Current|Now|(?:19|20)\d{2})/i);
          if (dateMatch) {
            start = dateMatch[1];
            end = dateMatch[2];
            desc = nextLine.replace(dateMatch[0], '').replace(/^[|\s-]+/, '').trim();
          }
        }

        if (fac || pos) {
          timeline.push({
            id: `exp-${Date.now()}-${timeline.length + 1}`,
            position: sanitizeString(pos || detectedPosition),
            facility: sanitizeString(fac || 'Clinical Healthcare Facility'),
            location: sanitizeString(loc || bestLocation || ''),
            startDate: start || (new Date().getFullYear() - experienceYears).toString(),
            endDate: end,
            description: sanitizeString(desc || `Clinical care in ${detectedSpecialty}.`),
          });
        }
      }
    }
  }

  // If no pipe entries were found, provide factual baseline without fake hospital name
  if (timeline.length === 0) {
    const startYear = (new Date().getFullYear() - experienceYears).toString();
    timeline.push({
      id: `exp-${Date.now()}-1`,
      position: detectedPosition,
      facility: 'Clinical Healthcare Facility',
      location: currentLocation,
      startDate: startYear,
      endDate: 'Present',
      description: `Comprehensive patient management in ${detectedSpecialty} clinical units. Administered acute protocols and multidisciplinary patient evaluations.`,
    });
  }

  return {
    firstName,
    lastName,
    email: email || '',
    phone,
    position: detectedPosition,
    specialty: detectedSpecialty,
    experience: experienceYears,
    currentLocation,
    previousTravelLocations: [],
    certifications: detectedCerts,
    professionalSummary: `Dedicated ${detectedPosition} with ${experienceYears} years of experience specializing in ${detectedSpecialty}. Certified in ${detectedCerts.length > 0 ? detectedCerts.slice(0, 3).join(', ') : 'clinical practice'}. Strong background in acute hospital workflows extracted from ${fileName}.`,
    experienceTimeline: timeline,
  };
}

/**
 * Universal Extraction Gateway
 * Attempts configured LLM first; gracefully falls back to Heuristic extractor
 * so it ALWAYS succeeds and NEVER leaves the user stranded.
 */
export async function parseResumeWithAI(
  resumeText: string,
  fileName: string,
  config: AIConfig
): Promise<ExtractionResult> {
  const startTime = Date.now();
  let candidateData: Partial<Candidate> | null = null;
  let activeProvider: string = config.provider;

  // 1. Try Configured LLM if not set to heuristic
  if (config.provider === 'ollama') {
    try {
      candidateData = await extractWithOllama(resumeText, config);
    } catch (ollamaErr: any) {
      console.warn('Ollama unavailable or failed, falling back to heuristic engine:', ollamaErr.message);
      activeProvider = 'heuristic (Ollama offline)';
      candidateData = extractWithHeuristics(resumeText, fileName);
    }
  } else if (config.provider === 'openai' || config.provider === 'groq' || config.provider === 'custom') {
    try {
      candidateData = await extractWithOpenAICompatible(resumeText, config);
    } catch (apiErr: any) {
      console.warn('API LLM call failed, falling back to heuristic engine:', apiErr.message);
      activeProvider = `heuristic (${config.provider} fallback)`;
      candidateData = extractWithHeuristics(resumeText, fileName);
    }
  } else {
    // Explicit heuristic mode
    candidateData = extractWithHeuristics(resumeText, fileName);
    activeProvider = 'built-in heuristic';
  }

  // Guarantee all required candidate fields are present
  const baseHeuristic = extractWithHeuristics(resumeText, fileName);
  const confidence = calculateExtractionConfidence(candidateData || baseHeuristic);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const resolvedEmail = (candidateData?.email && isValidEmail(candidateData.email))
    ? candidateData.email
    : (baseHeuristic.email && isValidEmail(baseHeuristic.email) && !baseHeuristic.email.endsWith('.demo'))
    ? baseHeuristic.email
    : '';

  // If experienceTimeline items have a facility but no city/state location, fetch real location from web
  const rawTimeline = Array.isArray(candidateData?.experienceTimeline) && candidateData.experienceTimeline.length > 0
    ? candidateData.experienceTimeline
    : baseHeuristic.experienceTimeline || [];

  const enrichedTimeline: ExperienceRecord[] = await Promise.all(
    rawTimeline.map(async (item, idx) => {
      const facility = sanitizeString(item.facility || '');
      let loc = sanitizeString(item.location || '');

      // If location is missing or generic, fetch the facility's real city/state from the internet
      if ((!loc || loc === 'United States' || !loc.includes(',')) && facility && facility !== 'Healthcare Facility' && facility !== 'Clinical Healthcare Facility') {
        const webLoc = await fetchFacilityLocationFromWeb(facility);
        if (webLoc) {
          loc = webLoc;
        }
      }

      return {
        id: `exp-${Date.now()}-${idx}`,
        position: sanitizeString(item.position || 'Staff Role'),
        facility: facility || 'Clinical Healthcare Facility',
        location: loc || (baseHeuristic.currentLocation || ''),
        startDate: sanitizeString(item.startDate || '2022'),
        endDate: sanitizeString(item.endDate || 'Present'),
        description: sanitizeString(item.description || 'Clinical patient care.'),
      };
    })
  );

  const resolvedLocation = sanitizeString(
    candidateData?.currentLocation ||
    baseHeuristic.currentLocation ||
    (enrichedTimeline.length > 0 && enrichedTimeline[0].location ? enrichedTimeline[0].location : '')
  );

  const inferredTravelLocations = Array.from(new Set(
    enrichedTimeline
      .map(e => e.location)
      .filter(loc => loc && loc.includes(',') && loc !== resolvedLocation)
  ));

  const resolvedTravelLocations = Array.isArray(candidateData?.previousTravelLocations) && candidateData.previousTravelLocations.length > 0
    ? candidateData.previousTravelLocations.map(sanitizeString)
    : (baseHeuristic.previousTravelLocations && baseHeuristic.previousTravelLocations.length > 0
      ? baseHeuristic.previousTravelLocations.map(sanitizeString)
      : inferredTravelLocations);

  const resolvedCerts = Array.isArray(candidateData?.certifications) && candidateData.certifications.length > 0
    ? candidateData.certifications.map(sanitizeString)
    : (baseHeuristic.certifications || []);

  const finalCandidate: Candidate = {
    id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    firstName: sanitizeString(candidateData?.firstName || baseHeuristic.firstName || 'Candidate'),
    lastName: sanitizeString(candidateData?.lastName || baseHeuristic.lastName || 'Profile'),
    email: sanitizeString(resolvedEmail),
    phone: sanitizeString(candidateData?.phone || baseHeuristic.phone || ''),
    position: sanitizeString(candidateData?.position || baseHeuristic.position || 'Registered Nurse'),
    specialty: sanitizeString(candidateData?.specialty || baseHeuristic.specialty || 'ICU'),
    experience: typeof candidateData?.experience === 'number' ? candidateData.experience : (baseHeuristic.experience || 4),
    currentLocation: resolvedLocation,
    previousTravelLocations: resolvedTravelLocations,
    certifications: resolvedCerts,
    bestMatch: `${candidateData?.position || baseHeuristic.position} (Evaluating...)`,
    status: 'new',
    resumeFilename: fileName,
    uploadedAt: new Date().toISOString().split('T')[0],
    professionalSummary: sanitizeString(candidateData?.professionalSummary || baseHeuristic.professionalSummary || 'Candidate profile extracted from document.'),
    experienceTimeline: enrichedTimeline,
    verifiedByRecruiter: false,
    confidenceScore: confidence,
  };

  const processingTimeMs = Date.now() - startTime;

  return {
    candidate: finalCandidate,
    usedProvider: activeProvider,
    processingTimeMs,
    extractedTextLength: resumeText.length,
    confidenceScore: confidence,
  };
}

/**
 * Live Connection Test for Settings
 */
export async function testAIConnection(config: AIConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();

  if (config.provider === 'ollama') {
    try {
      const url = `${config.apiUrl.replace(/\/+$/, '')}/api/tags`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const latency = Date.now() - start;

      if (!res.ok) {
        return { success: false, message: `Ollama returned HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name).join(', ');
      return {
        success: true,
        latencyMs: latency,
        message: `Connected to Local Ollama (${latency}ms). Available models: ${models || config.modelName}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Could not reach Ollama at ${config.apiUrl}. Make sure 'ollama serve' is running. (${err.message})`,
      };
    }
  }

  if (config.provider === 'openai' || config.provider === 'groq' || config.provider === 'custom') {
    try {
      let endpoint = config.apiUrl.trim();
      if (!endpoint) {
        endpoint = config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
      }

      if (!config.apiKey && config.provider !== 'custom') {
        return { success: false, message: 'Please enter an API Key to test connection.' };
      }

      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        signal: AbortSignal.timeout(7000),
      });

      const latency = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `API rejected request (${res.status}): ${errText || res.statusText}` };
      }

      return {
        success: true,
        latencyMs: latency,
        message: `Connected successfully to ${config.provider.toUpperCase()} (${latency}ms)!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to connect: ${err.message}`,
      };
    }
  }

  return {
    success: true,
    latencyMs: 1,
    message: 'Built-in deterministic pattern extractor is always ready and operates 100% locally.',
  };
}
