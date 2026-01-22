# Content Generation System

## Overview

GetCareKorea의 AI 기반 콘텐츠 생성 시스템입니다. **Google E-E-A-T 프레임워크**와 **AEO (Answer Engine Optimization)**에 최적화된 의료 관광 콘텐츠를 자동으로 생성하고, 7개 언어로 번역하여 블로그에 게시합니다.

## Key Features

- **AI 콘텐츠 생성**: Claude AI를 사용하여 E-E-A-T 및 AEO 최적화된 기사 자동 생성
- **품질 점수 시스템**: SEO(20%) + AEO(25%) + E-E-A-T(25%) + 가독성(15%) + 완성도(15%) 기반 평가
- **다국어 지원**: 7개 언어(EN, ZH-TW, ZH-CN, JA, TH, MN, RU)로 문화적 적응 번역
- **카테고리별 전문 프롬프트**: 성형외과, 피부과, 치과, 건강검진별 맞춤 프롬프트
- **Featured Snippet 최적화**: Quick Answer, FAQ Schema, 비교 테이블 자동 생성
- **미리보기 기능**: 저장 전 콘텐츠 미리보기 및 수정 가능
- **관리자 대시보드**: 키워드 관리 및 콘텐츠 생성 시뮬레이션

## Technical Stack

- **LLM**: Anthropic Claude (claude-sonnet-4-20250514)
- **Prompt Version**: 2.0-eeat-aeo
- **Framework**: Next.js 15 API Routes
- **Database**: Supabase (PostgreSQL)
- **UI**: React + shadcn/ui

## File Structure

```
/src
├── /lib
│   └── /content
│       └── generator.ts          # AI 콘텐츠 생성 로직
├── /app
│   ├── /api
│   │   ├── /keywords
│   │   │   ├── route.ts          # 키워드 CRUD API
│   │   │   └── /[id]/route.ts    # 개별 키워드 API
│   │   └── /content
│   │       └── /generate
│   │           └── route.ts      # 콘텐츠 생성 API
│   └── /[locale]
│       └── /admin
│           └── /keywords
│               └── page.tsx      # 키워드 관리 UI
└── /components
    └── /ui
        ├── progress.tsx          # 진행률 컴포넌트
        └── switch.tsx            # 토글 스위치 컴포넌트
```

## API Endpoints

### Keywords API

#### GET /api/keywords
키워드 목록 조회

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 50, 최대: 100)
- `status`: 상태 필터 (pending, generating, generated, published)
- `category`: 카테고리 필터
- `search`: 검색어

**Response:**
```json
{
  "success": true,
  "data": {
    "keywords": [...],
    "categories": ["plastic-surgery", "dental", ...]
  },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "hasMore": true
  }
}
```

#### POST /api/keywords
새 키워드 생성

**Request Body:**
```json
{
  "keyword": "best rhinoplasty korea",
  "category": "plastic-surgery",
  "locale": "en",
  "search_volume": 12000,
  "competition": "0.65",
  "priority": 1
}
```

#### PUT /api/keywords/[id]
키워드 수정

#### DELETE /api/keywords/[id]
키워드 삭제 (생성된 콘텐츠가 없는 경우만)

### Content Generation API

#### POST /api/content/generate
키워드 기반 콘텐츠 생성

**Request Body:**
```json
{
  "keyword_id": "uuid",
  "translate_all": true,
  "save_to_db": false,
  "preview_only": true,
  "regenerate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preview": {
      "primary": {
        "locale": "en",
        "content": {
          "title": "Best Rhinoplasty in Korea...",
          "excerpt": "...",
          "content": "...",
          "metaTitle": "...",
          "metaDescription": "...",
          "tags": ["rhinoplasty", "korea"],
          "faq": [
            { "question": "How much does rhinoplasty cost in Korea?", "answer": "..." },
            { "question": "...", "answer": "..." }
          ]
        },
        "qualityScore": {
          "overall": 85,
          "seo": 88,
          "aeo": 82,
          "eeat": 90,
          "readability": 80,
          "completeness": 85,
          "details": {
            "hasQuickAnswer": true,
            "hasFAQSection": true,
            "hasComparisonTable": true,
            "hasExpertCredentials": true,
            "hasStatistics": true,
            "hasDisclaimer": true,
            "hasPriceRanges": true
          }
        }
      },
      "translations": [...]
    },
    "metadata": {
      "model": "claude-sonnet-4-20250514",
      "promptVersion": "2.0-eeat-aeo",
      "inputTokens": 500,
      "outputTokens": 2000,
      "totalTimeMs": 15000
    },
    "blogPost": null
  }
}
```

## Data Models

### content_keywords
```sql
CREATE TABLE content_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  locale TEXT NOT NULL DEFAULT 'en',
  search_volume INTEGER,
  competition TEXT,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  blog_post_id UUID REFERENCES blog_posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### blog_posts
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  -- Multi-language content fields
  title_en TEXT NOT NULL,
  title_zh_tw TEXT,
  title_zh_cn TEXT,
  title_ja TEXT,
  title_th TEXT,
  title_mn TEXT,
  title_ru TEXT,
  -- ... similar for excerpt, content, meta_title, meta_description
  tags TEXT[],
  category TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  generation_metadata JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Quality Scoring (v2.0)

콘텐츠 품질은 **다섯 가지 기준**으로 평가되며, Google의 2024+ 알고리즘 우선순위를 반영합니다:

### SEO Score (20% 가중치)
- 제목에 키워드 포함: 25점
- 제목 길이 적정 (50-60자): 15점
- 메타 설명에 키워드 포함: 25점
- 메타 설명 길이 적정 (150-160자): 15점
- 본문에 키워드 적절한 밀도: 20점

### AEO Score (25% 가중치) - NEW
Featured Snippet 및 AI Overview 노출을 위한 최적화:
- Quick Answer 포함 (40-60단어): 25점
- FAQ 섹션 포함 (5-7개 질문): 25점
- 비교 테이블 포함: 20점
- 번호 목록 포함: 15점
- 정의 박스 포함: 15점

### E-E-A-T Score (25% 가중치) - NEW
Google의 YMYL(Your Money Your Life) 의료 콘텐츠 기준:
- 전문가 자격 언급 (board-certified, years of experience): 20점
- 통계 데이터 포함 (숫자, 퍼센트, 연구 결과): 25점
- 의료 면책조항 포함: 20점
- 가격 범위 명시 (투명성): 20점
- 출처/레퍼런스 언급: 15점

### Readability Score (15% 가중치)
- H2/H3 제목 구조: 40점
- 충분한 본문 내용 (1500+ 단어): 30점
- 단락 구성: 30점

### Completeness Score (15% 가중치)
- 제목 존재: 20점
- 메타 설명 존재: 20점
- 본문 존재: 20점
- 최소 길이 충족: 20점
- CTA 포함 (로케일별 메신저): 20점

**Overall Score** = (SEO × 0.2) + (AEO × 0.25) + (E-E-A-T × 0.25) + (Readability × 0.15) + (Completeness × 0.15)

## Category-Specific Prompts (v2.0)

각 의료 카테고리별로 전문화된 프롬프트를 사용합니다:

### plastic-surgery
- 한국 성형외과 전문의 통계 (6년+ 수련, 세계 최고 밀도)
- 강남 메디컬 클러스터 정보 (3km 반경 500+ 클리닉)
- 가격 벤치마크 (코성형 $2,500-$8,000, 눈성형 $1,500-$4,000 등)

### dermatology
- K-뷰티 트렌드 연결
- 레이저 기술 (Pico, HIFU, RF 등) 상세 정보
- 스킨케어 프로토콜 및 유지 관리

### dental
- 임플란트 비용 비교 (한국 vs 다른 국가)
- 디지털 덴탈 기술 (3D 스캔, CAD/CAM)
- 세라믹/지르코니아 옵션

### health-checkup
- 검진 패키지 구성 상세
- 한국 의료 시스템 강점
- 같은 날 결과 제공 프로세스

## Locale-Specific Cultural Adaptation

| Locale | CTA Platform | 문화적 톤 |
|--------|-------------|----------|
| en | WhatsApp | 직접적, 데이터 중심, 투명한 가격 |
| zh-TW | LINE | 한류 연결, 자연스러운 결과, 친근한 톤 |
| zh-CN | WeChat | 프리미엄 포지셔닝, VIP 서비스, 럭셔리 |
| ja | LINE | 정밀함, 안전성, 섬세한 기술, 격식있는 경어 |
| th | LINE | 가성비, 친근한 톤, 커뮤니티 추천 |
| mn | WhatsApp | 접근성, 커뮤니티 추천, 실용적 |
| ru | Telegram | 의료 기술력, 품질 보증, 전문성 |

## Usage Flow

1. **키워드 추가**
   - 관리자가 `/admin/keywords`에서 새 키워드 추가
   - CSV 파일로 대량 가져오기 가능
   - 카테고리 지정 (plastic-surgery, dermatology, dental, health-checkup)

2. **콘텐츠 생성**
   - 키워드 선택 → "Generate Content" 클릭
   - AI가 E-E-A-T + AEO 최적화된 기사 생성
   - 미리보기에서 5가지 품질 점수 확인

3. **번역 (선택사항)**
   - "Translate to all languages" 옵션 활성화
   - 7개 언어로 문화적으로 적응된 번역 생성
   - 로케일별 CTA 자동 매핑

4. **저장 및 게시**
   - "Save to Database" 클릭으로 저장
   - 관리자가 검토 후 게시 상태 변경

## Security Considerations

- 모든 API는 인증 필요 (Supabase Auth)
- admin 역할만 콘텐츠 생성/수정 가능
- API 키는 서버 사이드에서만 사용
- 에러 메시지에 민감정보 노출 방지

## Performance Optimization

- 콘텐츠 생성은 비동기로 처리
- 미리보기 모드로 불필요한 DB 쓰기 방지
- 번역은 병렬로 처리하여 속도 향상
- 생성 메타데이터 기록으로 비용 추적 가능

## Testing

```bash
# 키워드 API 테스트
curl -X POST http://localhost:3000/api/keywords \
  -H "Content-Type: application/json" \
  -d '{"keyword": "test keyword", "category": "general"}'

# 콘텐츠 생성 테스트
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{"keyword_id": "uuid", "preview_only": true}'
```

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 2.0.0 | E-E-A-T + AEO 최적화 프롬프트 업그레이드, 품질 점수 시스템 개편 |
| 2026-01-21 | 1.0.0 | Initial content generation system |

## v2.0 Major Changes

### 프롬프트 업그레이드
- Google E-E-A-T 프레임워크 완전 적용
- AEO (Answer Engine Optimization) 최적화
- 카테고리별 전문화 프롬프트
- 로케일별 문화적 적응 지침

### 품질 점수 개편
- 기존: SEO + Readability + Completeness (균등 배분)
- 변경: SEO(20%) + AEO(25%) + E-E-A-T(25%) + Readability(15%) + Completeness(15%)

### 새로운 콘텐츠 구조
- Quick Answer (40-60단어) - Featured Snippet 타겟
- FAQ Section (5-7개) - FAQ Schema 지원
- Comparison Table - Google AI Overview 타겟
- Medical Disclaimer - YMYL 컴플라이언스

## Future Improvements

- [ ] RAG 시스템 연동으로 맥락 강화
- [ ] 이미지 자동 생성/선택 기능
- [ ] 콘텐츠 일정 예약 게시
- [ ] A/B 테스트용 여러 버전 생성
- [ ] 기존 콘텐츠 성과 기반 프롬프트 개선
- [ ] Google Search Console 연동으로 실시간 성과 추적
- [ ] Featured Snippet 획득률 모니터링
