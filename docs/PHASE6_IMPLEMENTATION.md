# Phase 6: 이미지 자동 생성 (나노바나나) - 구현 문서

> 완료일: 2026-01-22
> 버전: 1.0

---

## 1. 개요

Phase 6에서는 나노바나나 API를 활용한 이미지 자동 생성 시스템을 구현했습니다.

### 1.1 주요 목표
- 나노바나나 API 클라이언트 구현
- 콘텐츠 기반 이미지 프롬프트 자동 생성
- 이미지 생성 파이프라인 (콘텐츠 → 프롬프트 → 이미지 → 저장)
- Supabase Storage 연동
- 블로그 포스트 cover_image_url 자동 설정

### 1.2 카테고리별 이미지 스타일

| 카테고리 | 스타일 | 색상 팔레트 |
|---------|--------|------------|
| plastic-surgery | 깨끗한 클리닉, 전문 의료진, 모던 인테리어 | 화이트, 소프트 블루, 로즈 골드 |
| dermatology | K-beauty 느낌, 밝고 청결한 이미지 | 화이트, 소프트 핑크, 민트 그린 |
| dental | 첨단 장비, 밝은 미소 | 화이트, 라이트 블루, 실버 |
| health-checkup | 현대식 병원, 검진 장비 | 화이트, 네이비 블루, 실버 |
| general | 서울 스카이라인, 현대 병원 | 블루 스카이, 화이트 |

---

## 2. 구현된 파일 구조

```
src/lib/nanobanana/
├── client.ts              # 나노바나나 API 클라이언트
├── prompt-generator.ts    # 이미지 프롬프트 자동 생성
├── image-pipeline.ts      # 이미지 생성 파이프라인
└── index.ts               # 모듈 exports

src/app/api/images/
├── generate/
│   └── route.ts           # 이미지 생성 API
└── [id]/
    └── route.ts           # 개별 이미지 관리 API

supabase/migrations/
└── 006_image_generations.sql  # DB 마이그레이션
```

---

## 3. 나노바나나 API 클라이언트

### 3.1 파일: `client.ts`

#### 주요 클래스

```typescript
class NanobananaClient {
  // 이미지 생성 요청
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>

  // 생성 상태 확인
  getGenerationStatus(generationId: string): Promise<GenerationStatus>

  // 완료까지 대기 (폴링)
  waitForCompletion(generationId, options): Promise<GenerationStatus>

  // 이미지 다운로드
  downloadImage(imageUrl: string): Promise<Buffer>
}
```

#### 이미지 생성 요청

```typescript
interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;      // 기본 1200
  height?: number;     // 기본 630 (OG Image 비율)
  style?: ImageStyle;  // 'photorealistic' | 'digital-art' | 'cinematic' 등
  numImages?: number;  // 기본 1
}
```

### 3.2 환경 변수

```bash
NANOBANANA_API_KEY=your-nanobanana-api-key
```

---

## 4. 이미지 프롬프트 생성

### 4.1 파일: `prompt-generator.ts`

#### 주요 함수

```typescript
// LLM 기반 프롬프트 생성 (Claude)
generateImagePrompt(options): Promise<GeneratedPrompt>

// 간단 프롬프트 생성 (LLM 없이)
generateSimplePrompt(options): GeneratedPrompt

// 프롬프트 품질 향상
enhancePrompt(basePrompt: string): string

// OG 이미지용 프롬프트 조정
adjustForOGImage(prompt: string): string
```

#### 생성된 프롬프트 구조

```typescript
interface GeneratedPrompt {
  prompt: string;           // 이미지 생성 프롬프트 (100-150 단어)
  negativePrompt: string;   // 제외할 요소
  style: string;            // photorealistic, digital-art 등
  altText: string;          // SEO용 alt 텍스트 (125자 이내)
  suggestedFileName: string; // kebab-case 파일명
}
```

### 4.2 카테고리별 스타일 가이드

```typescript
const CATEGORY_STYLES = {
  'plastic-surgery': {
    basePrompt: 'Modern luxury medical clinic interior...',
    elements: ['clean white walls', 'soft ambient lighting', ...],
    atmosphere: 'calm, professional, luxurious, trustworthy',
    colorPalette: 'white, soft blue, rose gold accents',
    avoidElements: ['surgery in progress', 'blood', ...],
  },
  // ... 다른 카테고리
};
```

### 4.3 로케일별 조정

| 로케일 | 강조점 | 문화적 요소 |
|--------|--------|------------|
| en | 국제 표준, JCI 인증 | 한국-서양 융합 |
| zh-TW | 안전, 명성, 럭셔리 | 우아, 프리미엄 |
| zh-CN | 가치, 기술, 효율성 | 모던, 하이테크 |
| ja | 정밀, 세심함, 청결 | 미니멀, 꼼꼼함 |
| th | K-뷰티 트렌드, 한류 | 트렌디, 패션 |

---

## 5. 이미지 파이프라인

### 5.1 파일: `image-pipeline.ts`

#### 주요 함수

```typescript
// 단일 포스트 이미지 생성
runImagePipeline(supabase, options): Promise<ImagePipelineResult>

// 배치 이미지 생성
runBatchImagePipeline(supabase, blogPostIds, options): Promise<BatchImageResult>

// 이미지 필요한 포스트 조회
getPostsNeedingImages(supabase, options): Promise<{id, title}[]>

// 이미지 생성 상태 조회
getImageGenerationStatus(supabase, blogPostId): Promise<...>

// 저장된 이미지 삭제
deleteStoredImage(supabase, blogPostId): Promise<boolean>
```

### 5.2 파이프라인 플로우

```
1. generateImagePrompt() - LLM으로 프롬프트 생성
       ↓
2. image_generations 테이블에 기록 생성 (status: pending)
       ↓
3. client.generateImage() - 나노바나나 API 호출
       ↓
4. 상태 업데이트 (status: generating)
       ↓
5. client.waitForCompletion() - 완료 대기 (폴링)
       ↓
6. client.downloadImage() - 이미지 다운로드
       ↓
7. uploadToStorage() - Supabase Storage 업로드
       ↓
8. blog_posts 업데이트 (cover_image_url, cover_image_alt)
       ↓
9. image_generations 완료 기록
```

---

## 6. API 명세

### 6.1 GET /api/images/generate

이미지 생성이 필요한 포스트 목록 조회

**Query Parameters:**
- `status`: 포스트 상태 필터 (기본 'published')
- `limit`: 최대 개수 (기본 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "postsNeedingImages": [
      { "id": "uuid", "title": "Korean Rhinoplasty Cost Guide" }
    ],
    "totalCount": 15,
    "recentGenerations": [...]
  }
}
```

### 6.2 POST /api/images/generate

이미지 생성 요청

**Request (단일):**
```json
{
  "blogPostId": "uuid",
  "useSimplePrompt": false
}
```

**Request (배치):**
```json
{
  "blogPostIds": ["uuid1", "uuid2", "uuid3"],
  "useSimplePrompt": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.../blog-images/...",
    "generationId": "gen_xxx",
    "timeMs": 45000
  }
}
```

### 6.3 GET /api/images/[id]

특정 포스트의 이미지 상태 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "title": "...",
      "coverImageUrl": "https://...",
      "coverImageAlt": "..."
    },
    "hasImage": true,
    "latestGeneration": {
      "status": "completed",
      "imageUrl": "...",
      "createdAt": "..."
    },
    "history": [...]
  }
}
```

### 6.4 PUT /api/images/[id]

이미지 재생성

### 6.5 DELETE /api/images/[id]

이미지 삭제

---

## 7. DB 스키마

### 7.1 image_generations

```sql
CREATE TABLE image_generations (
    id UUID PRIMARY KEY,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id),

    -- 프롬프트
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- 결과
    image_url TEXT,
    thumbnail_url TEXT,

    -- 메타
    model TEXT DEFAULT 'nanobanana',
    style TEXT DEFAULT 'photorealistic',
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 630,

    -- 상태
    status TEXT NOT NULL, -- 'pending', 'generating', 'completed', 'failed'
    generation_time_ms INTEGER,
    error_message TEXT,

    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### 7.2 blog_posts 추가 컬럼

```sql
-- cover_image_alt 컬럼 추가
ALTER TABLE blog_posts ADD COLUMN cover_image_alt TEXT;
```

---

## 8. Supabase Storage 설정

### 8.1 버킷 생성 (수동)

Supabase 대시보드에서:
1. Storage → New Bucket → "blog-images"
2. Public bucket 설정
3. RLS 정책 설정

### 8.2 RLS 정책

```sql
-- 관리자만 업로드 가능
CREATE POLICY blog_images_admin_upload ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'blog-images' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 모든 사용자 읽기 가능 (퍼블릭)
CREATE POLICY blog_images_public_read ON storage.objects
    FOR SELECT
    USING (bucket_id = 'blog-images');
```

---

## 9. 사용 방법

### 9.1 단일 이미지 생성

```typescript
import { runImagePipeline } from '@/lib/nanobanana';

const result = await runImagePipeline(supabase, {
  blogPostId: 'uuid',
  title: 'Korean Rhinoplasty Cost Guide 2026',
  excerpt: 'Complete guide to rhinoplasty costs in Korea...',
  category: 'plastic-surgery',
  locale: 'en',
});

console.log(result.imageUrl); // https://storage.../...
```

### 9.2 배치 이미지 생성

```typescript
import { runBatchImagePipeline } from '@/lib/nanobanana';

const result = await runBatchImagePipeline(
  supabase,
  ['uuid1', 'uuid2', 'uuid3'],
  {
    useSimplePrompt: false,
    concurrency: 2,
    onProgress: (done, total) => console.log(`${done}/${total}`),
  }
);

console.log(`Success: ${result.successful}/${result.total}`);
```

### 9.3 API 호출

```bash
# 단일 생성
curl -X POST /api/images/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"blogPostId": "uuid"}'

# 배치 생성
curl -X POST /api/images/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"blogPostIds": ["uuid1", "uuid2"]}'

# 이미지 재생성
curl -X PUT /api/images/{blogPostId} \
  -H "Authorization: Bearer {token}"
```

---

## 10. 회피 요소 (Negative Prompts)

### 10.1 공통 회피 요소

- blurry, low quality, distorted
- text, watermark, logo, signature
- cartoon, anime, illustration

### 10.2 카테고리별 회피 요소

| 카테고리 | 회피 요소 |
|---------|----------|
| plastic-surgery | surgery in progress, blood, patient faces |
| dermatology | skin conditions, injection needles |
| dental | dental procedures, open mouths, drill |
| health-checkup | patients in gowns, worried expressions |

---

## 11. 향후 작업

### 11.1 Phase 7 연동

- 이미지 생성 완료 시 자동 발행 트리거
- 이미지 없는 포스트 발행 블록

### 11.2 이미지 최적화

- 썸네일 자동 생성
- WebP 변환
- CDN 캐싱

---

## 12. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-22 | 초기 구현 - API 클라이언트, 프롬프트 생성, 파이프라인, Storage 연동 |

---

## 13. 관련 문서

- [PHASE5_IMPLEMENTATION.md](./PHASE5_IMPLEMENTATION.md) - GSC 연동
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - 전체 로드맵
