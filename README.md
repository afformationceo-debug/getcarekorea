# GetCareKorea 🏥

> 한국 의료관광 플랫폼 - AI 기반 자동 콘텐츠 생성 & 다국어 SEO 최적화

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)

## 🌟 프로젝트 소개

GetCareKorea는 외국인 환자들이 한국에서 의료 서비스를 받을 수 있도록 연결해주는 의료관광 플랫폼입니다.

### 핵심 기능

- **🤖 AI 자동 콘텐츠 생성** - Claude AI + v7.1 통역사 페르소나 프롬프트
- **🖼️ AI 이미지 생성** - Google Imagen 4 via Replicate
- **🌍 8개 언어 지원** - EN, KO, JA, ZH-CN, ZH-TW, TH, MN, RU
- **📈 SEO/AEO 최적화** - Featured Snippet, Schema.org, 시맨틱 HTML
- **⏰ Cron 자동 발행** - Vercel Cron으로 매일 자동 콘텐츠 생성

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | Next.js 15.1, React 19, Tailwind CSS v4 |
| **Backend** | Next.js API Routes, Vercel Edge Functions |
| **Database** | Supabase (PostgreSQL) |
| **AI/LLM** | Claude Sonnet 4 (Anthropic) |
| **Image Gen** | Google Imagen 4 (Replicate) |
| **Deployment** | Vercel |
| **i18n** | next-intl (8개 언어) |

## 📁 프로젝트 구조

```
getcarekorea/
├── src/
│   ├── app/
│   │   ├── [locale]/           # 다국어 라우트
│   │   │   ├── blog/           # 블로그 페이지
│   │   │   ├── hospitals/      # 병원 페이지
│   │   │   ├── procedures/     # 시술 페이지
│   │   │   └── interpreters/   # 통역사 페이지
│   │   └── api/
│   │       ├── cron/           # Cron Job 엔드포인트
│   │       ├── content/        # 콘텐츠 생성 API
│   │       └── revalidate/     # ISR 재검증 API
│   ├── lib/
│   │   ├── content/            # 콘텐츠 생성 시스템
│   │   │   ├── prompts/        # v7.1 통역사 프롬프트
│   │   │   ├── single-content-generator.ts
│   │   │   └── imagen4-helper.ts
│   │   └── supabase/           # DB 클라이언트
│   └── components/             # UI 컴포넌트
├── scripts/                    # 유틸리티 스크립트
└── docs/                       # 상세 문서
```

## 🚀 빠른 시작

### 1. 환경 변수 설정

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs
ANTHROPIC_API_KEY=your_anthropic_key
REPLICATE_API_TOKEN=your_replicate_token

# Cron Secret
CRON_SECRET=your_cron_secret
```

### 2. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

### 3. 콘텐츠 생성 테스트

```bash
# v7.1 통역사 페르소나 콘텐츠 생성
npx tsx scripts/generate-interpreter-persona-content.ts
```

## 📝 콘텐츠 생성 시스템

### v7.1 통역사 페르소나 프롬프트

```
⚠️ CRITICAL: 정보성 블로그 스타일 금지!

✅ 통역사 후기/에세이 스타일
✅ 실제 케이스 스토리 2개 포함
✅ 문화별 현지인 감성 반영
✅ 설득 플로우: 공감 → 문제인식 → 해결책 → 증거 → CTA
```

### 이미지 생성 (Google Imagen 4)

| 항목 | 값 |
|------|------|
| 모델 | `google/imagen-4` via Replicate |
| 비용 | $0.02/이미지 |
| 포맷 | PNG (16:9) |
| 필수 개수 | 3개/포스트 |

## 🔄 자동화 파이프라인

```
Vercel Cron (매일 09:00 KST)
    ↓
/api/cron/generate-content
    ↓
키워드 큐에서 선택
    ↓
Claude AI 콘텐츠 생성 (v7.1 프롬프트)
    ↓
Imagen 4 이미지 3개 생성
    ↓
Supabase DB 저장
    ↓
ISR 재검증 → 즉시 배포
```

## 📊 비용 구조

| 항목 | 단가 | 포스트당 |
|------|------|---------|
| Claude Sonnet 4 | ~$0.10 | $0.10 |
| Imagen 4 (3개) | $0.02 x 3 | $0.06 |
| **총계** | | **~$0.16/포스트** |

## 📚 문서

자세한 문서는 `/docs` 폴더를 참조하세요:

- [IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - 전체 아키텍처
- [AUTOMATED-CONTENT-SYSTEM.md](docs/AUTOMATED-CONTENT-SYSTEM.md) - 자동화 시스템
- [PHASE7_IMPLEMENTATION.md](docs/PHASE7_IMPLEMENTATION.md) - 자동 발행 시스템
- [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) - 환경 설정 가이드

## 🔗 링크

- **Production**: https://getcarekorea.com
- **Vercel Dashboard**: https://vercel.com/dashboard

## 📄 라이선스

Private - All Rights Reserved

---

Built with ❤️ for medical tourism in Korea
