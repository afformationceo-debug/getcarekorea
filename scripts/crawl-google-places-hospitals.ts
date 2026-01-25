/**
 * Google Places Hospital Crawler using Apify
 *
 * 서울 의료시설 크롤링 (성형외과, 피부과, 치과, 안과, 한의원, 대학병원)
 *
 * Usage:
 *   APIFY_API_TOKEN=your_token npx tsx scripts/crawl-google-places-hospitals.ts
 *
 * Apify Actor: https://apify.com/compass/crawler-google-places
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// =====================================================
// CONFIGURATION
// =====================================================

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
// Use tilde format for API calls: username~actor-name
const APIFY_ACTOR_ID = 'compass~crawler-google-places';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 검색할 의료시설 카테고리
const MEDICAL_CATEGORIES = [
  { query: '성형외과 서울', category: 'plastic-surgery', nameEn: 'Plastic Surgery' },
  { query: '피부과 서울', category: 'dermatology', nameEn: 'Dermatology' },
  { query: '치과 서울', category: 'dental', nameEn: 'Dental' },
  { query: '안과 서울', category: 'ophthalmology', nameEn: 'Ophthalmology' },
  { query: '한의원 서울', category: 'traditional-medicine', nameEn: 'Traditional Korean Medicine' },
  { query: '대학병원 서울', category: 'university-hospital', nameEn: 'University Hospital' },
  { query: '모발이식 서울', category: 'hair-transplant', nameEn: 'Hair Transplant' },
  { query: '건강검진센터 서울', category: 'health-checkup', nameEn: 'Health Checkup Center' },
];

// 서울 주요 지역
const SEOUL_DISTRICTS = [
  'Gangnam', 'Apgujeong', 'Sinsa', 'Cheongdam', 'Myeongdong',
  'Jamsil', 'Hongdae', 'Itaewon', 'Yeouido', 'Seodaemun'
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
  name_en?: string;
  description_ko?: string;
  description_en?: string;
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
  google_reviews?: HospitalReview[];  // Store actual Google reviews
  opening_hours?: string[];
  specialties: string[];
  category: string;
  source: string;
  status: string;
  crawled_at: string;
  // Default language fields (auto-generated)
  languages?: string[];
  certifications?: string[];
  has_cctv?: boolean;
  has_female_doctor?: boolean;
}

// =====================================================
// APIFY FUNCTIONS
// =====================================================

async function runApifyCrawler(searchQuery: string, maxResults: number = 100): Promise<GooglePlaceResult[]> {
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
        includeReviews: true,  // Include Google reviews
        maxReviews: 10,  // Get up to 10 reviews per place
        maxImages: 10,  // Increased from 5 to get more gallery images
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
  while (status === 'RUNNING' || status === 'READY') {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    );
    const statusData = await statusResponse.json();
    status = statusData.data.status;
    console.log(`   📊 Status: ${status}`);
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
// DATA PROCESSING
// =====================================================

function generateSlug(name: string): string {
  // Remove Korean characters for URL-safe slugs
  // Keep only English letters, numbers, and spaces
  return name
    .toLowerCase()
    .replace(/[가-힣]/g, '')  // Remove Korean characters
    .replace(/[^a-z0-9\s-]/g, '')  // Keep only alphanumeric and spaces
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')  // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'hospital';  // Fallback if empty
}

function extractDistrict(address: string): string | undefined {
  const districts = ['강남구', '서초구', '송파구', '용산구', '마포구', '중구', '종로구', '성동구', '광진구', '동대문구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '영등포구', '동작구', '관악구', '금천구', '구로구', '양천구', '강서구'];

  for (const district of districts) {
    if (address.includes(district)) {
      return district.replace('구', '');
    }
  }
  return undefined;
}

/**
 * Translates Korean hospital names to English.
 * Uses a combination of category translation and romanization for proper names.
 */
function translateCategoryToEnglish(koreanName: string, category: string): string {
  // Step 1: Remove all non-English characters (Korean, Japanese, Chinese, special symbols)
  let cleanedName = koreanName
    .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')  // Korean
    .replace(/[\u3040-\u309F\u30A0-\u30FF]/g, ' ')  // Japanese hiragana/katakana
    .replace(/[\u4E00-\u9FFF]/g, ' ')  // Chinese characters
    .replace(/[\u0400-\u04FF]/g, ' ')  // Cyrillic (Russian)
    .replace(/[\u0E00-\u0E7F]/g, ' ')  // Thai
    .replace(/[\u1100-\u11FF\uAC00-\uD7AF]/g, ' ')  // Korean extended
    .replace(/[ㅣ|｜\|]/g, ' ')  // Vertical bars
    .replace(/[^\w\s&-]/g, ' ')  // Keep only alphanumeric, spaces, &, -
    .replace(/\s+/g, ' ')
    .trim();

  // Step 2: Check if we have meaningful English text
  const englishWords = cleanedName.match(/[A-Za-z]{2,}/g) || [];

  if (englishWords.length >= 1) {
    // Remove duplicate phrases (like "Plastic Surgery" appearing twice)
    // First, normalize common phrases
    cleanedName = cleanedName
      .replace(/Plastic Surgery Plastic Surgery/gi, 'Plastic Surgery')
      .replace(/Dermatology Dermatology/gi, 'Dermatology')
      .replace(/Dental Dental/gi, 'Dental')
      .replace(/Eye Eye/gi, 'Eye')
      .replace(/Clinic Clinic/gi, 'Clinic')
      .replace(/Hospital Hospital/gi, 'Hospital');

    // Remove duplicate single words
    const words = cleanedName.split(' ').filter(w => w.length > 0);
    const uniqueWords: string[] = [];
    const seenLower = new Set<string>();

    for (const word of words) {
      const lower = word.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        uniqueWords.push(word);
      }
    }

    let result = uniqueWords.join(' ').trim();

    // Clean up leading/trailing special characters
    result = result.replace(/^[-&\s]+|[-&\s]+$/g, '').trim();

    // Add "Clinic" if no suffix exists and result is not empty
    if (result && !/(Clinic|Hospital|Center|Surgery)$/i.test(result)) {
      result += ' Clinic';
    }

    if (result && result.length > 3) {
      return result;
    }
  }

  // Category type translations
  const categoryTypes: Record<string, string> = {
    '성형외과': 'Plastic Surgery',
    '피부과': 'Dermatology',
    '치과': 'Dental',
    '안과': 'Eye',
    '한의원': 'Korean Medicine',
    '대학병원': 'University Hospital',
    '모발이식': 'Hair Transplant',
    '건강검진센터': 'Health Checkup',
    '의원': '',
    '병원': 'Hospital',
    '클리닉': 'Clinic',
  };

  // Common Korean name components to romanize/translate
  const nameComponents: Record<string, string> = {
    // Place names - Districts
    '강남': 'Gangnam',
    '압구정': 'Apgujeong',
    '청담': 'Cheongdam',
    '신사': 'Sinsa',
    '서울': 'Seoul',
    '홍대': 'Hongdae',
    '명동': 'Myeongdong',
    '이태원': 'Itaewon',
    '잠실': 'Jamsil',
    '여의도': 'Yeouido',
    '신촌': 'Sinchon',
    '종로': 'Jongno',
    '동대문': 'Dongdaemun',
    '삼성': 'Samsung',
    '역삼': 'Yeoksam',
    '선릉': 'Seolleung',
    '논현': 'Nonhyeon',
    '학동': 'Hakdong',
    '도곡': 'Dogok',
    '대치': 'Daechi',
    '일원': 'Irwon',
    '수서': 'Suseo',
    '잠원': 'Jamwon',
    '반포': 'Banpo',
    '방배': 'Bangbae',
    '서초': 'Seocho',
    '송파': 'Songpa',
    '마포': 'Mapo',
    '용산': 'Yongsan',
    '영등포': 'Yeongdeungpo',
    '성북': 'Seongbuk',
    '광진': 'Gwangjin',
    '관악': 'Gwanak',
    // Common clinic name words
    '어린': 'Young',
    '공주': 'Princess',
    '뷰티': 'Beauty',
    '미': 'Mi',
    '아름': 'Areum',
    '예쁜': 'Pretty',
    '예뻐지는': 'Beauty',
    '아이': 'Eye',
    '아이디': 'ID',
    '원장': 'Doctor',
    '박사': 'Dr',
    '더': 'The',
    '탑': 'Top',
    '베스트': 'Best',
    '프리미엄': 'Premium',
    '스타': 'Star',
    '라인': 'Line',
    '케어': 'Care',
    '힐링': 'Healing',
    '메디': 'Medi',
    '에스': 'S',
    '플러스': 'Plus',
    '센터': 'Center',
    '스킨': 'Skin',
    '글로벌': 'Global',
    '코리아': 'Korea',
    '인터내셔널': 'International',
    '네이처': 'Nature',
    '리프트': 'Lift',
    '코': 'Nose',
    '눈': 'Eye',
    '입술': 'Lips',
    '안면': 'Facial',
    '윤곽': 'Contour',
    // Additional common words
    '연세': 'Yonsei',
    '세브란스': 'Severance',
    '삼성서울': 'Samsung Seoul',
    '서울대': 'Seoul National',
    '고려대': 'Korea University',
    '아산': 'Asan',
    '차': 'CHA',
    '분당': 'Bundang',
    '바노바기': 'Banobagi',
    '그랜드': 'Grand',
    '리원': 'Rewon',
    '에이치': 'H',
    '제이': 'J',
    '비': 'B',
    '원': 'One',
    '투': 'Two',
    '쓰리': 'Three',
    '모아': 'Moa',
    '미소': 'Miso',
    '하나': 'Hana',
    '나라': 'Nara',
    '서울성모': 'Seoul St. Mary',
    '가톨릭대': 'Catholic University',
    '한양대': 'Hanyang University',
    '경희대': 'Kyunghee University',
    '중앙대': 'Chung-Ang University',
    '건국대': 'Konkuk University',
    '이화여대': 'Ewha Womans University',
    '순천향대': 'Soonchunhyang University',
    '인제대': 'Inje University',
    '한림대': 'Hallym University',
    '보라매': 'Boramae',
    '분당서울대': 'Seoul National University Bundang',
    '일산백': 'Ilsan Paik',
    '강동경희대': 'Gangdong Kyunghee',
    '강남세브란스': 'Gangnam Severance',
    '삼성창원': 'Samsung Changwon',
    '시티': 'City',
    '퍼스트': 'First',
    '로얄': 'Royal',
    '럭셔리': 'Luxury',
    '하이': 'High',
    '뉴': 'New',
    '오리지널': 'Original',
    '클래식': 'Classic',
    '모던': 'Modern',
    '에스테틱': 'Aesthetic',
    '메디컬': 'Medical',
    '헬스': 'Health',
    '웰니스': 'Wellness',
    '라이프': 'Life',
    '뷰': 'View',
    '스마일': 'Smile',
    '해피': 'Happy',
    '굿': 'Good',
    '골드': 'Gold',
    '실버': 'Silver',
    '다이아': 'Diamond',
    '크리스탈': 'Crystal',
    '젤': 'Gel',
    '앤': 'And',
    '엔': 'N',
    '앤드': 'And',
    '포': 'For',
    '유': 'You',
    '위드': 'With',
    '바이': 'By',
  };

  let englishName = koreanName;

  // First, replace category types
  for (const [ko, en] of Object.entries(categoryTypes)) {
    if (englishName.includes(ko)) {
      englishName = englishName.replace(ko, en ? ` ${en}` : '');
    }
  }

  // Then, romanize/translate common name components
  for (const [ko, en] of Object.entries(nameComponents)) {
    if (englishName.includes(ko)) {
      englishName = englishName.replace(new RegExp(ko, 'g'), en);
    }
  }

  // Clean up: remove any remaining Korean characters and clean spacing
  // Keep the Korean characters only if they couldn't be translated
  const hasKorean = /[가-힣]/.test(englishName);

  if (hasKorean) {
    // If there are still Korean characters, generate a generic English name
    const categoryDisplayName = getCategoryDisplayName(category);

    // Try to extract any English/romanized parts
    const englishParts = englishName.match(/[A-Za-z]+/g);
    if (englishParts && englishParts.length > 0) {
      // Use extracted English parts + category
      const cleanParts = englishParts.filter(p => p.length > 1).join(' ');
      return `${cleanParts} ${categoryDisplayName} Clinic`.replace(/\s+/g, ' ').trim();
    }

    // Fallback to category-based name with location
    return `Seoul ${categoryDisplayName} Clinic`;
  }

  // Clean up multiple spaces and trim
  englishName = englishName.replace(/\s+/g, ' ').trim();

  // Add "Clinic" suffix if not present
  if (!/(Clinic|Hospital|Center)$/i.test(englishName)) {
    englishName += ' Clinic';
  }

  return englishName;
}

function processPlaceData(place: GooglePlaceResult, category: string): HospitalData {
  const district = extractDistrict(place.address);
  const categoryNameEn = getCategoryDisplayName(category);

  // Generate English name first, then use it for slug
  const nameEn = translateCategoryToEnglish(place.title, category);

  // Generate slug from English name (more SEO-friendly)
  const slug = generateSlugFromEnglish(nameEn, place.placeId);

  // Generate better English description
  const descriptionEn = generateEnglishDescription(place, category, district);

  // Process Google reviews
  const googleReviews: HospitalReview[] = (place.reviews || []).map(review => ({
    author: review.name || 'Anonymous',
    rating: review.stars || 5,
    content: review.text || '',
    date: review.publishedAtDate,
    response: review.responseFromOwnerText,
  })).filter(r => r.content.length > 0);  // Only keep reviews with content

  const hospitalData: HospitalData = {
    google_place_id: place.placeId,
    slug,
    name_ko: place.title,
    name_en: nameEn,
    description_ko: place.description || `${place.title}은(는) 서울에 위치한 전문 의료시설입니다. 최신 시설과 전문의가 환자 중심의 진료를 제공합니다.`,
    description_en: descriptionEn,
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
    google_photos: place.imageUrls?.slice(0, 15), // Increased to 15 photos
    opening_hours: place.openingHours,
    specialties: [categoryNameEn],
    category,
    source: 'google_places',
    status: 'published',  // Auto-publish for traffic
    crawled_at: new Date().toISOString(),
    // Default values (can be updated later)
    languages: ['Korean', 'English'],
    certifications: [],
    has_cctv: false,
    has_female_doctor: false,
  };

  // Only add google_reviews if we have them (column may not exist yet)
  if (googleReviews.length > 0) {
    hospitalData.google_reviews = googleReviews;
  }

  return hospitalData;
}

// Generate SEO-friendly slug from English name
function generateSlugFromEnglish(englishName: string, placeId: string): string {
  const baseSlug = englishName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Keep only alphanumeric and spaces
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

  // Add short place ID for uniqueness
  const shortId = placeId.substring(0, 8);
  return baseSlug ? `${baseSlug}-${shortId}` : `hospital-${shortId}`;
}

function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dental',
    'ophthalmology': 'Ophthalmology',
    'traditional-medicine': 'Traditional Korean Medicine',
    'university-hospital': 'General Medicine',
    'hair-transplant': 'Hair Transplant',
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

  description += ` The clinic offers comprehensive ${categoryNameEn.toLowerCase()} services with experienced medical professionals.`;

  if (place.website) {
    description += ` International patients are welcome, and the clinic provides consultation services for overseas visitors.`;
  }

  return description;
}

// =====================================================
// DATABASE FUNCTIONS
// =====================================================

async function saveHospitalToDatabase(hospital: HospitalData): Promise<{ success: boolean; isNew: boolean }> {
  try {
    // Check if already exists by google_place_id
    const { data: existing } = await supabase
      .from('hospitals')
      .select('id')
      .eq('google_place_id', hospital.google_place_id)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('hospitals')
        .update({
          ...hospital,
          updated_at: new Date().toISOString(),
        })
        .eq('google_place_id', hospital.google_place_id);

      if (error) {
        console.error(`   ❌ Update failed for ${hospital.name_ko}:`, error.message);
        return { success: false, isNew: false };
      }
      return { success: true, isNew: false };
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('hospitals')
        .insert(hospital)
        .select('id')
        .single();

      if (error) {
        console.error(`   ❌ Insert failed for ${hospital.name_ko}:`, error.message);
        console.error(`      Details:`, error.details || error.hint || 'No details');
        return { success: false, isNew: true };
      }
      console.log(`   ✅ Inserted with ID: ${data.id}`);
      return { success: true, isNew: true };
    }
  } catch (error) {
    console.error(`   ❌ Failed to save ${hospital.name_ko}:`, error);
    return { success: false, isNew: false };
  }
}

// =====================================================
// MAIN CRAWLER
// =====================================================

async function crawlAllCategories() {
  console.log('\n🏥 Google Places Hospital Crawler');
  console.log('='.repeat(60));

  if (!APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN is not set in environment variables');
    console.log('\n📋 To get started:');
    console.log('   1. Sign up at https://apify.com');
    console.log('   2. Get your API token from Settings > Integrations');
    console.log('   3. Run: APIFY_API_TOKEN=your_token npx tsx scripts/crawl-google-places-hospitals.ts');
    return;
  }

  const stats = {
    totalCrawled: 0,
    newInserted: 0,
    updated: 0,
    errors: 0,
  };

  for (const category of MEDICAL_CATEGORIES) {
    console.log(`\n📂 Category: ${category.nameEn}`);
    console.log('-'.repeat(40));

    try {
      const places = await runApifyCrawler(category.query, 50);

      for (const place of places) {
        const hospitalData = processPlaceData(place, category.category);
        const result = await saveHospitalToDatabase(hospitalData);

        stats.totalCrawled++;
        if (result.success && result.isNew) {
          stats.newInserted++;
          console.log(`   ✅ NEW: ${hospitalData.name_ko}`);
        } else if (result.success) {
          stats.updated++;
        } else {
          stats.errors++;
        }
      }

      // Rate limiting between categories
      console.log(`   ⏳ Waiting 10 seconds before next category...`);
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
      console.error(`   ❌ Error crawling ${category.nameEn}:`, error);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CRAWL SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Total places crawled: ${stats.totalCrawled}`);
  console.log(`   New hospitals added: ${stats.newInserted}`);
  console.log(`   Existing updated: ${stats.updated}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log('\n✅ Crawl complete!');
  console.log('   Next steps:');
  console.log('   1. Review draft hospitals in admin panel');
  console.log('   2. Add AI-generated descriptions');
  console.log('   3. Translate to other languages');
  console.log('   4. Publish approved hospitals');
}

// =====================================================
// SINGLE CATEGORY CRAWLER (for testing)
// =====================================================

async function crawlSingleCategory(query: string, category: string, maxResults: number = 20) {
  console.log(`\n🔍 Single Category Crawl: "${query}"`);
  console.log('='.repeat(60));

  if (!APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN is not set');
    return;
  }

  try {
    const places = await runApifyCrawler(query, maxResults);

    console.log(`\n📋 Found ${places.length} places:\n`);

    for (const place of places) {
      const hospitalData = processPlaceData(place, category);
      console.log(`   📍 ${hospitalData.name_ko}`);
      console.log(`      Address: ${hospitalData.address}`);
      console.log(`      Rating: ${hospitalData.avg_rating || 'N/A'} (${hospitalData.review_count || 0} reviews)`);
      console.log(`      Phone: ${hospitalData.phone || 'N/A'}`);
      console.log(`      Website: ${hospitalData.website || 'N/A'}`);
      console.log(`      Photos: ${hospitalData.google_photos?.length || 0}`);
      console.log('');

      // Save to database
      const result = await saveHospitalToDatabase(hospitalData);
      if (result.success) {
        console.log(`      ${result.isNew ? '✅ Saved (new)' : '📝 Updated'}`);
      } else {
        console.log(`      ⚠️ Save failed`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// =====================================================
// DELETE ALL GOOGLE PLACES HOSPITALS
// =====================================================

async function deleteGooglePlacesHospitals() {
  console.log('\n🗑️ Deleting all Google Places hospitals...');
  console.log('='.repeat(60));

  try {
    // First, count how many will be deleted
    const { count } = await supabase
      .from('hospitals')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'google_places');

    console.log(`   Found ${count} hospitals from Google Places`);

    if (!count || count === 0) {
      console.log('   No hospitals to delete.');
      return 0;
    }

    // Delete all google_places hospitals
    const { error } = await supabase
      .from('hospitals')
      .delete()
      .eq('source', 'google_places');

    if (error) {
      console.error('   ❌ Delete failed:', error.message);
      return 0;
    }

    console.log(`   ✅ Deleted ${count} hospitals`);
    return count;
  } catch (error) {
    console.error('   ❌ Error:', error);
    return 0;
  }
}

// =====================================================
// CRAWL 100 TOP HOSPITALS (by review count)
// =====================================================

async function crawl100TopHospitals() {
  console.log('\n🏥 Crawling Top 100 Hospitals by Review Count');
  console.log('='.repeat(60));

  if (!APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN is not set in environment variables');
    return;
  }

  // Priority categories with target counts (total ~100)
  const crawlPlan = [
    { query: '성형외과 강남', category: 'plastic-surgery', count: 25 },
    { query: '성형외과 압구정', category: 'plastic-surgery', count: 15 },
    { query: '성형외과 청담', category: 'plastic-surgery', count: 10 },
    { query: '피부과 강남', category: 'dermatology', count: 15 },
    { query: '치과 서울', category: 'dental', count: 10 },
    { query: '대학병원 서울', category: 'university-hospital', count: 10 },
    { query: '안과 서울', category: 'ophthalmology', count: 5 },
    { query: '모발이식 서울', category: 'hair-transplant', count: 5 },
    { query: '건강검진센터 서울', category: 'health-checkup', count: 5 },
  ];

  const allHospitals: HospitalData[] = [];
  const seenPlaceIds = new Set<string>();

  for (const plan of crawlPlan) {
    console.log(`\n📂 Crawling: ${plan.query} (target: ${plan.count})`);
    console.log('-'.repeat(40));

    try {
      const places = await runApifyCrawler(plan.query, plan.count + 10); // Get extra to filter

      // Filter and sort by review count (most popular first)
      const sortedPlaces = places
        .filter((p: GooglePlaceResult) => !seenPlaceIds.has(p.placeId))
        .sort((a: GooglePlaceResult, b: GooglePlaceResult) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        .slice(0, plan.count);

      console.log(`   Found ${places.length} places, using top ${sortedPlaces.length} by review count`);

      for (const place of sortedPlaces) {
        seenPlaceIds.add(place.placeId);
        const hospitalData = processPlaceData(place, plan.category);
        allHospitals.push(hospitalData);
        console.log(`   ✅ ${hospitalData.name_en} (${place.reviewsCount || 0} reviews)`);
      }

      // Rate limiting
      console.log(`   ⏳ Waiting 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error(`   ❌ Error crawling ${plan.query}:`, error);
    }
  }

  // Sort all by review count and take top 100
  const top100 = allHospitals
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 100);

  console.log(`\n📊 Total unique hospitals collected: ${allHospitals.length}`);
  console.log(`   Saving top 100 by review count...`);

  // Save to database
  let saved = 0;
  let errors = 0;

  for (const hospital of top100) {
    const result = await saveHospitalToDatabase(hospital);
    if (result.success) {
      saved++;
      console.log(`   ${saved}. ${hospital.name_en} → ${hospital.slug}`);
    } else {
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Hospitals saved: ${saved}`);
  console.log(`   Errors: ${errors}`);
  console.log('\n✅ Done! Top 100 hospitals are now in the database.');
}

// =====================================================
// RUN
// =====================================================

const args = process.argv.slice(2);

if (args[0] === '--test') {
  // Test with a single category
  crawlSingleCategory('성형외과 강남', 'plastic-surgery', 10);
} else if (args[0] === '--all') {
  // Crawl all categories
  crawlAllCategories();
} else if (args[0] === '--delete') {
  // Delete all google_places hospitals
  deleteGooglePlacesHospitals();
} else if (args[0] === '--top100') {
  // Delete existing and crawl top 100
  (async () => {
    await deleteGooglePlacesHospitals();
    console.log('\n⏳ Waiting 3 seconds before crawling...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await crawl100TopHospitals();
  })();
} else {
  console.log(`
🏥 Google Places Hospital Crawler

Usage:
  npx tsx scripts/crawl-google-places-hospitals.ts --test     # Test with 10 plastic surgery clinics
  npx tsx scripts/crawl-google-places-hospitals.ts --all      # Crawl all categories (50 each)
  npx tsx scripts/crawl-google-places-hospitals.ts --delete   # Delete all Google Places hospitals
  npx tsx scripts/crawl-google-places-hospitals.ts --top100   # Delete + Crawl top 100 by reviews

Requirements:
  - APIFY_API_TOKEN environment variable
  - Supabase credentials in .env.local

Categories to crawl:
  - 성형외과 (Plastic Surgery)
  - 피부과 (Dermatology)
  - 치과 (Dental)
  - 안과 (Ophthalmology)
  - 한의원 (Traditional Korean Medicine)
  - 대학병원 (University Hospital)
  - 모발이식 (Hair Transplant)
  - 건강검진센터 (Health Checkup)
`);
}
