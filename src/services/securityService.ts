/**
 * Strix Defensive Security & Sanitization Service
 * 
 * Enforces enterprise-grade security standards for TalentMatch ATS:
 * 1. Dual Honeypot verification (botcheck + _gotcha decoy)
 * 2. Speed-trap defense (rejects sub-1.8s bot completions)
 * 3. OWASP Top 10 input sanitization (HTML, script, null-byte, and javascript: URI stripping)
 * 4. Strict input length boundaries to prevent memory exhaustion / payload stuffing
 * 5. Prototype pollution prevention for JSON parsing and object merging
 * 6. Rate-limiting for client state actions and submission cooldowns
 */

/**
 * Strips all HTML/XML tags, javascript: pseudo-protocols, and null-bytes.
 * Enforces strict maxLength boundaries.
 */
export function sanitizeInput(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input).slice(0, maxLength);
  }

  return input
    // Strip <script>, <style>, <iframe>, <object>, <embed> tags AND their inner contents
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gmi, '')
    // Strip any lingering self-closing or remaining HTML/XML/SVG tags
    .replace(/<[^>]*>?/gm, '')
    // Strip null bytes and control chars (except standard newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Neutralize javascript: or vbscript: pseudo-protocols
    .replace(/(?:javascript|vbscript|data):/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates whether an email conforms to safe, RFC-compatible format without injection chars
 */
export function sanitizeEmail(email: unknown, maxLength = 120): string {
  const sanitized = sanitizeInput(email, maxLength).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Prototype pollution safe keys blacklist
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively deep-sanitizes an object or array.
 * Rejects prototype pollution keys and sanitizes all primitive strings.
 */
export function sanitizeObject<T>(target: T, depth = 0): T {
  if (depth > 12) return target; // Prevent deep stack recursion
  if (!target || typeof target !== 'object') {
    if (typeof target === 'string') {
      return sanitizeInput(target, 4000) as unknown as T;
    }
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(item => sanitizeObject(item, depth + 1)) as unknown as T;
  }

  const cleanObj: Record<string, any> = Object.create(null);

  for (const [key, val] of Object.entries(target)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue; // Silently drop prototype pollution vectors
    }
    const cleanKey = sanitizeInput(key, 100);
    cleanObj[cleanKey] = sanitizeObject(val, depth + 1);
  }

  return cleanObj as T;
}

/**
 * Prototype pollution safe JSON parser with size limits
 */
export function safeJsonParse<T>(jsonString: string, fallback: T, maxByteLength = 10 * 1024 * 1024): T {
  try {
    if (!jsonString || typeof jsonString !== 'string') return fallback;
    if (jsonString.length > maxByteLength) {
      console.warn('[Security] JSON payload exceeded maximum safe size limit:', jsonString.length);
      return fallback;
    }

    const parsed = JSON.parse(jsonString, (key, value) => {
      if (FORBIDDEN_KEYS.has(key)) {
        return undefined; // Drop polluted prototype keys
      }
      return value;
    });

    if (parsed && typeof parsed === 'object') {
      return sanitizeObject(parsed);
    }

    return parsed ?? fallback;
  } catch (err) {
    console.warn('[Security] safeJsonParse caught invalid JSON syntax:', err);
    return fallback;
  }
}

/**
 * Strix Dual Honeypot & Speed Trap Checker
 * Detects automated bots and spam scripts.
 */
export interface BotCheckOptions {
  botcheck?: boolean | string;
  _gotcha?: string;
  formStartTime?: number;
  minDurationMs?: number; // default 1800ms (1.8s)
}

export function isBotSubmission(options: BotCheckOptions): boolean {
  // 1. Dual Honeypot check
  if (options.botcheck === true || options.botcheck === 'true' || options.botcheck === 'on') {
    return true;
  }
  if (typeof options._gotcha === 'string' && options._gotcha.trim().length > 0) {
    return true;
  }

  // 2. Speed-trap defense: Completed faster than 1.8 seconds indicates non-human automation
  if (options.formStartTime && typeof options.formStartTime === 'number') {
    const elapsed = Date.now() - options.formStartTime;
    const minTime = options.minDurationMs ?? 1800;
    if (elapsed > 0 && elapsed < minTime) {
      return true;
    }
  }

  return false;
}

/**
 * In-memory client rate limiter to protect local state / API calls from rapid spam
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  actionKey: string,
  maxAttempts = 30,
  windowMs = 60000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(actionKey);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(actionKey, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterSeconds: 0,
  };
}
