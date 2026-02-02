/**
 * Author Persona System
 *
 * Generates realistic medical tourism interpreter personas
 * for blog post authorship.
 */

// =====================================================
// TYPES
// =====================================================

export interface AuthorPersona {
  name: string;                  // Korean name
  name_en: string;               // English name
  name_local: Record<string, string>; // Localized names
  years_of_experience: number;   // 5-20 years
  specialties: string[];         // Medical specialties
  languages: string[];           // Spoken languages
  certifications: string[];      // Qualifications
  bio: string;                   // Korean bio
  bio_en: string;                // English bio
  bio_local: Record<string, string>; // Localized bios
  photo_url?: string;            // Profile photo (optional)
  writing_style: {
    tone: 'professional' | 'friendly' | 'expert' | 'casual';
    perspective: 'first-person' | 'third-person';
    expertise_level: 'beginner' | 'intermediate' | 'expert';
  };
}

// =====================================================
// DATA
// =====================================================

// Korean names (family name + given name)
const KOREAN_NAMES = [
  { family: '김', given: '서연', en: 'Kim Seo-yeon' },
  { family: '이', given: '민준', en: 'Lee Min-joon' },
  { family: '박', given: '지우', en: 'Park Ji-woo' },
  { family: '최', given: '하은', en: 'Choi Ha-eun' },
  { family: '정', given: '준호', en: 'Jung Joon-ho' },
  { family: '강', given: '수빈', en: 'Kang Soo-bin' },
  { family: '조', given: '예은', en: 'Cho Ye-eun' },
  { family: '윤', given: '시우', en: 'Yoon Si-woo' },
  { family: '장', given: '하린', en: 'Jang Ha-rin' },
  { family: '임', given: '도윤', en: 'Im Do-yoon' },
  { family: '한', given: '서준', en: 'Han Seo-joon' },
  { family: '오', given: '수아', en: 'Oh Soo-ah' },
  { family: '서', given: '지훈', en: 'Seo Ji-hoon' },
  { family: '신', given: '유진', en: 'Shin Yoo-jin' },
  { family: '권', given: '민서', en: 'Kwon Min-seo' },
];

// Medical specialties
const SPECIALTIES: Record<string, { ko: string; en: string }> = {
  'plastic-surgery': { ko: '성형외과', en: 'Plastic Surgery' },
  'dermatology': { ko: '피부과', en: 'Dermatology' },
  'dental': { ko: '치과', en: 'Dental Care' },
  'health-checkup': { ko: '건강검진', en: 'Health Checkup' },
  'ophthalmology': { ko: '안과', en: 'Ophthalmology' },
  'orthopedics': { ko: '정형외과', en: 'Orthopedics' },
  'fertility': { ko: '난임치료', en: 'Fertility Treatment' },
  'hair-transplant': { ko: '모발이식', en: 'Hair Transplant' },
  'general': { ko: '종합의료', en: 'General Medical' },
};

// Common certifications
const CERTIFICATIONS = [
  { ko: 'TOPIK 6급 (한국어능력시험)', en: 'TOPIK Level 6' },
  { ko: '의료통역사 자격증', en: 'Medical Interpreter Certification' },
  { ko: '국제의료관광코디네이터', en: 'International Medical Tourism Coordinator' },
  { ko: '간호사 면허', en: 'Registered Nurse License' },
  { ko: '보건의료통역사', en: 'Healthcare Interpreter' },
  { ko: 'TOEIC 950점 이상', en: 'TOEIC 950+' },
  { ko: 'JLPT N1 (일본어능력시험)', en: 'JLPT N1' },
  { ko: 'HSK 6급 (중국어능력시험)', en: 'HSK Level 6' },
];

// Language combinations (beyond Korean)
const LANGUAGE_COMBINATIONS = [
  ['English', 'Chinese'],
  ['English', 'Japanese'],
  ['English', 'Thai'],
  ['Chinese', 'Japanese'],
  ['English', 'Russian'],
  ['English', 'Mongolian'],
  ['Chinese', 'English', 'Japanese'], // Trilingual
  ['English', 'Thai', 'Chinese'],     // Trilingual
];

// =====================================================
// GENERATION FUNCTIONS
// =====================================================

/**
 * Generate a random author persona
 */
export function generateAuthorPersona(
  category: string = 'general',
  seed?: number
): AuthorPersona {
  // Use seed for reproducibility
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  // Select name
  const nameData = KOREAN_NAMES[Math.floor(random() * KOREAN_NAMES.length)];
  const name = `${nameData.family}${nameData.given}`;
  const name_en = nameData.en;

  // Years of experience (5-20 years, weighted towards middle)
  const yearsOfExperience = 5 + Math.floor(random() * 16);

  // Select specialties (1-3)
  const specialtyCount = random() < 0.6 ? 1 : random() < 0.9 ? 2 : 3;
  const specialties: string[] = [];

  // Primary specialty based on category
  if (category !== 'general' && SPECIALTIES[category]) {
    specialties.push(SPECIALTIES[category].ko);
  } else {
    // Random specialty
    const specKeys = Object.keys(SPECIALTIES);
    specialties.push(SPECIALTIES[specKeys[Math.floor(random() * specKeys.length)]].ko);
  }

  // Additional specialties
  while (specialties.length < specialtyCount) {
    const specKeys = Object.keys(SPECIALTIES);
    const spec = SPECIALTIES[specKeys[Math.floor(random() * specKeys.length)]].ko;
    if (!specialties.includes(spec)) {
      specialties.push(spec);
    }
  }

  // Select languages (always includes Korean + 2-4 others)
  const langCombo = LANGUAGE_COMBINATIONS[Math.floor(random() * LANGUAGE_COMBINATIONS.length)];
  const languages = ['Korean', ...langCombo];

  // Select certifications (2-4)
  const certCount = 2 + Math.floor(random() * 3);
  const certifications: string[] = [];
  const shuffledCerts = [...CERTIFICATIONS].sort(() => random() - 0.5);
  for (let i = 0; i < certCount && i < shuffledCerts.length; i++) {
    certifications.push(shuffledCerts[i].ko);
  }

  // Writing style
  const writingStyle = {
    tone: (['professional', 'friendly', 'expert'] as const)[Math.floor(random() * 3)],
    perspective: 'first-person' as const,
    expertise_level: yearsOfExperience < 8 ? 'intermediate' as const :
                     yearsOfExperience < 15 ? 'expert' as const : 'expert' as const,
  };

  // Generate bios
  const bio = generateBio(name, yearsOfExperience, specialties, languages, certifications, 'ko');
  const bio_en = generateBio(name_en, yearsOfExperience, specialties, languages, certifications, 'en');

  // Localized names (simple transliteration)
  const name_local = {
    'zh-CN': pinyinName(name_en),
    'zh-TW': pinyinName(name_en),
    'ja': katakanaName(name_en),
    'th': transliterateName(name_en),
    'ru': cyrillicName(name_en),
    'mn': cyrillicName(name_en),
  };

  // Localized bios (simplified - in production, use proper translation)
  const bio_local: Record<string, string> = {};
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'th', 'ru', 'mn']) {
    bio_local[locale] = bio_en; // Fallback to English (should be translated)
  }

  return {
    name,
    name_en,
    name_local,
    years_of_experience: yearsOfExperience,
    specialties,
    languages,
    certifications,
    bio,
    bio_en,
    bio_local,
    writing_style: writingStyle,
  };
}

/**
 * Generate bio text
 */
function generateBio(
  name: string,
  years: number,
  specialties: string[],
  languages: string[],
  certifications: string[],
  locale: 'ko' | 'en'
): string {
  if (locale === 'ko') {
    return `안녕하세요, ${name}입니다. ${years}년간 한국 의료 관광 통역사로 활동하며 ${specialties.join(', ')} 분야를 전문으로 다루고 있습니다. ${languages.slice(0, 3).join(', ')} 등 ${languages.length}개 언어를 구사하며, ${certifications[0]} 등의 자격을 보유하고 있습니다. 해외 환자분들이 한국에서 안전하고 만족스러운 의료 서비스를 받으실 수 있도록 정확한 정보와 세심한 케어를 제공하겠습니다.`;
  } else {
    return `Hello, I'm ${name}. With ${years} years of experience as a medical tourism interpreter in South Korea, I specialize in ${specialties.join(', ')}. I speak ${languages.slice(0, 3).join(', ')} (${languages.length} languages total) and hold certifications including ${certifications[0]}. I'm dedicated to helping international patients receive safe and satisfying medical services in Korea through accurate information and attentive care.`;
  }
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Simple Pinyin name (placeholder)
 */
function pinyinName(name: string): string {
  // Simplified - in production, use proper romanization
  return name;
}

/**
 * Simple Katakana name (placeholder)
 */
function katakanaName(name: string): string {
  // Simplified - in production, use proper conversion
  const katakanaMap: Record<string, string> = {
    'Kim': 'キム',
    'Lee': 'リ',
    'Park': 'パク',
    'Choi': 'チェ',
    'Jung': 'チョン',
    'Kang': 'カン',
    'Cho': 'チョ',
    'Yoon': 'ユン',
    'Jang': 'チャン',
    'Im': 'イム',
    'Han': 'ハン',
    'Oh': 'オ',
    'Seo': 'ソ',
    'Shin': 'シン',
    'Kwon': 'クォン',
  };

  const parts = name.split(' ');
  return parts.map(p => katakanaMap[p] || p).join(' ');
}

/**
 * Simple transliteration (placeholder)
 */
function transliterateName(name: string): string {
  return name; // Fallback to English
}

/**
 * Simple Cyrillic name (placeholder)
 */
function cyrillicName(name: string): string {
  const cyrillicMap: Record<string, string> = {
    'Kim': 'Ким',
    'Lee': 'Ли',
    'Park': 'Пак',
    'Choi': 'Чхве',
    'Jung': 'Чон',
    'Kang': 'Кан',
    'Cho': 'Чо',
    'Yoon': 'Юн',
    'Jang': 'Чан',
    'Im': 'Им',
    'Han': 'Хан',
    'Oh': 'О',
    'Seo': 'Со',
    'Shin': 'Шин',
    'Kwon': 'Квон',
  };

  const parts = name.split(' ');
  return parts.map(p => cyrillicMap[p] || p).join(' ');
}

/**
 * Get author persona for a keyword (deterministic based on keyword)
 */
export function getAuthorForKeyword(keyword: string, category: string = 'general'): AuthorPersona {
  // Generate seed from keyword for consistency
  const seed = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return generateAuthorPersona(category, seed);
}

/**
 * Format author attribution for content
 */
export function formatAuthorAttribution(persona: AuthorPersona, locale: string = 'ko'): string {
  if (locale === 'ko') {
    return `작성자: ${persona.name} (${persona.years_of_experience}년 경력 의료통역사)`;
  } else if (locale === 'en') {
    return `Written by: ${persona.name_en} (Medical Interpreter, ${persona.years_of_experience} years)`;
  } else {
    const localName = persona.name_local[locale] || persona.name_en;
    return `Written by: ${localName} (Medical Interpreter, ${persona.years_of_experience} years)`;
  }
}

// =====================================================
// DATABASE PERSONA TYPE (from author_personas table)
// =====================================================

export interface DBAuthorPersona {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  name_zh_tw: string | null;
  name_zh_cn: string | null;
  name_ja: string | null;
  name_th: string | null;
  name_mn: string | null;
  name_ru: string | null;
  photo_url: string | null;
  years_of_experience: number;
  target_locales: string[];
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
  certifications: string[];
  bio_short_ko: string | null;
  bio_short_en: string | null;
  bio_short_zh_tw: string | null;
  bio_short_zh_cn: string | null;
  bio_short_ja: string | null;
  bio_short_th: string | null;
  bio_short_mn: string | null;
  bio_short_ru: string | null;
  bio_full_ko: string | null;
  bio_full_en: string | null;
  bio_full_zh_tw: string | null;
  bio_full_zh_cn: string | null;
  bio_full_ja: string | null;
  bio_full_th: string | null;
  bio_full_mn: string | null;
  bio_full_ru: string | null;
  writing_tone: string;
  writing_perspective: string;
  preferred_messenger: string | null;
  messenger_cta_text: Record<string, string>;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get localized name from DB persona
 */
export function getLocalizedName(persona: DBAuthorPersona, locale: string): string {
  const localeMap: Record<string, keyof DBAuthorPersona> = {
    'ko': 'name_ko',
    'en': 'name_en',
    'zh-TW': 'name_zh_tw',
    'zh-CN': 'name_zh_cn',
    'ja': 'name_ja',
    'th': 'name_th',
    'mn': 'name_mn',
    'ru': 'name_ru',
  };

  const key = localeMap[locale] || 'name_en';
  return (persona[key] as string | null) || persona.name_en;
}

/**
 * Get localized short bio from DB persona
 */
export function getLocalizedBioShort(persona: DBAuthorPersona, locale: string): string {
  const localeMap: Record<string, keyof DBAuthorPersona> = {
    'ko': 'bio_short_ko',
    'en': 'bio_short_en',
    'zh-TW': 'bio_short_zh_tw',
    'zh-CN': 'bio_short_zh_cn',
    'ja': 'bio_short_ja',
    'th': 'bio_short_th',
    'mn': 'bio_short_mn',
    'ru': 'bio_short_ru',
  };

  const key = localeMap[locale] || 'bio_short_en';
  return (persona[key] as string | null) || persona.bio_short_en || '';
}

/**
 * Get localized full bio from DB persona
 */
export function getLocalizedBioFull(persona: DBAuthorPersona, locale: string): string {
  const localeMap: Record<string, keyof DBAuthorPersona> = {
    'ko': 'bio_full_ko',
    'en': 'bio_full_en',
    'zh-TW': 'bio_full_zh_tw',
    'zh-CN': 'bio_full_zh_cn',
    'ja': 'bio_full_ja',
    'th': 'bio_full_th',
    'mn': 'bio_full_mn',
    'ru': 'bio_full_ru',
  };

  const key = localeMap[locale] || 'bio_full_en';
  return (persona[key] as string | null) || persona.bio_full_en || '';
}

/**
 * Get messenger CTA text from DB persona
 */
export function getMessengerCTA(persona: DBAuthorPersona, locale: string): string {
  if (persona.messenger_cta_text && persona.messenger_cta_text[locale]) {
    return persona.messenger_cta_text[locale];
  }
  // Fallback to English or default
  return persona.messenger_cta_text?.['en'] || 'Contact Us';
}

/**
 * Format specialty for display
 */
export function formatSpecialty(specialty: string): string {
  const specialtyMap: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dental Care',
    'health-checkup': 'Health Checkup',
    'ophthalmology': 'Ophthalmology',
    'orthopedics': 'Orthopedics',
    'fertility': 'Fertility Treatment',
    'hair-transplant': 'Hair Transplant',
    'general': 'General Medical',
  };

  return specialtyMap[specialty] || specialty.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
