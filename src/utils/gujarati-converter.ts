/**
 * Gujarati Gopika Font to Unicode Converter
 *
 * This utility converts text encoded in Gopika Gujarati font
 * to standard Unicode Gujarati characters.
 *
 * Gopika fonts are legacy fonts that use ASCII codes mapped to
 * Gujarati glyphs. This converter maps them to proper Unicode.
 */

// Gopika Two font character mapping to Unicode Gujarati
const gopikaToUnicodeMap: Record<string, string> = {
  // Vowels (Swar)
  a: 'અ',
  A: 'આ',
  i: 'ઇ',
  I: 'ઈ',
  u: 'ઉ',
  U: 'ઊ',
  e: 'એ',
  E: 'ઐ',
  o: 'ઓ',
  O: 'ઔ',

  // Consonants (Vyanjan)
  k: 'ક',
  K: 'ખ',
  g: 'ગ',
  G: 'ઘ',
  '|': 'ઙ',
  c: 'ચ',
  C: 'છ',
  j: 'જ',
  J: 'ઝ',
  '\\': 'ઞ',
  t: 'ટ',
  T: 'ઠ',
  d: 'ડ',
  D: 'ઢ',
  N: 'ણ',
  q: 'ત',
  Q: 'થ',
  w: 'દ',
  W: 'ધ',
  n: 'ન',
  p: 'પ',
  P: 'ફ',
  b: 'બ',
  B: 'ભ',
  m: 'મ',
  y: 'ય',
  r: 'ર',
  l: 'લ',
  v: 'વ',
  s: 'સ',
  S: 'શ',
  z: 'ષ',
  h: 'હ',
  L: 'ળ',
  x: 'ક્ષ',
  X: 'જ્ઞ',

  // Matras (Vowel signs)
  f: 'ા', // aa matra
  F: 'ી', // ii matra
  Z: 'ુ', // u matra
  ';': 'ૂ', // uu matra
  '[': 'ે', // e matra
  ']': 'ૈ', // ai matra
  '{': 'ો', // o matra
  '}': 'ૌ', // au matra

  // Special signs
  M: 'ં', // anusvara
  ':': 'ઃ', // visarga
  '~': '્', // halant/virama

  // Numbers
  '0': '૦',
  '1': '૧',
  '2': '૨',
  '3': '૩',
  '4': '૪',
  '5': '૫',
  '6': '૬',
  '7': '૭',
  '8': '૮',
  '9': '૯',
};

// Extended mapping for common conjuncts and special characters
const gopikaExtendedMap: Record<string, string> = {
  '`': 'ઋ',
  '@': '્ર', // Subscript ra
  '#': 'રૂ',
  $: 'ર્', // Ra + halant
  '%': '૱', // Rupee sign
};

/**
 * Convert Gopika font encoded text to Unicode Gujarati
 */
export function convertGopikaToUnicode(gopikaText: string): string {
  if (!gopikaText) {
    return '';
  }

  let result = '';

  for (const char of gopikaText) {
    // Check extended map first
    if (gopikaExtendedMap[char]) {
      result += gopikaExtendedMap[char];
    }
    // Then check main map
    else if (gopikaToUnicodeMap[char]) {
      result += gopikaToUnicodeMap[char];
    }
    // Keep character as-is if not in map (punctuation, spaces, etc.)
    else {
      result += char;
    }
  }

  return result;
}

/**
 * Check if text appears to be Gopika font encoded
 * (heuristic based on character patterns)
 */
export function isGopikaEncoded(text: string): boolean {
  if (!text || text.length < 3) {
    return false;
  }

  // Count characters that are likely Gopika encoding
  let gopikaLikeChars = 0;
  let unicodeGujaratiChars = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);

    // Check if already Unicode Gujarati (0A80-0AFF)
    if (code >= 0x0a80 && code <= 0x0aff) {
      unicodeGujaratiChars++;
    }
    // Check if in Gopika mapping
    else if (gopikaToUnicodeMap[char] || gopikaExtendedMap[char]) {
      gopikaLikeChars++;
    }
  }

  // If already has Unicode Gujarati, probably not Gopika encoded
  if (unicodeGujaratiChars > text.length * 0.3) {
    return false;
  }

  // If high proportion of Gopika-like chars, likely encoded
  return gopikaLikeChars > text.length * 0.4;
}

/**
 * Smart convert - only converts if text appears to be Gopika encoded
 */
export function smartConvertGujarati(text: string): string {
  if (isGopikaEncoded(text)) {
    return convertGopikaToUnicode(text);
  }
  return text;
}
