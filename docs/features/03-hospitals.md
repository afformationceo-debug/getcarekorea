# Hospital System

## Overview

병원 목록 조회, 상세 정보, 검색 및 필터링 기능을 제공합니다. 7개 언어로 다국어 지원됩니다.

## Key Features

- **병원 목록**: 페이지네이션, 필터링, 정렬
- **상세 페이지**: 갤러리, 의사 목록, 시술 정보, 리뷰
- **다국어 지원**: 7개 언어 자동 매핑
- **신뢰 지표**: JCI 인증, CCTV, 여의사 배지
- **실시간 검색**: 이름, 전문 분야, 도시 검색

## File Structure

```
/src/app/[locale]/hospitals
├── page.tsx                    # 병원 목록 페이지
├── HospitalsPageClient.tsx     # 클라이언트 컴포넌트
└── [slug]/page.tsx             # 병원 상세 페이지

/src/app/api/hospitals
├── route.ts                    # GET (목록), POST (생성)
└── [slug]/route.ts             # GET, PUT, DELETE (개별)

/src/components
└── HospitalCard.tsx            # 병원 카드 컴포넌트
```

## API Endpoints

### GET /api/hospitals
병원 목록 조회

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| locale | string | en | 언어 코드 |
| page | number | 1 | 페이지 번호 |
| limit | number | 10 | 페이지당 항목 (max: 50) |
| city | string | - | 도시 필터 |
| specialty | string | - | 전문 분야 필터 |
| language | string | - | 지원 언어 필터 |
| minRating | number | - | 최소 평점 (1-5) |
| featured | boolean | - | 추천 병원만 |
| search | string | - | 검색어 |
| sortBy | string | avg_rating | 정렬 필드 |
| sortOrder | string | desc | 정렬 방향 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "grand-plastic-surgery",
      "name": "Grand Plastic Surgery",
      "city": "Seoul",
      "specialties": ["Rhinoplasty", "Eye Surgery"],
      "languages": ["Korean", "English", "Chinese"],
      "avg_rating": 4.85,
      "review_count": 234,
      "is_featured": true,
      "certifications": ["JCI"],
      "has_cctv": true,
      "has_female_doctor": true
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 50, "hasMore": true }
}
```

### GET /api/hospitals/[slug]
병원 상세 조회

### POST /api/hospitals
병원 생성 (admin, hospital_admin만)

### PUT /api/hospitals/[slug]
병원 정보 수정

### DELETE /api/hospitals/[slug]
병원 삭제 (admin만)

## Database Schema

### hospitals 테이블
```sql
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  -- 다국어 필드
  name_en TEXT NOT NULL,
  name_zh_tw TEXT,
  name_zh_cn TEXT,
  name_ja TEXT,
  name_th TEXT,
  name_mn TEXT,
  name_ru TEXT,
  description_en TEXT,
  description_zh_tw TEXT,
  -- ... (7개 언어)
  logo_url TEXT,
  cover_image_url TEXT,
  gallery TEXT[],
  address TEXT,
  city TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  phone TEXT,
  email TEXT,
  website TEXT,
  specialties TEXT[],
  languages TEXT[],
  certifications TEXT[],
  has_cctv BOOLEAN DEFAULT false,
  has_female_doctor BOOLEAN DEFAULT false,
  operating_hours JSONB,
  avg_rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Hospital Card Features

- 병원 로고/이미지
- 이름 및 도시
- 평점 (별점)
- 리뷰 수
- 전문 분야 태그
- 지원 언어
- 인증 배지 (JCI, CCTV, 여의사)
- 가격대 표시
- "상세 보기" 버튼

## Filtering Options

| Filter | Options |
|--------|---------|
| City | Seoul, Busan, Daegu, etc. |
| Specialty | Plastic Surgery, Dermatology, Dental, etc. |
| Language | English, Chinese, Japanese, etc. |
| Rating | 4.0+, 4.5+, 5.0 |
| Certifications | JCI, KAHP |
| Features | CCTV, Female Doctor |

## Performance

- GIN 인덱스: specialties, languages 배열 필드
- B-tree 인덱스: avg_rating, review_count
- Partial 인덱스: status = 'published'
- 응답 시간 로깅

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial hospital system |
