/**
 * Email domain typo suggester utility.
 * Detects common mistyped domains (e.g. "gamil.com", "gmail.con", "yaho.com")
 * and suggests the corrected email address in real-time.
 */

const KNOWN_TYPO_MAP: Record<string, string> = {
  // Gmail typos
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaul.com': 'gmail.com',
  'gmaol.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmaile.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gamil.con': 'gmail.com',
  'gmial.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gmai.con': 'gmail.com',
  'gamil.co': 'gmail.com',

  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.con': 'yahoo.com',
  'yahu.com': 'yahoo.com',
  'yaho.com.ph': 'yahoo.com.ph',
  'yahooo.com.ph': 'yahoo.com.ph',
  'ymail.con': 'ymail.com',

  // Microsoft / Outlook / Hotmail typos
  'outlok.com': 'outlook.com',
  'ootlook.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlock.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmial.con': 'hotmail.com',

  // Apple iCloud typos
  'iclud.com': 'icloud.com',
  'icld.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icoud.com': 'icloud.com',
};

const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.com.ph', 'outlook.com', 'hotmail.com', 'icloud.com'];

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Checks an email address for common typos in the domain part.
 * Returns the suggested corrected email, or null if no obvious typo is found.
 */
export function getEmailSuggestion(email: string): string | null {
  if (!email || typeof email !== 'string') return null;

  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf('@');

  // Must have a valid username and a domain part
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return null;

  const username = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();

  // If domain is already one of the exact popular domains, no suggestion needed
  if (POPULAR_DOMAINS.includes(domain)) return null;

  // 1. Direct dictionary match (instant, highly accurate)
  if (KNOWN_TYPO_MAP[domain]) {
    return `${username}@${KNOWN_TYPO_MAP[domain]}`;
  }

  // 2. Check for common TLD mistakes (e.g., user@domain.con -> user@domain.com)
  const tldTypos = ['.con', '.cmo', '.comm', '.coom', '.ckm', '.cpm'];
  for (const typo of tldTypos) {
    if (domain.endsWith(typo)) {
      const fixedDomain = domain.slice(0, -typo.length) + '.com';
      return `${username}@${fixedDomain}`;
    }
  }

  // 3. Distance check for close match (Levenshtein distance <= 2) against popular domains
  // Only check if the domain looks like an attempt at one of the popular domains
  if (domain.length >= 4) {
    for (const pop of POPULAR_DOMAINS) {
      const dist = levenshteinDistance(domain, pop);
      if (dist > 0 && dist <= 2) {
        return `${username}@${pop}`;
      }
    }
  }

  return null;
}
