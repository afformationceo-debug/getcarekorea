# Phase 10: 병원 상세 페이지 개선 & Locale 기반 CTA 시스템

> 완료일: 2026-02-03
> 버전: 1.0

---

## 1. 개요

Phase 10에서는 병원 상세 페이지의 다국어 지원을 강화하고, CTA 시스템을 locale 기반으로 개선했습니다.

### 1.1 주요 목표
- 병원 데이터 JSONB 변환 (name, description, ai_summary)
- Locale 기반 CTA API 시스템
- 병원 상세 페이지 UI/UX 개선
- PhotoCarousel 컴포넌트 블러 배경 옵션 추가
- 리뷰 섹션 번역 키 추가

### 1.2 변경된 파일

```
src/app/[locale]/hospitals/
├── page.tsx                      # 병원 목록 페이지
├── HospitalsPageClient.tsx       # 검색 로직 변경, 카테고리 표시 개선
└── [slug]/
    ├── page.tsx                  # 상세 페이지 (locale 전달)
    └── HospitalDetailClient.tsx  # 전면 개선

src/app/api/
├── cta/route.ts                  # Locale 필수 파라미터
└── hospitals/
    ├── route.ts                  # Locale 기반 응답
    └── [slug]/route.ts           # Locale 기반 응답

src/components/ui/
└── photo-carousel.tsx            # 블러 배경 옵션 추가

src/lib/settings/
└── cta.ts                        # Locale별 캐싱

messages/
├── en.json                       # 리뷰 번역 키 추가
├── ko.json
├── ja.json
├── zh-CN.json
├── zh-TW.json
├── th.json
├── ru.json
└── mn.json

supabase/migrations/
├── 20260203100000_hospitals_jsonb_conversion.sql
└── 20260203100001_hospitals_jsonb_cleanup.sql
```

---

## 2. 병원 데이터 JSONB 변환

### 2.1 변경된 필드

| 필드 | Before | After |
|------|--------|-------|
| `name` | `string` | `JSONB { en: "...", ko: "...", ... }` |
| `description` | `string` | `JSONB { en: "...", ko: "...", ... }` |
| `ai_summary` | `string` | `JSONB { en: "...", ko: "...", ... }` |

### 2.2 API 응답 변경

**Before:**
```json
{
  "name": { "en": "...", "ko": "...", "ja": "..." },
  "description": { "en": "...", "ko": "...", "ja": "..." }
}
```

**After (locale=ko 요청 시):**
```json
{
  "name": "병원 이름",
  "description": "병원 설명"
}
```

### 2.3 Fallback 로직
1. 요청된 locale의 값이 있으면 반환
2. 없으면 영어(en) 값으로 fallback
3. 영어도 없으면 전체 객체 반환

---

## 3. Locale 기반 CTA 시스템

### 3.1 CTA API 변경

**Endpoint:** `GET /api/cta?locale={locale}`

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `locale` | Yes | 언어 코드 (en, ko, ja, etc.) |

**locale 없이 요청 시:**
```json
{ "success": true, "data": null }
```

### 3.2 CTA 버튼 매핑

| 버튼 유형 | 목적지 |
|-----------|--------|
| 예약/견적 (getFreeQuote, bookConsultation, cta1) | `/inquiry` (내부) |
| 통역사/채팅 (bookWithInterpreter, requestInterpreter, cta2) | 외부 CTA 링크 |
| Have Questions 카드 | 외부 CTA 링크 |

### 3.3 외부 CTA 링크
- WhatsApp, Line, Kakao, Telegram 등
- Admin 설정에서 locale별로 관리
- 새 탭에서 열림 (`target="_blank"`)

---

## 4. 병원 상세 페이지 UI 개선

### 4.1 Hero 캐러셀 변경

**Before:**
- 커스텀 캐러셀 (object-cover로 이미지 잘림)
- 그라데이션 오버레이
- 병원 정보 오버레이

**After:**
- PhotoCarousel 컴포넌트 사용
- 블러 배경 옵션 (`objectFit="blur"`)
- 병원 정보 별도 섹션으로 분리

### 4.2 CardHeader 스타일 통일

**Before:**
```jsx
<CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
```

**After:**
```jsx
<CardHeader className="border-b py-3">
```

### 4.3 제거된 요소
- 좋아요 버튼 (Heart)
- 공유 버튼 (Share2)
- 장식용 그라데이션 배경

### 4.4 영업시간 번역

```typescript
const dayTranslations: Record<string, Record<string, string>> = {
  '월요일': { en: 'Monday', ja: '月曜日', ... },
  '화요일': { en: 'Tuesday', ja: '火曜日', ... },
  // ...
};

const hoursTranslations: Record<string, Record<string, string>> = {
  '휴무일': { en: 'Closed', ja: '定休日', ... },
};
```

---

## 5. PhotoCarousel 블러 배경 옵션

### 5.1 새 옵션

```typescript
interface PhotoCarouselProps {
  objectFit?: 'contain' | 'cover' | 'blur';
}
```

### 5.2 블러 배경 구현

```tsx
{objectFit === 'blur' && (
  <Image
    src={photo.image_url}
    className="object-cover blur-xl scale-110 opacity-60"
    aria-hidden="true"
  />
)}
<Image
  src={photo.image_url}
  className={cn(
    objectFit === 'cover' ? 'object-cover' : 'object-contain',
    objectFit === 'blur' && 'relative z-10'
  )}
/>
```

### 5.3 효과
- 이미지가 잘리지 않음 (object-contain)
- 빈 공간에 블러 처리된 이미지가 배경으로 표시
- 인스타그램 스타일의 깔끔한 UI

---

## 6. 번역 키 추가

### 6.1 리뷰 섹션 번역 키

| 키 | 설명 |
|----|------|
| `readRealReviews` | 실제 환자 리뷰 읽기 |
| `viewAllReviews` | Google Maps에서 검증된 리뷰 보기 |
| `lookingForMoreReviews` | 더 많은 환자 경험 찾기 |
| `readReviewsOnGoogle` | Google Maps에서 리뷰 읽기 |
| `readAllReviews` | 모든 리뷰 보기 |

### 6.2 지원 언어 (8개)

| 코드 | 언어 |
|------|------|
| en | English |
| ko | 한국어 |
| ja | 日本語 |
| zh-TW | 繁體中文 |
| zh-CN | 简体中文 |
| th | ภาษาไทย |
| mn | Монгол |
| ru | Русский |

---

## 7. 병원 목록 페이지 개선

### 7.1 검색 로직 변경

**Before:** 입력할 때마다 실시간 검색
**After:** 검색 버튼 클릭 또는 Enter 키로 검색

```typescript
const [searchInput, setSearchInput] = useState('');
const [appliedSearch, setAppliedSearch] = useState('');

const handleSearch = () => setAppliedSearch(searchInput);
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') handleSearch();
};
```

### 7.2 카테고리 0건 표시

- 병원이 없는 카테고리도 표시
- "No hospitals in this category yet" 메시지

### 7.3 전문 분야 번역

```typescript
const knownSpecialtyKeys = [
  'plastic-surgery', 'dermatology', 'dental', 'ophthalmology',
  'hair-transplant', 'health-checkup', 'fertility', 'all'
];

const getSpecialtyName = (specialty: string) => {
  const key = specialty.toLowerCase().replace(/\s+/g, '-');
  if (knownSpecialtyKeys.includes(key)) {
    return t(`listing.specialties.${key}`);
  }
  return specialty; // fallback to original
};
```

---

## 8. 데이터베이스 마이그레이션

### 8.1 마이그레이션 파일

```sql
-- 20260203100000_hospitals_jsonb_conversion.sql
-- name, description, ai_summary를 JSONB로 변환
-- 기존 텍스트 데이터를 { en: "...", ko: "..." } 형태로 변환

-- 20260203100001_hospitals_jsonb_cleanup.sql
-- 임시 컬럼 정리 및 인덱스 최적화
```

### 8.2 실행 방법

```bash
npx supabase db push
```

---

## 9. 향후 개선 사항

### 9.1 주소 다국어 지원
- 현재: 단일 문자열 (한글)
- 향후: JSONB로 변환하여 locale별 주소 지원
- 대안: Google Maps Geocoding API 실시간 번역

### 9.2 리뷰 내용 번역
- 현재: 원본 언어로 표시
- 향후: AI 기반 자동 번역 또는 번역 버튼 추가

---

## 10. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-03 | 초기 구현 - JSONB 변환, CTA 시스템, UI 개선 |

---

## 11. 관련 문서

- [PHASE9_IMPLEMENTATION.md](./PHASE9_IMPLEMENTATION.md) - 이전 단계
- [UI_UPDATE_CHANGELOG.md](./UI_UPDATE_CHANGELOG.md) - UI 변경 이력
- [HOSPITAL_PAGE_STRUCTURE.md](./HOSPITAL_PAGE_STRUCTURE.md) - 병원 페이지 구조
