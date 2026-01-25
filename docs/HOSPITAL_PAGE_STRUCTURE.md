# Hospital Page Structure & Crawl Rules

> Last Updated: 2026-01-25

## Overview

병원 페이지는 Google Places API를 통해 크롤링된 데이터를 기반으로 자동 생성됩니다.
이 문서는 병원 페이지의 구조와 크롤링 규칙을 설명합니다.

---

## Page Sections

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

### 3. About This Hospital
```
- 병원 설명 (description)
- Quick Facts:
  - Type: 병원 카테고리
  - Location: 구/시
  - Rating: 평점 & 리뷰 수
  - Data Source: Google Verified 배지
```

### 4. Photo Gallery
```
- Google Photos에서 가져온 이미지들
- 그리드 레이아웃 (2-3열)
- 6개 이상일 경우 "View All" 버튼
```

### 5. Specialties
```
- 병원 전문 분야 배지
- specialties[] 배열에서 가져옴
```

### 6. Location & Map
```
- 주소 표시
- Google Maps Embed (latitude/longitude 기반)
- "Open in Google Maps" 버튼
```

### 7. Trust & Safety
```
- Certifications (JCI, KHA 등)
- CCTV Monitoring 여부
- Female Doctor 여부
- Languages 지원
```

### 8. CTA Banner (Interpreter Service)
```
- "Need Help Communicating?" 배너
- Request Interpreter 버튼
- Book Consultation 버튼
```

### 9. Reviews Section
```
- Google 스타일 평점 요약
- 별점 분포 차트
- Highly Rated 배지 (4.5+ 평점)
- 리뷰 목록
- "View on Google Maps" 링크
```

### 10. Sidebar
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

### Crawling (Apify Google Places)
```
scripts/crawl-google-places-hospitals.ts
                │
                ▼
          Google Places API
                │
                ▼
         hospitals table
```

### Page Rendering
```
page.tsx (Server Component)
         │
         ▼
   Supabase Query
         │
         ▼
HospitalDetailClient.tsx (Client Component)
```

---

## Database Fields Used

### Core Fields
| Field | Type | Description |
|-------|------|-------------|
| `name_en` | text | English name |
| `name_ko` | text | Korean name |
| `description_en` | text | English description |
| `description_ko` | text | Korean description |
| `slug` | text | URL-safe slug |
| `status` | enum | draft, published |

### Google Places Fields
| Field | Type | Description |
|-------|------|-------------|
| `google_place_id` | text | Google Place ID |
| `google_maps_url` | text | Google Maps URL |
| `google_photos` | text[] | Array of photo URLs |
| `latitude` | decimal | Latitude |
| `longitude` | decimal | Longitude |
| `avg_rating` | decimal | Average rating (1-5) |
| `review_count` | int | Number of reviews |
| `opening_hours` | text[] | Opening hours |
| `category` | text | Clinic category |
| `source` | text | 'google_places' |
| `crawled_at` | timestamp | Last crawl time |

### AI Summary Fields
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

### Slug Generation
```typescript
function generateSlug(name: string, placeId: string): string {
  // 1. Remove Korean characters
  // 2. Keep only alphanumeric
  // 3. Add placeId suffix for uniqueness
  return cleanName + '-' + placeId.substring(0, 8);
}
```

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

### District Extraction
```typescript
const districts = [
  '강남구', '서초구', '송파구', '용산구', '마포구',
  '중구', '종로구', '성동구', '광진구', ...
];
```

---

## Locale-Specific Behavior

### Hospital Name Display
| Locale | Name Display Logic |
|--------|-------------------|
| `en` | name_en || name_ko |
| `ja` | name_ja || name_en || name_ko |
| `zh-CN` | name_zh_cn || name_en || name_ko |
| `zh-TW` | name_zh_tw || name_en || name_ko |
| `th` | name_th || name_en || name_ko |
| `mn` | name_mn || name_en || name_ko |
| `ru` | name_ru || name_en || name_ko |
| `ko` | name_ko || name_en |

### CTA Text by Locale
```typescript
const ctaMap = {
  'en': { title: 'Ready to Book?', cta2: 'Book with Interpreter' },
  'ja': { title: '予約の準備はできましたか？', cta2: '通訳付きで予約' },
  'zh_cn': { title: '准备预约？', cta2: '带翻译预约' },
  'zh_tw': { title: '準備預約？', cta2: '帶翻譯預約' },
  'th': { title: 'พร้อมจองแล้ว?', cta2: 'จองพร้อมล่าม' },
  'ru': { title: 'Готовы к записи?', cta2: 'Записаться с переводчиком' },
  'mn': { title: 'Захиалга хийхэд бэлэн үү?', cta2: 'Орчуулагчтай захиалах' },
};
```

---

## Mobile Responsive

### Breakpoints
- `sm`: 640px+
- `lg`: 1024px+

### Key Responsive Changes
1. Hero section height: `h-[350px] lg:h-[500px]`
2. Hospital name: `text-xl sm:text-3xl lg:text-4xl`
3. Logo size: `h-14 w-14 sm:h-20 sm:w-20`
4. Padding: `p-4 sm:p-6`
5. Gallery grid: `grid-cols-2 md:grid-cols-3`
6. Sidebar: Full width on mobile, 1/3 on desktop

---

## Related Files

- [page.tsx](../src/app/[locale]/hospitals/[slug]/page.tsx) - Server component
- [HospitalDetailClient.tsx](../src/app/[locale]/hospitals/[slug]/HospitalDetailClient.tsx) - Client component
- [crawl-google-places-hospitals.ts](../scripts/crawl-google-places-hospitals.ts) - Crawler script
- [fix-hospital-slugs.ts](../scripts/fix-hospital-slugs.ts) - Slug fix script

---

## Future Improvements

- [ ] AI Summary 자동 생성 (GPT/Claude)
- [ ] Google Reviews 실시간 연동
- [ ] Nearby Hospitals 섹션
- [ ] Virtual Tour 360도 이미지
- [ ] Doctor profiles 연동
- [ ] Real-time availability calendar
