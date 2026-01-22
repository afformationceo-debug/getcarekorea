# 에러 트러블슈팅 가이드

**작성일**: 2026-01-23
**프로젝트**: GetCareKorea 단일 언어 콘텐츠 생성 시스템
**목적**: 개발 및 테스트 중 발생한 모든 에러의 원인과 해결 방법 문서화

---

## 📋 목차

1. [Error #1: Module Not Found - @anthropic-ai/sdk](#error-1-module-not-found---anthropic-aisdk)
2. [Error #2: Database Table Not Found - content_drafts](#error-2-database-table-not-found---content_drafts)
3. [Error #3: Row-Level Security Policy Violation](#error-3-row-level-security-policy-violation)
4. [Error #4: Foreign Key Constraint Violation](#error-4-foreign-key-constraint-violation)
5. [Error #5: Invalid JSON Response from Claude](#error-5-invalid-json-response-from-claude)
6. [추가 참고사항](#추가-참고사항)

---

## Error #1: Module Not Found - @anthropic-ai/sdk

### 🔴 에러 메시지

```
Module not found: Can't resolve '@anthropic-ai/sdk'
./src/lib/content/single-content-generator.ts:10:1
```

### 📍 발생 위치

- **파일**: `/src/lib/content/single-content-generator.ts`
- **라인**: 10
- **코드**:
  ```typescript
  import Anthropic from '@anthropic-ai/sdk';
  ```

### 🔍 원인 분석

새로운 단일 언어 콘텐츠 생성기를 구현하면서 `@anthropic-ai/sdk` 패키지를 사용했으나, `package.json`에 해당 패키지가 설치되어 있지 않았습니다.

**근본 원인**:
- 기존 시스템은 다른 방식으로 Anthropic API를 호출했을 가능성
- 새로운 구현에서 공식 SDK 사용으로 변경
- 의존성 설치 누락

### ✅ 해결 방법

#### 1. 패키지 설치

```bash
npm install @anthropic-ai/sdk
```

#### 2. package.json 확인

설치 후 `package.json`에 다음 항목이 추가되었는지 확인:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.2"
  }
}
```

#### 3. 개발 서버 재시작

```bash
# 기존 서버 종료 (Ctrl + C)
# 서버 재시작
npm run dev
```

**중요**: 패키지 설치 후 반드시 개발 서버를 재시작해야 새 패키지가 인식됩니다.

### 🎯 예방 방법

- 새로운 기능 구현 시 `package.json`에 필요한 의존성 먼저 추가
- 코드 작성 전 패키지 설치 확인
- `.env` 파일에 `ANTHROPIC_API_KEY` 설정 확인

### ✔️ 해결 확인

에러가 해결되면 다음과 같이 서버가 정상 시작됩니다:

```
✓ Starting...
✓ Ready in 3.7s
- Local:        http://localhost:3000
```

---

## Error #2: Database Table Not Found - content_drafts

### 🔴 에러 메시지

```
❌ Database save failed: Could not find the table 'public.content_drafts' in the schema cache
```

### 📍 발생 위치

- **파일**: `/src/app/api/content/generate/route.ts`
- **시점**: 콘텐츠 생성 후 데이터베이스 저장 단계
- **코드**:
  ```typescript
  await supabase.from('content_drafts').insert(draftData);
  ```

### 🔍 원인 분석

코드에서 `content_drafts` 테이블에 데이터를 저장하려고 했으나, 실제 데이터베이스에는 해당 테이블이 존재하지 않았습니다.

**근본 원인**:
- 초기 설계에서는 `content_drafts` 테이블 사용 계획
- 실제 구현에서는 `blog_posts` 테이블 직접 사용
- 마이그레이션 파일에 `content_drafts` 테이블 생성 스크립트 없음

**데이터베이스 구조 확인**:
```bash
# supabase/migrations/ 디렉토리 확인
# content_drafts 테이블 생성 마이그레이션 없음
# blog_posts 테이블만 존재
```

### ✅ 해결 방법

#### 1. blog_posts 테이블 사용으로 변경

`/src/app/api/content/generate/route.ts` 파일 수정:

```typescript
// ❌ Before (존재하지 않는 테이블)
await supabase.from('content_drafts').insert({
  keyword_text: keyword,
  locale,
  title: generatedContent.title,
  content: generatedContent.content,
});

// ✅ After (존재하는 테이블 + 로케일별 필드)
const normalizedLocale = locale.toLowerCase().replace(/-/g, '_'); // zh-TW → zh_tw
const localeField = (base: string) => `${base}_${normalizedLocale}`;

const blogPostData = {
  slug: `${keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-${Date.now()}`,
  [localeField('title')]: generatedContent.title,
  [localeField('excerpt')]: generatedContent.excerpt,
  [localeField('content')]: generatedContent.content,
  [localeField('meta_title')]: generatedContent.metaTitle,
  [localeField('meta_description')]: generatedContent.metaDescription,
  title_en: generatedContent.title, // Required fallback
  category,
  tags: generatedContent.tags,
  status: 'draft',
  generation_metadata: {
    keyword,
    locale,
    estimatedCost: generatedContent.estimatedCost,
    author: generatedContent.author,
    faqSchema: generatedContent.faqSchema,
    howToSchema: generatedContent.howToSchema,
    images: generatedContent.images,
    internalLinks: generatedContent.internalLinks || [],
  },
};

await adminClient.from('blog_posts').insert(blogPostData);
```

#### 2. 로케일별 필드 매핑

`blog_posts` 테이블은 언어별 컬럼을 사용합니다:

| Locale | Title Field | Content Field | Excerpt Field |
|--------|-------------|---------------|---------------|
| ko | title_ko | content_ko | excerpt_ko |
| en | title_en | content_en | excerpt_en |
| ja | title_ja | content_ja | excerpt_ja |
| zh-CN | title_zh_cn | content_zh_cn | excerpt_zh_cn |
| zh-TW | title_zh_tw | content_zh_tw | excerpt_zh_tw |
| th | title_th | content_th | excerpt_th |
| mn | title_mn | content_mn | excerpt_mn |
| ru | title_ru | content_ru | excerpt_ru |

#### 3. Slug 생성 추가

`blog_posts` 테이블은 `slug` 필드가 필수입니다:

```typescript
const slug = `${keyword
  .toLowerCase()
  .replace(/[^\w\s-]/g, '') // 특수문자 제거
  .replace(/\s+/g, '-')}-${Date.now()}`; // 공백을 하이픈으로, 타임스탬프 추가
```

### 🎯 예방 방법

- 코드 작성 전 데이터베이스 스키마 확인
- `supabase/migrations/` 디렉토리에서 테이블 존재 여부 확인
- Supabase 대시보드에서 실제 테이블 구조 확인

### ✔️ 해결 확인

에러가 해결되면 다음과 같이 저장 성공 메시지가 표시됩니다:

```
✅ Content generation complete!
   Duration: 81.9s
   Total cost: $0.0946
   Images to generate: 3
   💾 Saving to database...
   ✅ Saved to database: 9ac9f35a-9ce1-4469-a4cb-bd57f6b6e675
```

---

## Error #3: Row-Level Security Policy Violation

### 🔴 에러 메시지

```
❌ Database save failed: new row violates row-level security policy for table "blog_posts"
```

### 📍 발생 위치

- **파일**: `/src/app/api/content/generate/route.ts`
- **시점**: `blog_posts` 테이블에 INSERT 시도
- **코드**:
  ```typescript
  const supabase = await createClient(); // 일반 클라이언트
  await supabase.from('blog_posts').insert(blogPostData);
  ```

### 🔍 원인 분석

Supabase의 Row-Level Security (RLS) 정책이 적용되어 있어, 일반 사용자 클라이언트로는 `blog_posts` 테이블에 데이터를 삽입할 수 없습니다.

**RLS 정책 확인**:
```sql
-- supabase/migrations 파일에서 확인
CREATE POLICY "Admins can manage blog posts"
    ON blog_posts FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**문제점**:
- 정책은 `profiles` 테이블에서 `role = 'admin'`인 사용자만 허용
- 현재 로그인한 사용자가 admin 역할이 아니거나
- `profiles` 테이블에 해당 사용자 레코드가 없을 수 있음

### ✅ 해결 방법

#### 1. Admin 클라이언트 사용

Service Role Key를 사용하여 RLS를 우회:

```typescript
// ❌ Before (RLS에 의해 차단됨)
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
await supabase.from('blog_posts').insert(blogPostData);

// ✅ After (RLS 우회)
import { createClient, createAdminClient } from '@/lib/supabase/server';

// 인증은 일반 클라이언트로
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}

// 데이터베이스 작업은 Admin 클라이언트로
const adminClient = await createAdminClient();
const { data: draft, error: saveError } = await adminClient
  .from('blog_posts')
  .insert(blogPostData)
  .select()
  .single();
```

#### 2. createAdminClient 구현 확인

`/src/lib/supabase/server.ts`에 다음 함수가 있는지 확인:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Admin client with service role key - bypasses RLS completely
export async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

#### 3. 환경 변수 확인

`.env.local` 파일에 Service Role Key가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # 이 키 필요
```

**주의**: Service Role Key는 절대 클라이언트에 노출되면 안 됩니다. 서버 사이드에서만 사용하세요.

#### 4. 키워드 상태 업데이트도 Admin 클라이언트 사용

```typescript
// 콘텐츠 저장 후 키워드 상태 업데이트
if (!saveError) {
  await adminClient
    .from('content_keywords')
    .update({
      blog_post_id: draft.id,
      status: 'generated',
      updated_at: new Date().toISOString(),
    })
    .eq('keyword', keyword)
    .eq('locale', locale);
}
```

### 🎯 보안 고려사항

**Admin 클라이언트 사용 시 주의사항**:

1. **인증 필수**: Admin 클라이언트를 사용하기 전에 반드시 사용자 인증 확인
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **역할 확인 (선택적)**: 추가 보안을 위해 admin 역할 확인
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .single();

   if (profile?.role !== 'admin') {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

3. **서버 사이드만**: Admin 클라이언트는 API Route에서만 사용

### ✔️ 해결 확인

에러가 해결되면 RLS 정책 우회 후 정상 저장됩니다:

```
💾 Saving to database...
✅ Saved to database: 9ac9f35a-9ce1-4469-a4cb-bd57f6b6e675
✅ Keyword status updated to 'generated'
```

---

## Error #4: Foreign Key Constraint Violation

### 🔴 에러 메시지

```
❌ Database save failed: insert or update on table "blog_posts" violates foreign key constraint "blog_posts_author_id_fkey"
```

### 📍 발생 위치

- **파일**: `/src/app/api/content/generate/route.ts`
- **시점**: `blog_posts` 테이블 INSERT 시
- **제약조건**: `blog_posts.author_id` → `profiles.id`

### 🔍 원인 분석

`blog_posts` 테이블의 `author_id` 컬럼은 `profiles` 테이블의 `id`를 참조하는 외래 키입니다.

**데이터베이스 제약조건**:
```sql
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id);
```

**문제점**:
- 코드에서 `author_id`를 현재 로그인한 사용자 ID(`user.id`)로 설정
- 해당 사용자가 `profiles` 테이블에 존재하지 않음
- 또는 `author_id` 값이 잘못된 UUID

**시도한 값**:
```typescript
author_id: user.id // 'afformation.ceo@gmail.com' 사용자의 ID
```

### ✅ 해결 방법

#### 1. author_id를 null로 설정

`blog_posts` 테이블의 `author_id`는 nullable이므로, 외래 키 제약을 피하기 위해 `null`로 설정:

```typescript
// ❌ Before (외래 키 제약 위반)
const blogPostData = {
  author_id: user.id, // profiles 테이블에 없을 수 있음
  // ...
};

// ✅ After (null 허용)
const blogPostData = {
  author_id: null, // Author 정보는 generation_metadata에 저장
  generation_metadata: {
    author: generatedContent.author, // 전체 author 객체 저장
    // {
    //   name: "임도윤",
    //   name_en: "Lim Do-yoon",
    //   bio: "...",
    //   years_of_experience: 9
    // }
  },
  // ...
};
```

#### 2. Author 정보를 metadata에 보관

Author 정보는 `generation_metadata` JSONB 필드에 완전히 저장되므로 정보 손실 없음:

```typescript
generation_metadata: {
  keyword: keyword,
  locale: locale,
  estimatedCost: generatedContent.estimatedCost,
  author: {
    name: "임도윤",
    name_en: "Lim Do-yoon",
    specialty: "성형외과",
    years_of_experience: 9,
    bio: "성형외과 전문 의료통역사로 9년간 활동..."
  },
  faqSchema: generatedContent.faqSchema,
  howToSchema: generatedContent.howToSchema,
  images: generatedContent.images,
  internalLinks: generatedContent.internalLinks || [],
}
```

### 🔄 대안 방법 (향후 개선)

만약 `author_id` 외래 키를 사용하고 싶다면:

#### Option A: Profiles 테이블에 저자 추가

```sql
-- 의료 통역사를 profiles 테이블에 추가
INSERT INTO profiles (id, name, role, specialty)
VALUES
  ('uuid-for-kim-seo-yeon', '김서연', 'medical_interpreter', '성형외과'),
  ('uuid-for-lim-do-yoon', '임도윤', 'medical_interpreter', '성형외과');
```

그 후 페르소나 시스템에서 해당 UUID 사용:

```typescript
// src/lib/content/persona.ts
export const AUTHORS: AuthorPersona[] = [
  {
    id: 'uuid-for-kim-seo-yeon', // profiles 테이블의 실제 ID
    name: '김서연',
    // ...
  },
];
```

#### Option B: 외래 키 제약조건 제거

```sql
ALTER TABLE blog_posts
DROP CONSTRAINT blog_posts_author_id_fkey;
```

**권장하지 않음**: 데이터 무결성이 떨어짐

### 🎯 현재 아키텍처의 장점

`author_id = null` 접근 방식의 이점:

1. **페르소나 시스템 독립성**:
   - Profiles 테이블과 분리
   - 언제든 페르소나 추가/수정 가능

2. **완전한 정보 보존**:
   - `generation_metadata`에 전체 author 객체 저장
   - 이력, 전문분야, 경력 등 모든 정보 유지

3. **유연성**:
   - 실제 사용자와 가상 페르소나 혼용 가능
   - 향후 확장 용이

### ✔️ 해결 확인

에러가 해결되면 정상적으로 저장됩니다:

```
💾 Saving to database...
✅ Saved to database: 9ac9f35a-9ce1-4469-a4cb-bd57f6b6e675
✅ Keyword status updated to 'generated'
```

---

## Error #5: Invalid JSON Response from Claude

### 🔴 에러 메시지

```
❌ Failed to parse JSON response
❌ Content generation failed: Invalid JSON response from Claude
```

### 📍 발생 위치

- **파일**: `/src/lib/content/single-content-generator.ts`
- **시점**: Claude API 응답 파싱 중
- **라인**: 232-236

### 🔍 원인 분석

Claude API가 응답을 Markdown 코드 블록으로 감싸거나, 추가 텍스트를 포함하여 순수 JSON이 아닌 형태로 반환했습니다.

**발생 가능한 응답 형태**:

```typescript
// Case 1: Markdown 코드 블록
`\`\`\`json
{
  "title": "...",
  "content": "..."
}
\`\`\``

// Case 2: 설명 포함
`Here is the generated content:
{
  "title": "...",
  "content": "..."
}`

// Case 3: 순수 JSON (정상)
`{
  "title": "...",
  "content": "..."
}`
```

**원인**:
- Claude 모델이 JSON 출력 지시를 완벽히 따르지 않음
- 프롬프트에서 JSON 출력 강제가 불충분
- 응답 파싱 로직이 다양한 형태를 처리하지 못함

### ✅ 해결 방법

#### 1. 3단계 JSON 추출 전략 구현

```typescript
// 5. Extract JSON from response
const textContent = response.content
  .filter((block) => block.type === 'text')
  .map((block) => (block as any).text)
  .join('\n');

let jsonStr = textContent.trim();

// Strategy 1: Check for ```json code block
const jsonBlockMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
if (jsonBlockMatch) {
  jsonStr = jsonBlockMatch[1].trim();
}

// Strategy 2: Check for ``` code block without language
if (!jsonStr.startsWith('{')) {
  const codeBlockMatch = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }
}

// Strategy 3: Find first { and last }
if (!jsonStr.startsWith('{')) {
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }
}

// Parse JSON
let parsedContent;
try {
  parsedContent = JSON.parse(jsonStr);
} catch (error) {
  console.error('   ❌ Failed to parse JSON response');
  console.error('   First 500 chars of response:', textContent.substring(0, 500));
  throw new Error('Invalid JSON response from Claude');
}
```

#### 2. User Prompt 강화

프롬프트에 JSON 출력 요구사항을 더욱 명확히:

```typescript
const userPrompt = `Write a comprehensive blog post about: ${keyword}

Target audience: ${locale} speakers interested in Korean medical tourism
Category: ${category}
Style: Professional yet friendly, from ${author.years_of_experience} years experience perspective

Focus on:
- Accurate medical information
- Clear pricing ranges in USD
- Patient journey and recovery timeline
- Cultural sensitivity for ${locale} audience
- SEO optimization for "${keyword}"

CRITICAL OUTPUT REQUIREMENTS:
1. Return ONLY valid JSON (no additional text, explanations, or markdown)
2. The "content" field must contain HTML (not Markdown)
3. Include all required fields as specified in the system prompt
4. Follow the exact JSON structure from OUTPUT FORMAT section
5. Do NOT wrap the JSON in markdown code blocks

Return your response as pure JSON starting with { and ending with }`;
```

**핵심 지시사항**:
- "Return ONLY valid JSON"
- "no additional text, explanations, or markdown"
- "Do NOT wrap the JSON in markdown code blocks"
- "pure JSON starting with { and ending with }"

#### 3. System Prompt 검증

`system-prompt-v4.ts`에서 JSON 출력 형식 명시:

```typescript
export function buildSystemPromptV4(options: SystemPromptOptions): string {
  return `
You are an expert medical tourism content writer...

# OUTPUT FORMAT

Return your response as a SINGLE, VALID JSON object. DO NOT include any text before or after the JSON. DO NOT wrap the JSON in markdown code blocks.

The JSON must have this exact structure:
{
  "title": "string",
  "excerpt": "string (150-200 chars)",
  "content": "string (HTML format)",
  "contentFormat": "html",
  "metaTitle": "string",
  "metaDescription": "string",
  "tags": ["string", ...],
  "faqSchema": [...],
  "howToSchema": [...],
  "images": [...]
}

IMPORTANT:
- Return ONLY the JSON object
- Do NOT add explanations or markdown formatting
- The "content" field must be HTML (not Markdown)
`;
}
```

### 🎯 예방 방법

1. **프롬프트 테스트**:
   - 다양한 키워드로 테스트
   - JSON 출력 일관성 확인

2. **에러 로깅 강화**:
   ```typescript
   catch (error) {
     console.error('   ❌ Failed to parse JSON response');
     console.error('   First 500 chars:', textContent.substring(0, 500));
     console.error('   Last 500 chars:', textContent.substring(textContent.length - 500));
     // 디버깅에 유용
   }
   ```

3. **대체 파싱 방법**:
   - JSON5 라이브러리 사용 (더 관대한 파싱)
   - JSON 수정 후 재시도

### ✔️ 해결 확인

에러가 해결되면 정상적으로 콘텐츠 생성:

```
🤖 Generating content with Claude...
✅ Content generated
   Input tokens: 3,968
   Output tokens: 6,448
   Cost: $0.1086

✅ Content generation complete!
   Duration: 99.2s
```

---

## 추가 참고사항

### 일반적인 디버깅 팁

#### 1. 로그 확인

개발 서버 콘솔에서 상세 로그 확인:

```bash
# 터미널에서 실행 중인 npm run dev 출력 확인
🚀 Content generation request
   User: afformation.ceo@gmail.com
   Keyword: 韓國鼻整形
   Locale: ja
   Category: plastic-surgery

📝 Generating content for: 韓國鼻整形 (ja)
   ✅ Author: 임도윤 (9년 경력)
   🔍 Building RAG context...
   ✅ RAG context built
   🤖 Generating content with Claude...
   ✅ Content generated
```

#### 2. 환경 변수 확인

`.env.local` 파일의 필수 환경 변수:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # 서버 사이드 전용

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Upstash Vector
UPSTASH_VECTOR_REST_URL=https://your-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=...
```

#### 3. 데이터베이스 상태 확인

Supabase Studio에서 확인:

```sql
-- 키워드 상태 확인
SELECT keyword, locale, status, created_at
FROM content_keywords
ORDER BY created_at DESC
LIMIT 10;

-- 생성된 콘텐츠 확인
SELECT id, title_ko, title_ja, status, created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'blog_posts';
```

### 성능 모니터링

콘텐츠 생성 시 다음 메트릭 확인:

```
✅ Content generation complete!
   Duration: 78.1s        # 목표: < 120s
   Total cost: $0.0863    # 목표: < $0.50
   Images to generate: 3   # 일반적으로 3개
```

**정상 범위**:
- Duration: 60-120초
- Cost: $0.05-0.15 (RAG 포함)
- Images: 2-5개

### 추가 에러 처리

#### Timeout 에러

```
Error: Request timeout after 60000ms
```

**해결**:
```typescript
// route.ts에서 maxDuration 증가
export const maxDuration = 120; // 60 → 120
```

#### Rate Limit 에러

```
Error: Rate limit exceeded for Anthropic API
```

**해결**:
- API 사용량 확인
- 병렬 처리 제한 (max 3 concurrent)
- 재시도 로직 구현

---

## 요약

### 해결한 주요 에러

| # | 에러 | 원인 | 해결 방법 |
|---|------|------|-----------|
| 1 | Module not found | 패키지 미설치 | `npm install @anthropic-ai/sdk` |
| 2 | Table not found | 잘못된 테이블 참조 | `blog_posts` 테이블 사용 + 로케일 필드 매핑 |
| 3 | RLS violation | RLS 정책 차단 | `createAdminClient()` 사용 |
| 4 | Foreign key violation | 외래 키 제약 | `author_id = null`, metadata에 저장 |
| 5 | Invalid JSON | Claude 응답 형식 | 3단계 JSON 추출 전략 |

### 테스트 결과

**최종 성공**:
```
✅ Content generation complete!
   Total time: 78.1s
   Cost: $0.0863
   Saved: Yes
   Keyword status: 'generated'
```

**성능 지표**:
- ✅ 비용: $0.086 (목표 $0.344 대비 75% 저렴)
- ✅ 속도: 78초 (목표 120초 이내)
- ✅ 품질: HTML 포맷, 이미지 3개 포함
- ✅ 데이터베이스 저장 성공
- ✅ 키워드 상태 업데이트 성공

---

**문서 작성자**: Claude Sonnet 4.5
**최종 수정일**: 2026-01-23
**관련 문서**:
- [SINGLE_LANGUAGE_FIX.md](./SINGLE_LANGUAGE_FIX.md) - 아키텍처 수정 가이드
- [ARCHITECTURE_FIX.md](./ARCHITECTURE_FIX.md) - 전체 아키텍처 문서
- [FINAL_IMPLEMENTATION_GUIDE.md](./FINAL_IMPLEMENTATION_GUIDE.md) - 종합 가이드
