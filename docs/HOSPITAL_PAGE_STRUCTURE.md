# Hospital Page Structure & Crawl Rules

> Last Updated: 2026-01-25

## Quick Start - 병원 크롤링 & 페이지 생성

### 1. 환경 변수 설정
```bash
# .env.local에 추가
APIFY_API_TOKEN=your_apify_token
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. 크롤링 실행
```bash
# 테스트 (강남 성형외과 10개)
npx tsx scripts/crawl-google-places-hospitals.ts --test

# 전체 카테고리 크롤링
npx tsx scripts/crawl-google-places-hospitals.ts --all
```

### 3. 크롤링 후 자동 처리
크롤링된 데이터는 자동으로:
- ✅ `hospitals` 테이블에 저장
- ✅ slug 자동 생성 (영문 + placeId 8자리)
- ✅ 병원 페이지 자동 생성 (`/[locale]/hospitals/[slug]`)
- ✅ 다국어 지원 (8개 언어: en, ko, ja, zh-CN, zh-TW, th, mn, ru)
- ✅ About 섹션 자동 생성 (병원 데이터 기반)
- ✅ Google Photos 자동 반영 (최대 15장)
- ✅ 관련 블로그 글 자동 연결

### 4. 수동 작업 (선택)
- `status: 'draft'` → `'published'` 변경
- AI Summary 추가 (ai_summary_en, ai_summary_ja 등)
- 다국어 이름/설명 추가
- certifications, has_cctv, has_female_doctor 설정

---

## ✅ 자동화 검증 체크리스트

### 1. 구글맵 스크래퍼로 병원 페이지 완벽 생성
```
✅ 확인됨:
- 크롤링 실행 시 자동으로 DB 저장
- slug 자동 생성으로 페이지 URL 즉시 접근 가능
- 영문 설명 자동 생성 (카테고리, 위치, 평점 기반)
- 기본 언어 지원 값 자동 설정 (Korean, English)
- 사진 최대 15장 자동 수집
```

### 2. 관련 블로그 글 자동 업데이트
```
✅ 확인됨:
- blog_posts 테이블에서 published_at DESC로 최신 글 우선
- 병원 category와 specialties 기반으로 관련 글 필터링
- 새 글이 추가되면 페이지 렌더링 시 자동 반영
- 매칭 글이 2개 미만이면 최신 글로 대체 표시
```

### 3. 8개 언어 다국어 지원
```
✅ 확인됨:
- 지원 언어: en, ko, ja, zh-CN, zh-TW, th, mn, ru
- locale별 name/description fallback 로직
- 관련 블로그 글도 locale별 title/excerpt 표시
- CTA 버튼 텍스트 다국어 지원
- 날짜 포맷 locale별 자동 적용
```

### 4. 스토리텔링 & CTA 최적화
```
✅ 확인됨:
- Hero: 평점 배지, 리뷰 수, 위치 정보 강조
- About 확장 섹션: 자동 생성 설명 문단
- "Why Patients Choose" 섹션: 신뢰 요소 나열
- GetCareKorea Service Banner: FREE 통역 서비스 강조
- 사이드바: "Why Book Through Us" 5가지 혜택
- Review CTA: Google Maps 리뷰 보기 유도
- 관련 블로그 글: 정보 제공 + 신뢰 구축
```

### 5. Google Maps 사진 반영
```
✅ 확인됨:
- 크롤러에서 maxImages: 10 → 15로 확대
- google_photos 배열이 gallery로 자동 매핑
- next.config.ts에 모든 Google 이미지 도메인 설정:
  - lh3.googleusercontent.com
  - lh5.googleusercontent.com
  - streetviewpixels-pa.googleapis.com
  - maps.googleapis.com
  - maps.gstatic.com
```

---

## Overview

병원 페이지는 Google Places API를 통해 크롤링된 데이터를 기반으로 **자동 생성**됩니다.
크롤링 한 번으로 병원 정보, 사진, 지도, 리뷰 등 모든 섹션이 자동으로 구성됩니다.

---

## Page Sections (자동 생성)

### 1. Hero Section
```
- 병원 커버 이미지 (Google Photos 첫번째)
- 병원명 (locale에 따라 다르게 표시)
  - 영어권: 영문명만
  - 기타: 현지화된 이름 또는 영문명 fallback
- 배지: Featured, JCI, Verified
- 위치, 평점, 리뷰 수
- 갤러리 네비게이션 (좌우 버튼)
```

### 2. AI Summary Section (Optional)
```
- ai_summary 필드가 있을 때만 표시
- 통역사 페르소나 기반 요약
- 8개 언어별 지원 (ai_summary_en, ai_summary_ja, etc.)
```

### 3. About This Hospital (확장됨 ⭐)
```
자동 생성 콘텐츠:
- 병원 설명 (description 필드)
- 병원 데이터 기반 확장 설명 (자동 생성):
  - "[병원명] is a renowned [카테고리] located in [지역]..."
  - "With an outstanding rating of [평점] stars..."
  - "The clinic specializes in [전문분야]..."
  - "As a [JCI-accredited] medical institution..."
  - "To better serve international patients, the clinic provides multilingual support..."

Quick Facts 그리드:
  - Type: 병원 카테고리
  - Location: 구/시
  - Rating: 평점 & 리뷰 수
  - Verified: Google Data 배지

Why Patients Choose [병원명] 섹션:
  - Highly Rated (4.5+ 평점)
  - JCI Accredited
  - Expert Specialists
  - Multilingual Support
  - Safety First (CCTV)
  - Female Doctor
```

### 4. GetCareKorea Service Banner (CTA 강화 ⭐)
```
- "Planning to Visit [병원명]?" 메시지
- FREE 통역 서비스 홍보
- 체크리스트:
  - FREE professional medical interpreter
  - Direct hospital appointment booking
  - Price comparison & best deals
  - 24/7 support during your stay
- CTA 버튼: Get Free Quote, Book with Interpreter
- "No fees • Response within 24h" 신뢰 문구
```

### 5. Photo Gallery
```
- Google Photos에서 가져온 이미지들 (최대 15장)
- 그리드 레이아웃 (2-3열)
- 6개 이상일 경우 "View All" 버튼
```

### 6. Specialties
```
- 병원 전문 분야 배지
- specialties[] 배열에서 가져옴
```

### 7. Location & Map
```
- 주소 표시
- Google Maps Embed (latitude/longitude 기반)
- "Open in Google Maps" 버튼
```

### 8. Trust & Safety
```
- Certifications (JCI, KHA 등)
- CCTV Monitoring 여부
- Female Doctor 여부
- Languages 지원
```

### 9. CTA Banner (Interpreter Service)
```
- "Need Help Communicating?" 배너
- Request Interpreter 버튼
- Book Consultation 버튼
```

### 10. Related Blog Articles (신규 ⭐)
```
- 병원 카테고리/전문분야 기반 관련 글 추천
- 최대 3개 글 카드 형태로 표시
- 이미지, 제목, 발췌문, 날짜 포함
- "View all articles" 및 "Explore More Guides" 링크
- 새 글 추가 시 자동 업데이트
```

### 11. Reviews Section (개선됨 ⭐)
```
- Google 스타일 평점 요약
- 별점 분포 차트 (평균 평점 기반 추정)
- Highly Rated 배지 (4.5+ 평점)
- Google Reviews CTA 카드
- "View on Google Maps" 버튼
- 샘플 리뷰 목록 (mock data)
```

### 12. Sidebar
```
- Main CTA:
  - locale별 다국어 문구
  - Get Free Quote 버튼
  - Book with Interpreter 버튼
  - Trust badges
- Contact Info:
  - Phone
  - Website
  - Address
  - Opening Hours
- Why Book Through Us:
  - Free Interpreter Service
  - Verified Hospitals
  - Best Price Guarantee
  - 24/7 Support
  - Aftercare Included
- Quick Contact (WhatsApp/Chat)
```

---

## Data Flow

### 크롤링 → 페이지 자동 생성 플로우
```
┌─────────────────────────────────────────────────────────────────┐
│  1. 크롤링 실행                                                   │
│     npx tsx scripts/crawl-google-places-hospitals.ts --all      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Apify Google Places Crawler                                  │
│     - 성형외과, 피부과, 치과, 안과, 한의원, 대학병원 등            │
│     - 사진 최대 15장, 평점, 리뷰수, 영업시간, 좌표 수집            │
│     - 영문 설명 자동 생성                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Supabase hospitals 테이블 저장                               │
│     - google_place_id로 중복 체크                                │
│     - 신규: INSERT, 기존: UPDATE                                 │
│     - status: 'draft' (수동 검토 필요)                           │
│     - languages: ['Korean', 'English'] 기본값                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. 병원 페이지 자동 렌더링                                       │
│     /[locale]/hospitals/[slug]                                  │
│     - page.tsx: Supabase 쿼리 + 관련 블로그 글 fetch             │
│     - HospitalDetailClient.tsx: UI 렌더링                        │
│     - 8개 언어 자동 지원                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Fields

### Core Fields
| Field | Type | Description |
|-------|------|-------------|
| `name_en` | text | English name |
| `name_ko` | text | Korean name |
| `description_en` | text | English description (auto-generated) |
| `description_ko` | text | Korean description |
| `slug` | text | URL-safe slug |
| `status` | enum | draft, published |

### Google Places Fields (자동 수집)
| Field | Type | Description |
|-------|------|-------------|
| `google_place_id` | text | Google Place ID |
| `google_maps_url` | text | Google Maps URL |
| `google_photos` | text[] | Array of photo URLs (max 15) |
| `latitude` | decimal | Latitude |
| `longitude` | decimal | Longitude |
| `avg_rating` | decimal | Average rating (1-5) |
| `review_count` | int | Number of reviews |
| `opening_hours` | text[] | Opening hours |
| `category` | text | Clinic category |
| `source` | text | 'google_places' |
| `crawled_at` | timestamp | Last crawl time |

### Trust & Safety Fields
| Field | Type | Description |
|-------|------|-------------|
| `certifications` | text[] | ['JCI', 'KHA'] |
| `has_cctv` | boolean | CCTV 모니터링 |
| `has_female_doctor` | boolean | 여의사 |
| `languages` | text[] | 지원 언어 (default: Korean, English) |

### AI Summary Fields (수동 추가)
| Field | Type | Description |
|-------|------|-------------|
| `ai_summary_en` | text | English AI summary |
| `ai_summary_ko` | text | Korean AI summary |
| `ai_summary_ja` | text | Japanese AI summary |
| `ai_summary_zh_cn` | text | Simplified Chinese |
| `ai_summary_zh_tw` | text | Traditional Chinese |
| `ai_summary_th` | text | Thai AI summary |
| `ai_summary_mn` | text | Mongolian AI summary |
| `ai_summary_ru` | text | Russian AI summary |

---

## Crawling Rules

### Category Mapping
| Korean Query | Category Slug | Display Name |
|-------------|---------------|--------------|
| 성형외과 | plastic-surgery | Plastic Surgery Clinic |
| 피부과 | dermatology | Dermatology Clinic |
| 치과 | dental | Dental Clinic |
| 안과 | ophthalmology | Eye Clinic |
| 한의원 | traditional-medicine | Korean Medicine Clinic |
| 대학병원 | university-hospital | University Hospital |
| 모발이식 | hair-transplant | Hair Transplant Clinic |
| 건강검진센터 | health-checkup | Health Checkup Center |

### Slug Generation
```typescript
function generateSlug(name: string, placeId: string): string {
  // 1. Remove Korean characters
  // 2. Keep only alphanumeric
  // 3. Add placeId suffix for uniqueness
  return cleanName + '-' + placeId.substring(0, 8);
}
// Example: "grand-plastic-surgery-ChIJN1t_"
```

### English Description Auto-Generation
```typescript
function generateEnglishDescription(place, category, district): string {
  // 자동 생성:
  // "[병원명] is a specialized [카테고리] clinic located in [지역], South Korea."
  // "With a [평점]-star rating from [리뷰수] patient reviews..."
  // "The clinic offers comprehensive [카테고리] services..."
  // "International patients are welcome..."
}
```

### District Extraction
```typescript
const districts = [
  '강남구', '서초구', '송파구', '용산구', '마포구',
  '중구', '종로구', '성동구', '광진구', ...
];
// Address에서 자동 추출 → district 필드에 저장
```

---

## Locale-Specific Behavior

### Hospital Name Display
| Locale | Name Display Logic |
|--------|-------------------|
| `en` | name_en \|\| name_ko |
| `ja` | name_ja \|\| name_en \|\| name_ko |
| `zh-CN` | name_zh_cn \|\| name_en \|\| name_ko |
| `zh-TW` | name_zh_tw \|\| name_en \|\| name_ko |
| `th` | name_th \|\| name_en \|\| name_ko |
| `mn` | name_mn \|\| name_en \|\| name_ko |
| `ru` | name_ru \|\| name_en \|\| name_ko |
| `ko` | name_ko \|\| name_en |

### CTA Text by Locale
```typescript
const ctaMap = {
  'en': { title: 'Ready to Book?', cta2: 'Book with Interpreter', interpreter: 'Includes FREE interpreter' },
  'ja': { title: '予約の準備はできましたか？', cta2: '通訳付きで予約', interpreter: '無料通訳サービス付き' },
  'zh_cn': { title: '准备预约？', cta2: '带翻译预约', interpreter: '包含免费翻译' },
  'zh_tw': { title: '準備預約？', cta2: '帶翻譯預約', interpreter: '包含免費翻譯' },
  'th': { title: 'พร้อมจองแล้ว?', cta2: 'จองพร้อมล่าม', interpreter: 'ล่ามฟรี' },
  'ru': { title: 'Готовы к записи?', cta2: 'Записаться с переводчиком', interpreter: 'Бесплатный переводчик' },
  'mn': { title: 'Захиалга хийхэд бэлэн үү?', cta2: 'Орчуулагчтай захиалах', interpreter: 'Үнэгүй орчуулагч' },
};
```

---

## Related Files

| File | Purpose |
|------|---------|
| [crawl-google-places-hospitals.ts](../scripts/crawl-google-places-hospitals.ts) | 크롤링 스크립트 |
| [fix-hospital-slugs.ts](../scripts/fix-hospital-slugs.ts) | Slug 수정 스크립트 |
| [page.tsx](../src/app/[locale]/hospitals/[slug]/page.tsx) | Server Component (데이터 fetch) |
| [HospitalDetailClient.tsx](../src/app/[locale]/hospitals/[slug]/HospitalDetailClient.tsx) | Client Component (UI 렌더링) |
| [next.config.ts](../next.config.ts) | 이미지 도메인 설정 |
| [config.ts](../src/lib/i18n/config.ts) | 다국어 설정 |

---

## Troubleshooting

### 크롤링이 안 될 때
```bash
# 1. API 토큰 확인
echo $APIFY_API_TOKEN

# 2. Apify 계정에서 크레딧 확인
# https://console.apify.com/account/usage

# 3. 테스트 모드로 실행
npx tsx scripts/crawl-google-places-hospitals.ts --test
```

### 페이지가 404일 때
```sql
-- 1. status 확인
SELECT slug, status FROM hospitals WHERE slug = 'your-slug';

-- 2. published로 변경
UPDATE hospitals SET status = 'published' WHERE slug = 'your-slug';
```

### 이미지가 안 보일 때
```typescript
// next.config.ts에 도메인 추가 (이미 설정됨)
images: {
  remotePatterns: [
    { hostname: 'lh3.googleusercontent.com' },
    { hostname: 'lh5.googleusercontent.com' },
    { hostname: 'streetviewpixels-pa.googleapis.com' },
    { hostname: 'maps.googleapis.com' },
    { hostname: 'maps.gstatic.com' },
  ],
}
```

### 관련 블로그 글이 안 보일 때
```sql
-- blog_posts 테이블 확인
SELECT id, slug, category, status, published_at
FROM blog_posts
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT 10;
```

---

## Future Improvements

- [ ] AI Summary 자동 생성 (GPT/Claude)
- [ ] Google Reviews 실시간 연동 (실제 리뷰 텍스트)
- [ ] Nearby Hospitals 섹션
- [ ] Virtual Tour 360도 이미지
- [ ] Doctor profiles 연동
- [ ] Real-time availability calendar
- [ ] 크롤링 스케줄러 (Cron job)
- [ ] 다국어 자동 번역 (병원명, 설명)
