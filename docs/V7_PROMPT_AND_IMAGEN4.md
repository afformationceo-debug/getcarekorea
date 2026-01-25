# v7.1 통역사 페르소나 프롬프트 & Imagen 4 이미지 생성

> 최종 업데이트: 2026-01-25

## 📋 개요

이 문서는 GetCareKorea의 콘텐츠 생성 시스템의 핵심인 **v7.1 통역사 페르소나 프롬프트**와 **Google Imagen 4 이미지 생성**을 설명합니다.

---

## 🎭 v7.1 통역사 페르소나 프롬프트

### 왜 v7.1인가?

| 버전 | 스타일 | 문제점 |
|------|--------|--------|
| v6 | 정보성 블로그 | "~에 대해 알아보겠습니다" 같은 딱딱한 어투 |
| **v7.1** | 통역사 후기/에세이 | 개인적 경험 기반, 설득력 있는 스토리텔링 |

### 핵심 원칙

```
⚠️ CRITICAL: 절대 변경하지 말 것!

1. 통역사 관점의 후기/에세이 스타일
2. 해당 국가 현지인 감성 100% 반영
3. 설득 플로우: 공감 → 문제인식 → 해결책 → 증거 → CTA
4. 진짜 문의가 오게끔 하는 게 목표
```

### 글쓰기 스타일

#### ❌ 금지 사항
- "~에 대해 알아보겠습니다" 같은 정보성 블로그 어투
- "오늘은 ~를 소개합니다" 같은 딱딱한 시작
- 교과서적인 나열식 설명

#### ✅ 필수 사항
- "내가 통역했던 환자분 이야기를 해줄게" 같은 개인적 톤
- 실제 케이스 스토리 **2개** 포함 (익명으로)
- 원어민이 쓴 것 같은 자연스러운 표현
- 시맨틱 HTML 태그 사용 (article, section, h1-h4, table)

### HTML 구조

```html
<article>
  <header>
    <h1>[키워드 포함 제목]</h1>
  </header>

  <!-- TL;DR 요약 (Featured Snippet 최적화) -->
  <section class="tldr-summary">
    <h2>⚡ Quick Answer</h2>
    <p><strong>[40-60단어 핵심 답변]</strong></p>
    <ul>
      <li><strong>Cost:</strong> $X,XXX - $XX,XXX</li>
      <li><strong>Duration:</strong> X-X days</li>
      <li><strong>Recovery:</strong> X-X weeks</li>
      <li><strong>Best for:</strong> [ideal candidate]</li>
    </ul>
  </section>

  <!-- 케이스 스토리 -->
  <section class="case-study">
    <h2>💬 [Patient Name]'s Story</h2>
    <blockquote>
      <p>[구체적인 환자 이야기]</p>
    </blockquote>
    <p><strong>💡 As their interpreter:</strong> [인사이트]</p>
  </section>

  <!-- 가격 비교 테이블 -->
  <section class="cost-comparison">
    <h2>Real Cost Breakdown</h2>
    <table>
      <thead>
        <tr><th>Item</th><th>Korea</th><th>USA</th><th>Savings</th></tr>
      </thead>
      <tbody>
        <tr><td>[항목]</td><td>$X,XXX</td><td>$XX,XXX</td><td><strong>XX%</strong></td></tr>
      </tbody>
    </table>
  </section>

  <!-- CTA -->
  <section class="conclusion-cta">
    <h2>Ready to Start?</h2>
    <div class="cta-box">
      <h3>Chat with me on WhatsApp</h3>
      <a href="#contact">Chat with me on WhatsApp →</a>
    </div>
  </section>
</article>
```

### 문화별 컨텍스트

| 언어 | 감성 | 메신저 CTA |
|------|------|-----------|
| 🇺🇸 English | 직접적, 데이터 중시 | WhatsApp |
| 🇯🇵 日本語 | 정중함, 안전 강조 | LINE |
| 🇨🇳 中文 | 결과 중시, 가격 민감 | WeChat |
| 🇹🇭 ไทย | 친근함, 후기 중시 | LINE |

### 관련 파일

- `src/lib/content/prompts/system-prompt-v7-interpreter.ts` - 메인 프롬프트
- `src/lib/content/single-content-generator.ts` - 콘텐츠 생성기
- `scripts/generate-interpreter-persona-content.ts` - 테스트 스크립트

---

## 🖼️ Google Imagen 4 이미지 생성

### DALL-E 3 → Imagen 4 마이그레이션

| 항목 | DALL-E 3 (이전) | Imagen 4 (현재) |
|------|----------------|-----------------|
| 제공자 | OpenAI | Google via Replicate |
| 모델 ID | `dall-e-3` | `google/imagen-4` |
| 비용 | $0.08/이미지 | **$0.02/이미지** |
| 품질 | 좋음 | 더 사실적 |
| 출력 포맷 | PNG, WebP | **PNG, JPG만** (WebP 미지원) |

### 설정

```typescript
const IMAGEN4_CONFIG = {
  MODEL: 'google/imagen-4' as const,
  COST_PER_IMAGE: 0.02,
  OUTPUT_FORMAT: 'png' as const,  // ⚠️ WebP 미지원
  REQUEST_DELAY_MS: 3000,
};
```

### 이미지 프롬프트 가이드라인

```
Editorial stock photograph of [장면 설명].
[구체적인 상황 설명].
Modern Gangnam clinic interior, natural lighting.
Shot on Sony A7R IV, 35mm f/1.4. 8K resolution.
NO AI artifacts, NO illustration.
```

### 필수 이미지 (포스트당 3개)

| 위치 | 내용 |
|------|------|
| `[IMAGE_PLACEHOLDER_1]` | 상담/진료 장면 |
| `[IMAGE_PLACEHOLDER_2]` | 시술/과정 장면 |
| `[IMAGE_PLACEHOLDER_3]` | 결과/만족 장면 |

### 이미지 주입 코드

```typescript
// image.placeholder는 이미 "[IMAGE_PLACEHOLDER_1]" 형태
const escapedPlaceholder = image.placeholder.replace(/[[\]]/g, '\\$&');
const placeholderRegex = new RegExp(escapedPlaceholder, 'gi');
const imageHtml = `
<figure class="my-8">
  <img
    src="${image.url}"
    alt="${image.alt}"
    class="w-full rounded-lg shadow-lg"
    loading="lazy"
    width="1792"
    height="1024"
  />
</figure>`;
finalContent = finalContent.replace(placeholderRegex, imageHtml);
```

### 관련 파일

- `src/lib/content/imagen4-helper.ts` - Imagen 4 헬퍼
- `scripts/generate-interpreter-persona-content.ts` - 이미지 생성 포함 테스트

---

## 💰 비용 구조

### 포스트당 비용

| 항목 | 비용 |
|------|------|
| Claude Sonnet 4 | ~$0.10 |
| Imagen 4 (3개) | $0.06 |
| **총계** | **~$0.16** |

### 월간 예상 비용 (30개 포스트)

- 콘텐츠: $3.00
- 이미지: $1.80
- **총계: ~$4.80/월**

---

## 🔧 문제 해결

### 이미지 플레이스홀더가 교체되지 않음

**원인**: `image.placeholder`가 이미 `[IMAGE_PLACEHOLDER_1]` 형태인데 추가 괄호를 붙임

**해결**:
```typescript
// ❌ 잘못된 방식
const regex = new RegExp(`\\[${image.placeholder}\\]`, 'gi');

// ✅ 올바른 방식
const escapedPlaceholder = image.placeholder.replace(/[[\]]/g, '\\$&');
const regex = new RegExp(escapedPlaceholder, 'gi');
```

### Imagen 4 WebP 미지원 오류

**원인**: Imagen 4는 PNG, JPG만 지원

**해결**: `OUTPUT_FORMAT: 'png'` 사용

---

## 📅 변경 이력

| 날짜 | 변경 사항 |
|------|----------|
| 2026-01-25 | v7.1 프롬프트 문서화, Imagen 4 마이그레이션 기록 |
| 2026-01-24 | 이미지 플레이스홀더 버그 수정 |
| 2026-01-23 | v7.1 프롬프트 구현 |
| 2026-01-20 | DALL-E 3 → Imagen 4 마이그레이션 |
