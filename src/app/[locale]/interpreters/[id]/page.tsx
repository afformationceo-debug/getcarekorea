import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { InterpreterDetailClient } from './InterpreterDetailClient';
import type { Locale } from '@/lib/i18n/config';
import { locales } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import Script from 'next/script';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getcarekorea.com';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// Type for localized JSONB fields
type LocalizedField = Record<string, string>;

// Localized SEO templates
const seoTemplates: Record<string, {
  title: (name: string) => string;
  description: (name: string, specialty: string, languages: string) => string;
  ogTitle: (name: string) => string;
  specialties: Record<string, string>;
}> = {
  en: {
    title: (name) => `${name} | Medical Interpreter | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - Professional medical interpreter in Korea specializing in ${specialty}. Fluent in ${languages}. Book your interpreter for a seamless medical tourism experience.`,
    ogTitle: (name) => `${name} - Medical Interpreter in Korea`,
    specialties: {
      'plastic-surgery': 'Plastic Surgery',
      'dermatology': 'Dermatology',
      'dental': 'Dental',
      'health-checkup': 'Health Checkup',
      'fertility': 'Fertility',
      'hair-transplant': 'Hair Transplant',
      'ophthalmology': 'Ophthalmology',
      'orthopedics': 'Orthopedics',
      'general-medical': 'General Medical',
    },
  },
  ko: {
    title: (name) => `${name} | 의료 통역사 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - ${specialty} 전문 한국 의료 통역사. ${languages} 구사. 외국인 환자를 위한 전문 의료 통역 서비스를 제공합니다.`,
    ogTitle: (name) => `${name} - 한국 의료 통역사`,
    specialties: {
      'plastic-surgery': '성형외과',
      'dermatology': '피부과',
      'dental': '치과',
      'health-checkup': '건강검진',
      'fertility': '난임',
      'hair-transplant': '모발이식',
      'ophthalmology': '안과',
      'orthopedics': '정형외과',
      'general-medical': '일반의료',
    },
  },
  ja: {
    title: (name) => `${name} | 医療通訳 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - 韓国の${specialty}専門医療通訳者。${languages}対応。韓国での医療ツーリズムをサポートします。`,
    ogTitle: (name) => `${name} - 韓国医療通訳`,
    specialties: {
      'plastic-surgery': '美容整形',
      'dermatology': '皮膚科',
      'dental': '歯科',
      'health-checkup': '健康診断',
      'fertility': '不妊治療',
      'hair-transplant': '植毛',
      'ophthalmology': '眼科',
      'orthopedics': '整形外科',
      'general-medical': '一般医療',
    },
  },
  'zh-CN': {
    title: (name) => `${name} | 医疗翻译 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - 韩国${specialty}专业医疗翻译。精通${languages}。为您的韩国医疗之旅提供专业翻译服务。`,
    ogTitle: (name) => `${name} - 韩国医疗翻译`,
    specialties: {
      'plastic-surgery': '整形外科',
      'dermatology': '皮肤科',
      'dental': '牙科',
      'health-checkup': '健康体检',
      'fertility': '不孕治疗',
      'hair-transplant': '植发',
      'ophthalmology': '眼科',
      'orthopedics': '骨科',
      'general-medical': '综合医疗',
    },
  },
  'zh-TW': {
    title: (name) => `${name} | 醫療口譯 | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - 韓國${specialty}專業醫療口譯員。精通${languages}。為您的韓國醫療之旅提供專業口譯服務。`,
    ogTitle: (name) => `${name} - 韓國醫療口譯`,
    specialties: {
      'plastic-surgery': '整形外科',
      'dermatology': '皮膚科',
      'dental': '牙科',
      'health-checkup': '健康檢查',
      'fertility': '不孕治療',
      'hair-transplant': '植髮',
      'ophthalmology': '眼科',
      'orthopedics': '骨科',
      'general-medical': '綜合醫療',
    },
  },
  th: {
    title: (name) => `${name} | ล่ามแพทย์ | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - ล่ามแพทย์เฉพาะทาง${specialty}ในเกาหลี พูดได้${languages} บริการล่ามสำหรับการท่องเที่ยวเชิงการแพทย์`,
    ogTitle: (name) => `${name} - ล่ามแพทย์ในเกาหลี`,
    specialties: {
      'plastic-surgery': 'ศัลยกรรมตกแต่ง',
      'dermatology': 'ผิวหนัง',
      'dental': 'ทันตกรรม',
      'health-checkup': 'ตรวจสุขภาพ',
      'fertility': 'รักษาภาวะมีบุตรยาก',
      'hair-transplant': 'ปลูกผม',
      'ophthalmology': 'จักษุ',
      'orthopedics': 'กระดูกและข้อ',
      'general-medical': 'การแพทย์ทั่วไป',
    },
  },
  mn: {
    title: (name) => `${name} | Эмнэлгийн орчуулагч | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - Солонгосын ${specialty} чиглэлээр мэргэшсэн эмнэлгийн орчуулагч. ${languages} ярьдаг. Эмнэлгийн аялал жуулчлалд туслах орчуулагч.`,
    ogTitle: (name) => `${name} - Солонгост эмнэлгийн орчуулагч`,
    specialties: {
      'plastic-surgery': 'Гоо сайхны мэс засал',
      'dermatology': 'Арьс судлал',
      'dental': 'Шүдний эмчилгээ',
      'health-checkup': 'Эрүүл мэндийн үзлэг',
      'fertility': 'Үргүйдэл эмчилгээ',
      'hair-transplant': 'Үс суулгах',
      'ophthalmology': 'Нүдний эмчилгээ',
      'orthopedics': 'Ортопеди',
      'general-medical': 'Ерөнхий эмчилгээ',
    },
  },
  ru: {
    title: (name) => `${name} | Медицинский переводчик | GetCareKorea`,
    description: (name, specialty, languages) =>
      `${name} - Профессиональный медицинский переводчик в Корее, специализация: ${specialty}. Языки: ${languages}. Сопровождение медицинского туризма.`,
    ogTitle: (name) => `${name} - Медицинский переводчик в Корее`,
    specialties: {
      'plastic-surgery': 'Пластическая хирургия',
      'dermatology': 'Дерматология',
      'dental': 'Стоматология',
      'health-checkup': 'Медосмотр',
      'fertility': 'Лечение бесплодия',
      'hair-transplant': 'Пересадка волос',
      'ophthalmology': 'Офтальмология',
      'orthopedics': 'Ортопедия',
      'general-medical': 'Общая медицина',
    },
  },
};

// Get localized language names
const languageNames: Record<string, Record<string, string>> = {
  en: { en: 'English', ko: 'Korean', ja: 'Japanese', 'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)', th: 'Thai', mn: 'Mongolian', ru: 'Russian', vi: 'Vietnamese' },
  ko: { en: '영어', ko: '한국어', ja: '일본어', 'zh-CN': '중국어(간체)', 'zh-TW': '중국어(번체)', th: '태국어', mn: '몽골어', ru: '러시아어', vi: '베트남어' },
  ja: { en: '英語', ko: '韓国語', ja: '日本語', 'zh-CN': '中国語(簡体)', 'zh-TW': '中国語(繁体)', th: 'タイ語', mn: 'モンゴル語', ru: 'ロシア語', vi: 'ベトナム語' },
  'zh-CN': { en: '英语', ko: '韩语', ja: '日语', 'zh-CN': '简体中文', 'zh-TW': '繁体中文', th: '泰语', mn: '蒙古语', ru: '俄语', vi: '越南语' },
  'zh-TW': { en: '英語', ko: '韓語', ja: '日語', 'zh-CN': '簡體中文', 'zh-TW': '繁體中文', th: '泰語', mn: '蒙古語', ru: '俄語', vi: '越南語' },
  th: { en: 'อังกฤษ', ko: 'เกาหลี', ja: 'ญี่ปุ่น', 'zh-CN': 'จีน(ตัวย่อ)', 'zh-TW': 'จีน(ตัวเต็ม)', th: 'ไทย', mn: 'มองโกเลีย', ru: 'รัสเซีย', vi: 'เวียดนาม' },
  mn: { en: 'Англи', ko: 'Солонгос', ja: 'Япон', 'zh-CN': 'Хятад(хялбаршуулсан)', 'zh-TW': 'Хятад(уламжлалт)', th: 'Тайланд', mn: 'Монгол', ru: 'Орос', vi: 'Вьетнам' },
  ru: { en: 'Английский', ko: 'Корейский', ja: 'Японский', 'zh-CN': 'Китайский(упр.)', 'zh-TW': 'Китайский(трад.)', th: 'Тайский', mn: 'Монгольский', ru: 'Русский', vi: 'Вьетнамский' },
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createAdminClient();

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('author_personas') as any)
    .select('name, bio_short, photo_url, primary_specialty, secondary_specialties, slug, languages, location, years_of_experience, avg_rating, review_count')
    .eq('is_active', true);

  if (isUUID) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data: interpreter } = await query.single();

  if (!interpreter) {
    return {
      title: 'Interpreter Not Found',
    };
  }

  // Get locale-specific templates (fallback to English)
  const templates = seoTemplates[locale] || seoTemplates.en;
  const langNames = languageNames[locale] || languageNames.en;

  // Get localized name
  const nameData = interpreter.name as LocalizedField;
  const name = nameData?.[locale] || nameData?.['en'] || 'Medical Interpreter';
  const slug = interpreter.slug || id;

  // Get localized specialty
  const specialtySlug = interpreter.primary_specialty || 'general-medical';
  const specialty = templates.specialties[specialtySlug] || specialtySlug;

  // Get localized language list
  const languageCodes = Array.isArray(interpreter.languages)
    ? interpreter.languages.map((l: { code: string }) => l.code)
    : [];
  const languages = languageCodes.map((code: string) => langNames[code] || code).join(', ');

  // Get bio or generate description
  const bioData = interpreter.bio_short as LocalizedField;
  const bio = bioData?.[locale] || bioData?.['en'] || '';
  const description = bio || templates.description(name, specialty, languages);

  // Generate localized title
  const title = templates.title(name);
  const ogTitle = templates.ogTitle(name);

  // Get additional data for enhanced SEO
  const location = (interpreter.location as string) || 'Seoul';
  const experienceYears = (interpreter.years_of_experience as number) || 0;
  const avgRating = parseFloat(String(interpreter.avg_rating || 0));
  const reviewCount = (interpreter.review_count as number) || 0;

  // Get all specialties for keywords
  const allSpecialties = [
    specialtySlug,
    ...((interpreter.secondary_specialties as string[]) || []),
  ].filter(Boolean);

  // Generate keywords from existing data
  const keywordsArray = [
    'medical interpreter',
    'Korea',
    name,
    specialty,
    ...allSpecialties.map(s => templates.specialties[s] || s),
    ...languageCodes.map((code: string) => langNames[code] || code),
    location,
    'medical tourism',
    'healthcare',
    'hospital interpreter',
  ].filter(Boolean);

  // Parse name for profile meta (handle Korean/English names)
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  return {
    title,
    description: description.slice(0, 160),
    authors: [{ name }],
    keywords: keywordsArray,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: ogTitle,
      description: description.slice(0, 160),
      url: `${baseUrl}/${locale}/interpreters/${slug}`,
      siteName: 'GetCareKorea',
      images: [{
        url: `${baseUrl}/api/og/interpreter?id=${slug}&locale=${locale}`,
        width: 1200,
        height: 630,
        alt: ogTitle,
      }],
      locale: locale,
      type: 'profile',
      firstName: firstName,
      lastName: lastName || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: description.slice(0, 160),
      images: [`${baseUrl}/api/og/interpreter?id=${slug}&locale=${locale}`],
      site: '@getcarekorea',
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/interpreters/${slug}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/interpreters/${slug}`])
      ),
    },
    other: {
      'profile:first_name': firstName,
      'profile:last_name': lastName || '',
      'og:locale:alternate': locales.filter(l => l !== locale).join(','),
      ...(avgRating > 0 && reviewCount > 0 ? {
        'rating': avgRating.toFixed(1),
        'review_count': String(reviewCount),
      } : {}),
      ...(experienceYears > 0 ? {
        'experience_years': String(experienceYears),
      } : {}),
    },
  };
}

// Generate JSON-LD schema for interpreter detail page
function generateInterpreterSchema(
  interpreter: {
    name: string;
    bio: string;
    photo_url: string | null;
    slug: string;
    languages: { code: string; name: string }[];
    specialties: string[];
    location: string;
    avg_rating: number;
    review_count: number;
    experience_years: number;
  },
  locale: string
) {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: interpreter.name,
    description: interpreter.bio,
    image: interpreter.photo_url || undefined,
    url: `${baseUrl}/${locale}/interpreters/${interpreter.slug}`,
    jobTitle: 'Medical Interpreter',
    worksFor: {
      '@type': 'Organization',
      name: 'GetCareKorea',
      url: baseUrl,
    },
    workLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: interpreter.location,
        addressCountry: 'KR',
      },
    },
    knowsLanguage: interpreter.languages.map((lang) => lang.name),
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Medical Interpreter',
      occupationalCategory: 'Healthcare',
      skills: interpreter.specialties,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Interpreters',
        item: `${baseUrl}/${locale}/interpreters`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: interpreter.name,
        item: `${baseUrl}/${locale}/interpreters/${interpreter.slug}`,
      },
    ],
  };

  // Service schema for interpreter services
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Medical Interpretation by ${interpreter.name}`,
    description: `Professional medical interpretation services in Korea. Specializing in ${interpreter.specialties.join(', ')}.`,
    provider: personSchema,
    areaServed: {
      '@type': 'Country',
      name: 'South Korea',
    },
    aggregateRating: interpreter.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: interpreter.avg_rating,
      reviewCount: interpreter.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return [personSchema, breadcrumbSchema, serviceSchema];
}

// Get localized value from JSONB field with fallback to English
function getLocalizedValue(field: unknown, locale: string): string {
  const data = field as LocalizedField | null;
  if (!data) return '';
  return data[locale] || data['en'] || '';
}

// Format specialty slug to display name
function formatSpecialty(slug: string | null): string {
  if (!slug) return '';
  const names: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dental',
    'health-checkup': 'Health Checkup',
    'fertility': 'Fertility',
    'hair-transplant': 'Hair Transplant',
    'ophthalmology': 'Ophthalmology',
    'orthopedics': 'Orthopedics',
    'general-medical': 'General Medical',
  };
  return names[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Get language display name from code
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    ko: 'Korean',
    'zh': 'Chinese',
    'zh-TW': 'Chinese (Traditional)',
    'zh-CN': 'Chinese (Simplified)',
    ja: 'Japanese',
    th: 'Thai',
    mn: 'Mongolian',
    ru: 'Russian',
    vi: 'Vietnamese',
    ar: 'Arabic',
  };
  return names[code] || code.toUpperCase();
}

// Parse languages from JSONB format
function parseLanguages(languagesData: unknown): { code: string; name: string; level: string }[] {
  if (!languagesData) return [];

  try {
    const languages = Array.isArray(languagesData)
      ? languagesData
      : JSON.parse(String(languagesData));

    return languages.map((lang: { code?: string; proficiency?: string }) => {
      const code = lang.code || 'en';
      return {
        code,
        name: getLanguageName(code),
        level: lang.proficiency || 'fluent',
      };
    });
  } catch {
    return [];
  }
}

// Transform author_persona to interpreter format for frontend
function transformToInterpreter(persona: Record<string, unknown>, locale: string) {
  const nameData = persona.name as LocalizedField;
  const name = getLocalizedValue(nameData, locale);

  const bioShort = getLocalizedValue(persona.bio_short, locale);
  const bioFull = getLocalizedValue(persona.bio_full, locale);

  const languages = parseLanguages(persona.languages);

  const specialties = [
    formatSpecialty(persona.primary_specialty as string),
    ...((persona.secondary_specialties as string[]) || []).map(formatSpecialty),
  ].filter(Boolean);

  return {
    id: persona.id as string,
    slug: persona.slug as string,
    name,
    photo_url: (persona.photo_url as string) || null,
    languages,
    specialties,
    bio: bioFull || bioShort,
    avg_rating: parseFloat(String(persona.avg_rating || 4.8)),
    review_count: (persona.review_count as number) || 0,
    total_bookings: (persona.total_bookings as number) || 0,
    is_verified: (persona.is_verified as boolean) || false,
    is_available: true,
    video_url: persona.video_url as string | null,
    experience_years: (persona.years_of_experience as number) || 5,
    location: (persona.location as string) || 'Seoul, Gangnam',
    certifications: (persona.certifications as string[]) || [],
    education: '', // Not in current schema
    services: [
      'Medical Consultation Interpretation',
      'Surgery Accompaniment',
      'Hospital Coordination',
      'Post-operative Care Support',
      'Document Translation',
    ],
  };
}

async function getInterpreter(idOrSlug: string, locale: string) {
  const supabase = await createAdminClient();

  // Try to find by ID first (UUID), then by slug
  let query = supabase
    .from('author_personas')
    .select('*')
    .eq('is_active', true);

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (isUUID) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  const personaData = data as Record<string, unknown>;
  const interpreter = transformToInterpreter(personaData, locale);

  // Fetch working photos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: photos, error: photosError } = await (supabase.from('interpreter_photos') as any)
    .select('id, image_url, caption, display_order')
    .eq('persona_id', personaData.id as string)
    .order('display_order', { ascending: true });

  return {
    ...interpreter,
    working_photos: photos || [],
  };
}

export default async function InterpreterDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const interpreter = await getInterpreter(id, locale);

  if (!interpreter) {
    notFound();
  }

  // TODO: Fetch real reviews from database
  const reviews: Array<{
    id: string;
    author: string;
    rating: number;
    date: string;
    content: string;
    procedure: string;
    hospital: string;
  }> = [];

  // Generate JSON-LD schema for SEO
  const schemaMarkup = generateInterpreterSchema(interpreter, locale);

  return (
    <>
      {/* JSON-LD Schema for SEO */}
      <Script
        id="interpreter-detail-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaMarkup),
        }}
      />
      <InterpreterDetailClient
        interpreter={interpreter}
        reviews={reviews}
        locale={locale as Locale}
      />
    </>
  );
}
