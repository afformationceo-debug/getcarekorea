# 아키텍처 수정: 키워드 기반 단일 언어 콘텐츠 생성

## 📋 문제 분석

### 현재 구조 (잘못된 가정)
```
키워드 "코 성형" (ko)
  → 한국어 콘텐츠 생성
  → 자동으로 7개 언어 번역 (en, ja, zh-CN, etc.)
  → 8개 언어 모두 발행
```

**문제점**:
- 키워드는 이미 특정 언어/국가를 타겟팅함
- "코 성형"은 한국 시장만 타겟
- "Korean Rhinoplasty"는 영어권 시장만 타겟
- 자동 번역은 불필요하고 비효율적

### 올바른 구조
```
키워드 "코 성형" (ko)
  → 한국어 콘텐츠만 생성
  → 한국어 사이트(ko.getcarekorea.com)에만 발행

키워드 "Korean Rhinoplasty" (en)
  → 영어 콘텐츠만 생성
  → 영어 사이트(en.getcarekorea.com)에만 발행

키워드 "韓国の鼻整形" (ja)
  → 일본어 콘텐츠만 생성
  → 일본어 사이트(ja.getcarekorea.com)에만 발행
```

## 🔧 수정 계획

### 1. DB 스키마 (변경 없음)

현재 스키마는 이미 올바름:

```sql
-- keywords 테이블
CREATE TABLE keywords (
  id UUID PRIMARY KEY,
  keyword_text TEXT NOT NULL,      -- "코 성형" or "Korean Rhinoplasty"
  locale TEXT NOT NULL,             -- 'ko' or 'en'
  category TEXT,                    -- 'plastic-surgery'
  status TEXT DEFAULT 'pending'
);

-- content_drafts 테이블
CREATE TABLE content_drafts (
  id UUID PRIMARY KEY,
  keyword_text TEXT NOT NULL,
  locale TEXT NOT NULL,             -- 키워드의 locale과 동일
  title TEXT,
  content TEXT,                     -- HTML
  hreflang_group TEXT,              -- 수동 그룹화용 (선택사항)
  status TEXT DEFAULT 'draft'
);
```

**hreflang_group 사용법 변경**:
- 기존: 자동으로 같은 키워드의 다른 언어 버전 그룹화
- 변경: 수동으로 관련 콘텐츠 그룹화 (예: 같은 주제를 다룬 다른 언어 콘텐츠)

### 2. 콘텐츠 생성 로직 변경

#### 기존 플로우
```typescript
// ❌ 잘못된 방식
generateContent('코 성형', 'ko')
  → generateMultiLanguageContent() // 7개 언어 자동 번역
  → 8개 콘텐츠 생성 (ko, en, ja, zh-CN, zh-TW, th, mn, ru)
```

#### 변경된 플로우
```typescript
// ✅ 올바른 방식
generateContent('코 성형', 'ko')
  → 한국어 콘텐츠만 생성
  → 1개 콘텐츠 생성 (ko)

// 다국어가 필요하면 각각 별도로 생성
generateContent('Korean Rhinoplasty', 'en')
  → 영어 콘텐츠만 생성
  → 1개 콘텐츠 생성 (en)
```

### 3. 성능 개선

#### 비용 절감
```
기존: 키워드 1개 → 8개 언어 생성 → $1.072
변경: 키워드 1개 → 1개 언어 생성 → $0.344

→ 68% 비용 절감 ($0.728 절약)
```

#### 속도 개선
```
기존: 키워드 1개 → ~2.25분 (8개 언어 생성)
변경: 키워드 1개 → ~0.5분 (1개 언어만)

→ 78% 속도 향상 (4.5배 빠름)
```

#### 대량 처리
```
100개 키워드 (각기 다른 언어):
기존: 225분 (순차) / 75분 (병렬)
변경: 50분 (순차) / 17분 (병렬)

→ 4.4배 빠름
```

### 4. API 변경사항

#### A. 콘텐츠 생성 API 단순화

**기존**:
```typescript
POST /api/content/generate-multilang
{
  "sourceContent": {...},
  "targetLocales": ["en", "ja", "zh-CN", ...]  // 자동 번역
}
```

**변경**:
```typescript
POST /api/content/generate
{
  "keyword": "코 성형",
  "locale": "ko",  // 키워드의 locale
  "category": "plastic-surgery"
}
// → 해당 locale의 콘텐츠만 생성
```

#### B. 선택적 번역 API (필요시에만)

```typescript
POST /api/content/translate
{
  "contentDraftId": "uuid",
  "targetLocale": "en",  // 단일 타겟
  "localize": true
}
// → 수동으로 다른 언어 버전 생성
```

### 5. 발행 로직 변경

#### 기존
```typescript
// ❌ 잘못된 방식
publish(contentDraftId, { publishAll: true })
  → hreflang_group의 모든 언어 버전 자동 발행
```

#### 변경
```typescript
// ✅ 올바른 방식
publish(contentDraftId)
  → 해당 locale의 사이트에만 발행
  → URL: https://getcarekorea.com/{locale}/blog/{slug}

// 예시:
locale: 'ko' → https://getcarekorea.com/ko/blog/korean-rhinoplasty
locale: 'en' → https://getcarekorea.com/en/blog/korean-rhinoplasty
locale: 'ja' → https://getcarekorea.com/ja/blog/korean-nose-surgery
```

## 📁 수정할 파일

### 1. Core Libraries (3개 수정, 1개 새로 생성)

#### ✏️ 수정: `/src/lib/content/single-language-generator.ts` (새로 생성)
- 단일 언어 콘텐츠 생성
- multi-language-generator.ts의 복잡성 제거
- 키워드 locale에 맞는 콘텐츠만 생성

#### ✏️ 수정: `/src/lib/content/translation-helper.ts` (새로 생성)
- 선택적 번역 기능
- 수동으로 다른 언어 버전 생성할 때만 사용

#### 📝 유지: `/src/lib/content/multi-language-generator.ts`
- 레거시 지원용으로 유지
- 필요시에만 사용 (deprecated 표시)

### 2. API Routes (2개 수정, 1개 새로 생성)

#### ✏️ 수정: `/src/app/api/content/generate/route.ts` (새로 생성)
- 단일 언어 콘텐츠 생성 API
- 키워드의 locale에 맞게 생성

#### ✏️ 수정: `/src/app/api/content/publish/route.ts`
- publishAll 옵션 제거
- 단일 locale만 발행

#### 📝 유지: `/src/app/api/content/generate-multilang/route.ts`
- 레거시 API로 유지
- deprecated 표시

### 3. UI Components (수정 없음)

- ContentManagement.tsx: 변경 없음 (locale 필터링 이미 지원)
- Preview 페이지: 변경 없음

## 🔐 보안 고려사항

### 1. 에러 메시지 보안

```typescript
// ❌ 나쁜 예
catch (error) {
  return NextResponse.json({
    error: error.message,  // DB 스키마 노출 위험
    stack: error.stack     // 민감 정보 노출
  });
}

// ✅ 좋은 예
catch (error) {
  console.error('[SECURE] Content generation error:', error);

  return NextResponse.json({
    error: 'Failed to generate content',
    code: 'GENERATION_ERROR',
    // 상세 정보는 로그에만
  }, { status: 500 });
}
```

### 2. 로그 보안

```typescript
// ❌ 나쁜 예
console.log('API Key:', process.env.OPENAI_API_KEY);

// ✅ 좋은 예
console.log('API Key configured:', !!process.env.OPENAI_API_KEY);
```

### 3. 인증 강화

```typescript
// 모든 생성 API에 인증 필수
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## ♿ 접근성 개선

### 1. 에러 상태 접근성

```typescript
// 에러 발생 시 스크린리더 알림
<div role="alert" aria-live="assertive">
  {error && <p>{error}</p>}
</div>
```

### 2. 로딩 상태 접근성

```typescript
<button disabled={loading} aria-busy={loading}>
  {loading ? '생성 중...' : '생성'}
</button>
```

## 📱 반응형 UI

모든 에러/로딩 상태가 모바일에서도 정상 표시되도록:

```css
@media (max-width: 640px) {
  .error-message {
    font-size: 0.875rem;
    padding: 0.75rem;
  }
}
```

## 🧪 테스트 계획

### 1. 단위 테스트

```typescript
describe('generateContent', () => {
  it('should generate content in keyword locale only', async () => {
    const result = await generateContent({
      keyword: '코 성형',
      locale: 'ko',
      category: 'plastic-surgery'
    });

    expect(result.locale).toBe('ko');
    expect(result.content).toContain('<p>');
  });

  it('should not auto-translate', async () => {
    const result = await generateContent({
      keyword: '코 성형',
      locale: 'ko'
    });

    // 영어 콘텐츠가 생성되지 않아야 함
    expect(result.translations).toBeUndefined();
  });
});
```

### 2. 통합 테스트

```typescript
describe('Content generation flow', () => {
  it('should generate and publish Korean content', async () => {
    // 1. 키워드 업로드
    const keyword = await uploadKeyword({
      keyword_text: '코 성형',
      locale: 'ko',
      category: 'plastic-surgery'
    });

    // 2. 콘텐츠 생성
    const content = await generateContent({
      keyword: keyword.keyword_text,
      locale: keyword.locale,
      category: keyword.category
    });

    expect(content.locale).toBe('ko');

    // 3. 발행
    const published = await publishContent(content.id);

    expect(published.url).toContain('/ko/blog/');
  });
});
```

### 3. 성능 테스트

```typescript
describe('Performance', () => {
  it('should be faster than multi-language generation', async () => {
    const start = Date.now();

    await generateContent({
      keyword: '코 성형',
      locale: 'ko'
    });

    const duration = Date.now() - start;

    // 단일 언어는 30초 이내
    expect(duration).toBeLessThan(30000);
  });
});
```

## 📈 마이그레이션 계획

### 기존 데이터 호환성

```sql
-- 기존 multi-language 콘텐츠는 유지
-- hreflang_group이 있는 콘텐츠는 그대로 유지
SELECT COUNT(*) FROM content_drafts WHERE hreflang_group IS NOT NULL;

-- 새로운 콘텐츠는 hreflang_group 없이 생성
-- 필요시에만 수동으로 그룹화
```

### 점진적 전환

1. **Phase 1**: 새로운 API 추가 (기존 API 유지)
2. **Phase 2**: UI에서 새로운 API 사용
3. **Phase 3**: 기존 API deprecated 표시
4. **Phase 4**: 충분한 기간 후 기존 API 제거

## 🎯 예상 효과

### 비용
- **68% 절감**: $1.072 → $0.344 per keyword
- 100개 키워드: $107 → $34 (각기 다른 언어)

### 속도
- **78% 향상**: 2.25분 → 0.5분 per keyword
- 100개 키워드: 75분 → 17분 (병렬 처리)

### 품질
- **타겟 언어에 최적화**: 번역이 아닌 네이티브 콘텐츠
- **문화적 정확성**: 각 언어/국가에 맞는 콘텐츠

### 운영
- **단순화**: 복잡한 다국어 로직 제거
- **유연성**: 필요시에만 번역 선택
- **확장성**: 언어별 독립적 운영

---

**작성일**: 2026-01-23
**다음 단계**: 코드 수정 및 테스트
