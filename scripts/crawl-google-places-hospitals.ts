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
  opening_hours?: string[];
  specialties: string[];
  category: string;
  source: string;
  status: string;
  crawled_at: string;
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
        includeReviews: false,  // 리뷰는 따로 수집
        maxImages: 5,
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

function translateCategoryToEnglish(koreanName: string): string {
  const translations: Record<string, string> = {
    '성형외과': 'Plastic Surgery Clinic',
    '피부과': 'Dermatology Clinic',
    '치과': 'Dental Clinic',
    '안과': 'Eye Clinic',
    '한의원': 'Korean Medicine Clinic',
    '대학병원': 'University Hospital',
    '모발이식': 'Hair Transplant Clinic',
    '건강검진센터': 'Health Checkup Center',
    '의원': 'Clinic',
    '병원': 'Hospital',
  };

  for (const [ko, en] of Object.entries(translations)) {
    if (koreanName.includes(ko)) {
      return koreanName.replace(ko, en);
    }
  }
  return koreanName;
}

function processPlaceData(place: GooglePlaceResult, category: string): HospitalData {
  const slug = generateSlug(place.title) + '-' + place.placeId.substring(0, 8);

  return {
    google_place_id: place.placeId,
    slug,
    name_ko: place.title,
    name_en: translateCategoryToEnglish(place.title),
    description_ko: place.description || `${place.title}은(는) 서울에 위치한 의료시설입니다.`,
    description_en: place.description
      ? translateCategoryToEnglish(place.description)
      : `${translateCategoryToEnglish(place.title)} is a medical facility located in Seoul.`,
    address: place.address,
    city: 'Seoul',
    district: extractDistrict(place.address),
    phone: place.phone,
    website: place.website,
    latitude: place.latitude,
    longitude: place.longitude,
    avg_rating: place.rating,
    review_count: place.reviewsCount,
    google_maps_url: place.url,
    google_photos: place.imageUrls?.slice(0, 10),
    opening_hours: place.openingHours,
    specialties: [category],
    category,
    source: 'google_places',
    status: 'draft',  // 수동 검토 필요
    crawled_at: new Date().toISOString(),
  };
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
// RUN
// =====================================================

const args = process.argv.slice(2);

if (args[0] === '--test') {
  // Test with a single category
  crawlSingleCategory('성형외과 강남', 'plastic-surgery', 10);
} else if (args[0] === '--all') {
  // Crawl all categories
  crawlAllCategories();
} else {
  console.log(`
🏥 Google Places Hospital Crawler

Usage:
  npx tsx scripts/crawl-google-places-hospitals.ts --test    # Test with 10 plastic surgery clinics
  npx tsx scripts/crawl-google-places-hospitals.ts --all     # Crawl all categories

Requirements:
  - APIFY_API_TOKEN environment variable
  - Apify account with crawler-google-places actor access

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
