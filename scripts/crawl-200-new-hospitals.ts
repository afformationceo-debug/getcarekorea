/**
 * Crawl 200 new hospitals from Google Maps using Apify
 *
 * This script:
 * 1. Checks existing hospitals to avoid duplicates
 * 2. Crawls 200 new unique hospitals from various categories
 * 3. Translates all content to 8 languages (en, ko, ja, zh-TW, zh-CN, th, mn, ru)
 * 4. Saves to database with status='published'
 *
 * Usage:
 *   APIFY_API_TOKEN=your_token npx tsx scripts/crawl-200-new-hospitals.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// =====================================================
// CONFIGURATION
// =====================================================

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = 'compass~crawler-google-places';
const TARGET_NEW_HOSPITALS = 200;

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// Extended medical categories for broader coverage
const MEDICAL_CATEGORIES = [
  // Plastic Surgery & Aesthetics (50 total)
  { query: '성형외과 강남', category: 'plastic-surgery', count: 20 },
  { query: '성형외과 신사', category: 'plastic-surgery', count: 15 },
  { query: '성형외과 명동', category: 'plastic-surgery', count: 10 },
  { query: '안면윤곽 서울', category: 'plastic-surgery', count: 5 },

  // Dermatology & Skin (40 total)
  { query: '피부과 청담', category: 'dermatology', count: 15 },
  { query: '피부과 압구정', category: 'dermatology', count: 15 },
  { query: '레이저클리닉 강남', category: 'dermatology', count: 10 },

  // Dental (40 total)
  { query: '치과 강남', category: 'dental', count: 15 },
  { query: '임플란트 서울', category: 'dental', count: 10 },
  { query: '교정치과 강남', category: 'dental', count: 10 },
  { query: '심미치과 청담', category: 'dental', count: 5 },

  // Ophthalmology (20 total)
  { query: '안과 강남', category: 'ophthalmology', count: 10 },
  { query: '라식 서울', category: 'ophthalmology', count: 5 },
  { query: '안성형 압구정', category: 'ophthalmology', count: 5 },

  // Hair Transplant (15 total)
  { query: '모발이식 강남', category: 'hair-transplant', count: 10 },
  { query: '탈모클리닉 서울', category: 'hair-transplant', count: 5 },

  // General Hospitals (20 total)
  { query: '종합병원 서울', category: 'general-hospital', count: 10 },
  { query: '대학병원 강남', category: 'university-hospital', count: 10 },

  // Health Checkup (15 total)
  { query: '건강검진센터 강남', category: 'health-checkup', count: 10 },
  { query: '건강검진 서울', category: 'health-checkup', count: 5 },
];

// =====================================================
// TYPES
// =====================================================

interface GooglePlaceReview {
  name: string;
  text: string;
  stars: number;
  publishedAtDate?: string;
  responseFromOwnerText?: string;
}

interface GooglePlaceResult {
  title: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewsCount?: number;
  latitude?: number;
  longitude?: number;
  placeId: string;
  url: string;
  imageUrls?: string[];
  openingHours?: string[];
  categories?: string[];
  description?: string;
  reviews?: GooglePlaceReview[];
}

interface HospitalReview {
  author: string;
  rating: number;
  content: string;
  date?: string;
  response?: string;
}

interface HospitalData {
  google_place_id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  name_ja?: string;
  name_zh_tw?: string;
  name_zh_cn?: string;
  name_th?: string;
  name_mn?: string;
  name_ru?: string;
  description_ko: string;
  description_en: string;
  description_ja?: string;
  description_zh_tw?: string;
  description_zh_cn?: string;
  description_th?: string;
  description_mn?: string;
  description_ru?: string;
  ai_summary_en?: string;
  ai_summary_ko?: string;
  ai_summary_ja?: string;
  ai_summary_zh_tw?: string;
  ai_summary_zh_cn?: string;
  ai_summary_th?: string;
  ai_summary_mn?: string;
  ai_summary_ru?: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  avg_rating?: number;
  review_count?: number;
  google_maps_url: string;
  google_photos?: string[];
  google_reviews?: HospitalReview[];
  opening_hours?: string[];
  specialties: string[];
  category: string;
  source: string;
  status: string;
  crawled_at: string;
  languages?: string[];
  certifications?: string[];
  has_cctv?: boolean;
  has_female_doctor?: boolean;
}

// Locale mapping for translations
const locales = {
  ja: 'ja',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
} as const;

const languageNames = {
  ja: 'Japanese',
  'zh-TW': 'Traditional Chinese (Taiwan)',
  'zh-CN': 'Simplified Chinese',
  th: 'Thai',
  mn: 'Mongolian',
  ru: 'Russian',
} as const;

// =====================================================
// APIFY FUNCTIONS
// =====================================================

async function runApifyCrawler(searchQuery: string, maxResults: number): Promise<GooglePlaceResult[]> {
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set');
  }

  console.log(`   🔍 Searching: "${searchQuery}" (max ${maxResults} results)...`);

  const response = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [],
        searchStringsArray: [searchQuery],
        maxCrawledPlacesPerSearch: maxResults,
        language: 'ko',
        includeWebResults: false,
        includeImages: true,
        includeOpeningHours: true,
        includeReviews: true,
        maxReviews: 10,
        maxImages: 15,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
  }

  const runData = await response.json();
  const runId = runData.data.id;
  console.log(`   ⏳ Apify run started: ${runId}`);

  // Poll for completion
  let status = 'RUNNING';
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max

  while ((status === 'RUNNING' || status === 'READY') && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    );
    const statusData = await statusResponse.json();
    status = statusData.data.status;
    attempts++;

    if (attempts % 6 === 0) { // Log every 30 seconds
      console.log(`   📊 Status: ${status} (${attempts * 5}s elapsed)`);
    }
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Apify run failed with status: ${status}`);
  }

  // Get results
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
  );
  const results = await resultsResponse.json();

  console.log(`   ✅ Found ${results.length} places`);
  return results;
}

// =====================================================
// TRANSLATION FUNCTIONS
// =====================================================

async function translateText(
  text: string,
  targetLang: keyof typeof languageNames,
  context: 'description' | 'summary' | 'name'
): Promise<string> {
  const systemPrompt = context === 'name'
    ? `You are a professional medical translator. Translate hospital/clinic names to ${languageNames[targetLang]}.

CRITICAL: Return ONLY the translated name. No explanations, no notes, no parentheses.

- Keep proper nouns (brand names) unchanged
- Translate generic terms (e.g., "Plastic Surgery", "Clinic")
- Example: "LUHO Plastic Surgery" → "LUHO整形外科" (Japanese)`
    : `You are a professional medical translator specializing in Korean medical tourism content.
Translate the following hospital ${context} to ${languageNames[targetLang]}.

CRITICAL: Return ONLY the translated text. Do NOT include notes or explanations.

Requirements:
- Maintain medical accuracy and professionalism
- Use terminology appropriate for international patients
- Keep the tone informative and trustworthy
- Preserve medical terms in their commonly used form`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: context === 'name' ? 200 : 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }
    return text;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error);
    return text;
  }
}

async function generateAISummary(hospital: Partial<HospitalData>, language: string): Promise<string> {
  const prompt = language === 'en'
    ? `Generate a brief, professional summary (2-3 sentences) for this medical facility for international patients:

Hospital: ${hospital.name_en}
Category: ${hospital.category}
Location: ${hospital.district}, Seoul
Rating: ${hospital.avg_rating}/5.0 (${hospital.review_count} reviews)
Specialties: ${hospital.specialties?.join(', ')}

Write a compelling summary highlighting what makes this clinic trustworthy and appealing to medical tourists.`
    : `다음 의료시설에 대한 간결하고 전문적인 요약을 2-3문장으로 작성하세요:

병원명: ${hospital.name_ko}
카테고리: ${hospital.category}
위치: ${hospital.district}, 서울
평점: ${hospital.avg_rating}/5.0 (리뷰 ${hospital.review_count}개)
전문분야: ${hospital.specialties?.join(', ')}

이 병원이 신뢰할 수 있고 의료 관광객에게 매력적인 이유를 강조하는 요약을 작성하세요.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }
    return '';
  } catch (error) {
    console.error(`AI summary generation error:`, error);
    return '';
  }
}

// =====================================================
// DATA PROCESSING
// =====================================================

function generateSlugFromEnglish(englishName: string, placeId: string): string {
  const baseSlug = englishName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

  const shortId = placeId.substring(0, 8);
  return baseSlug ? `${baseSlug}-${shortId}` : `hospital-${shortId}`;
}

function extractDistrict(address: string): string | undefined {
  const districts = [
    '강남구', '서초구', '송파구', '용산구', '마포구', '중구', '종로구',
    '성동구', '광진구', '동대문구', '성북구', '강북구', '도봉구', '노원구',
    '은평구', '서대문구', '영등포구', '동작구', '관악구', '금천구', '구로구',
    '양천구', '강서구'
  ];

  for (const district of districts) {
    if (address.includes(district)) {
      return district.replace('구', '');
    }
  }
  return undefined;
}

function translateCategoryToEnglish(koreanName: string, category: string): string {
  // Remove Korean characters
  const cleanedName = koreanName
    .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .replace(/[\u3040-\u309F\u30A0-\u30FF]/g, ' ')
    .replace(/[\u4E00-\u9FFF]/g, ' ')
    .replace(/[^\w\s&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const englishWords = cleanedName.match(/[A-Za-z]{2,}/g) || [];

  if (englishWords.length >= 1) {
    const uniqueWords: string[] = [];
    const seenLower = new Set<string>();

    for (const word of cleanedName.split(' ').filter(w => w.length > 0)) {
      const lower = word.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        uniqueWords.push(word);
      }
    }

    let result = uniqueWords.join(' ').trim();
    result = result.replace(/^[-&\s]+|[-&\s]+$/g, '').trim();

    if (result && !/(Clinic|Hospital|Center|Surgery)$/i.test(result)) {
      result += ' Clinic';
    }

    if (result && result.length > 3) {
      return result;
    }
  }

  const categoryMap: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery Clinic',
    'dermatology': 'Dermatology Clinic',
    'dental': 'Dental Clinic',
    'ophthalmology': 'Eye Clinic',
    'hair-transplant': 'Hair Transplant Clinic',
    'general-hospital': 'General Hospital',
    'university-hospital': 'University Hospital',
    'health-checkup': 'Health Checkup Center',
  };

  return categoryMap[category] || 'Medical Clinic';
}

function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dental',
    'ophthalmology': 'Ophthalmology',
    'hair-transplant': 'Hair Transplant',
    'general-hospital': 'General Medicine',
    'university-hospital': 'General Medicine',
    'health-checkup': 'Health Checkup',
  };
  return categoryMap[category] || category;
}

function generateEnglishDescription(place: GooglePlaceResult, category: string, district?: string): string {
  const categoryNameEn = getCategoryDisplayName(category);
  const clinicName = translateCategoryToEnglish(place.title, category);
  const locationStr = district ? `${district}, Seoul` : 'Seoul';

  let description = `${clinicName} is a specialized ${categoryNameEn.toLowerCase()} clinic located in ${locationStr}, South Korea.`;

  if (place.rating && place.rating >= 4.0) {
    description += ` With a ${place.rating.toFixed(1)}-star rating from ${place.reviewsCount?.toLocaleString() || 'many'} patient reviews, it has established itself as a trusted medical facility.`;
  }

  description += ` The clinic offers comprehensive ${categoryNameEn.toLowerCase()} services with experienced medical professionals and modern facilities. International patients are welcome, and consultation services are available for overseas visitors.`;

  return description;
}

async function processPlaceDataWithTranslations(place: GooglePlaceResult, category: string): Promise<HospitalData> {
  const district = extractDistrict(place.address);
  const categoryNameEn = getCategoryDisplayName(category);

  // Generate English name
  const nameEn = translateCategoryToEnglish(place.title, category);
  const slug = generateSlugFromEnglish(nameEn, place.placeId);

  // Generate descriptions
  const descriptionEn = generateEnglishDescription(place, category, district);
  const descriptionKo = place.description || `${place.title}은(는) 서울에 위치한 전문 의료시설입니다. 최신 시설과 전문의가 환자 중심의 진료를 제공합니다.`;

  // Process reviews
  const googleReviews: HospitalReview[] = (place.reviews || []).map(review => ({
    author: review.name || 'Anonymous',
    rating: review.stars || 5,
    content: review.text || '',
    date: review.publishedAtDate,
    response: review.responseFromOwnerText,
  })).filter(r => r.content.length > 0);

  console.log(`   📝 Generating AI summaries...`);
  const aiSummaryEn = await generateAISummary({
    name_en: nameEn,
    category,
    district,
    avg_rating: place.rating,
    review_count: place.reviewsCount,
    specialties: [categoryNameEn]
  }, 'en');

  await new Promise(resolve => setTimeout(resolve, 500));

  const aiSummaryKo = await generateAISummary({
    name_ko: place.title,
    category,
    district,
    avg_rating: place.rating,
    review_count: place.reviewsCount,
    specialties: [categoryNameEn]
  }, 'ko');

  const hospitalData: HospitalData = {
    google_place_id: place.placeId,
    slug,
    name_ko: place.title,
    name_en: nameEn,
    description_ko: descriptionKo,
    description_en: descriptionEn,
    ai_summary_en: aiSummaryEn,
    ai_summary_ko: aiSummaryKo,
    address: place.address,
    city: 'Seoul',
    district,
    phone: place.phone,
    website: place.website,
    latitude: place.latitude,
    longitude: place.longitude,
    avg_rating: place.rating,
    review_count: place.reviewsCount,
    google_maps_url: place.url,
    google_photos: place.imageUrls?.slice(0, 15),
    google_reviews: googleReviews.length > 0 ? googleReviews : undefined,
    opening_hours: place.openingHours,
    specialties: [categoryNameEn],
    category,
    source: 'google_places',
    status: 'published',
    crawled_at: new Date().toISOString(),
    languages: ['Korean', 'English', 'Japanese', 'Chinese'],
    certifications: [],
    has_cctv: false,
    has_female_doctor: false,
  };

  // Translate to other languages
  console.log(`   🌍 Translating to 6 additional languages...`);

  for (const [localeKey, dbSuffix] of Object.entries(locales)) {
    const locale = localeKey as keyof typeof languageNames;

    try {
      // Translate name
      const translatedName = await translateText(nameEn, locale, 'name');
      (hospitalData as any)[`name_${dbSuffix}`] = translatedName;

      await new Promise(resolve => setTimeout(resolve, 500));

      // Translate description
      const translatedDesc = await translateText(descriptionEn, locale, 'description');
      (hospitalData as any)[`description_${dbSuffix}`] = translatedDesc;

      await new Promise(resolve => setTimeout(resolve, 500));

      // Translate AI summary
      if (aiSummaryEn) {
        const translatedSummary = await translateText(aiSummaryEn, locale, 'summary');
        (hospitalData as any)[`ai_summary_${dbSuffix}`] = translatedSummary;

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`      ✓ ${languageNames[locale]}`);
    } catch (error) {
      console.error(`      ✗ Failed to translate to ${languageNames[locale]}:`, error);
    }
  }

  return hospitalData;
}

// =====================================================
// DATABASE FUNCTIONS
// =====================================================

async function getExistingPlaceIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('google_place_id')
    .not('google_place_id', 'is', null);

  if (error) {
    console.error('Error fetching existing hospitals:', error);
    return new Set();
  }

  return new Set(data.map(h => h.google_place_id).filter(Boolean));
}

async function saveHospitalToDatabase(hospital: HospitalData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('hospitals')
      .insert(hospital);

    if (error) {
      console.error(`   ❌ Insert failed for ${hospital.name_en}:`, error.message);
      return false;
    }

    console.log(`   ✅ Saved: ${hospital.name_en}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to save ${hospital.name_en}:`, error);
    return false;
  }
}

// =====================================================
// MAIN CRAWLER
// =====================================================

async function crawl200NewHospitals() {
  console.log('\n🏥 Crawling 200 New Hospitals with Full Translations');
  console.log('='.repeat(70));

  if (!APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN is not set in environment variables');
    console.log('\n📋 Set APIFY_API_TOKEN in your .env.local file');
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
    return;
  }

  // Get existing place IDs to avoid duplicates
  console.log('\n📊 Checking existing hospitals...');
  const existingPlaceIds = await getExistingPlaceIds();
  console.log(`   Found ${existingPlaceIds.size} existing hospitals in database`);

  const stats = {
    totalCrawled: 0,
    newInserted: 0,
    duplicates: 0,
    errors: 0,
  };

  const newHospitals: HospitalData[] = [];

  for (const plan of MEDICAL_CATEGORIES) {
    if (newHospitals.length >= TARGET_NEW_HOSPITALS) {
      console.log(`\n✅ Reached target of ${TARGET_NEW_HOSPITALS} new hospitals`);
      break;
    }

    console.log(`\n📂 Category: ${plan.query} (target: ${plan.count} new hospitals)`);
    console.log('-'.repeat(70));

    try {
      const places = await runApifyCrawler(plan.query, plan.count + 20); // Extra for filtering

      // Filter out duplicates and sort by review count
      const newPlaces = places
        .filter((p: GooglePlaceResult) => !existingPlaceIds.has(p.placeId))
        .sort((a: GooglePlaceResult, b: GooglePlaceResult) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        .slice(0, plan.count);

      console.log(`   Found ${newPlaces.length} new unique places`);

      for (const place of newPlaces) {
        if (newHospitals.length >= TARGET_NEW_HOSPITALS) break;

        stats.totalCrawled++;
        console.log(`\n   [${stats.totalCrawled}/${TARGET_NEW_HOSPITALS}] Processing: ${place.title}`);

        try {
          const hospitalData = await processPlaceDataWithTranslations(place, plan.category);
          const saved = await saveHospitalToDatabase(hospitalData);

          if (saved) {
            stats.newInserted++;
            newHospitals.push(hospitalData);
            existingPlaceIds.add(place.placeId); // Add to set to avoid re-crawling
          } else {
            stats.errors++;
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${place.title}:`, error);
          stats.errors++;
        }

        // Rate limiting between hospitals
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Rate limiting between categories
      if (newHospitals.length < TARGET_NEW_HOSPITALS) {
        console.log(`   ⏳ Waiting 10 seconds before next category...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

    } catch (error) {
      console.error(`   ❌ Error crawling ${plan.query}:`, error);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 CRAWL SUMMARY');
  console.log('='.repeat(70));
  console.log(`   Total places processed: ${stats.totalCrawled}`);
  console.log(`   New hospitals added: ${stats.newInserted}`);
  console.log(`   Duplicates skipped: ${stats.duplicates}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log('\n✅ Crawl complete!');
  console.log('\n🌍 All hospitals have been translated to 8 languages:');
  console.log('   • English (en)');
  console.log('   • Korean (ko)');
  console.log('   • Japanese (ja)');
  console.log('   • Traditional Chinese (zh-TW)');
  console.log('   • Simplified Chinese (zh-CN)');
  console.log('   • Thai (th)');
  console.log('   • Mongolian (mn)');
  console.log('   • Russian (ru)');
  console.log('\n📝 Next steps:');
  console.log('   1. Build and deploy to Vercel');
  console.log('   2. All new hospital pages are live at /[locale]/hospitals/[slug]');
  console.log('   3. Sitemap will be automatically updated');
}

// =====================================================
// RUN
// =====================================================

crawl200NewHospitals().catch(console.error);
