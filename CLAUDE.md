# Claude Code Guidelines

## Git Operations
- **커밋/푸시는 사용자가 명시적으로 요청할 때만 진행할 것**
- 커밋 메시지에 Co-Authored-By 삽입하지 말 것
- 작업 완료 후 자동으로 커밋을 제안하지 말 것

## Language
- 한국어로 대화

---

## 프로젝트 핵심 정보

### 데이터베이스 (Supabase)
- **타임존**: `Asia/Seoul` (KST, UTC+9)로 설정됨
- 모든 타임스탬프가 `+09:00`으로 표시됨
- `getKSTTimestamp()` 함수 사용 (`src/lib/utils.ts`)

### 콘텐츠 자동 생성 시스템
- **Cron 스케줄**: DB의 `system_settings.cron_auto_generate` 설정 참조
- **Vercel Cron**: 15분마다 트리거, 실제 실행은 DB 스케줄에 따름
- **키워드 상태**: pending → generating → generated/published
- 실패 시 자동으로 pending으로 롤백됨

### 주요 API/Cron 경로
- `/api/cron/auto-generate` - 콘텐츠 자동 생성
- `/api/cron/auto-publish` - 자동 발행
- `/api/content/generate` - 수동 생성

### 외부 API
- **Anthropic Claude**: 콘텐츠 생성 (크레딧 소진 시 실패)
- **Replicate Imagen 4**: 이미지 생성
- 크레딧 부족 에러: `Your credit balance is too low to access the Anthropic API`

### 블로그 시스템
- 8개 언어 지원: ko, en, ja, zh-CN, zh-TW, th, mn, ru
- 상대 시간 표시: 7일 이내는 "3일 전", 이후는 날짜
- 마이그레이션 스크립트: `scripts/migrate-to-kst.ts`

---

## 최근 변경 이력 (2026-02-04)

### KST 타임존 설정
- Supabase DB 타임존을 `Asia/Seoul`로 변경
- 기존 blog_posts, content_keywords 타임스탬프 마이그레이션 완료
- `getKSTTimestamp()` 함수로 일관된 타임스탬프 생성

### 홈페이지 개선
- 카테고리 섹션: 모든 링크 `/hospitals`로 통일
- Featured Hospitals/Interpreters: DB 데이터 기반으로 변경
- 블로그 카드: "5 min read" 제거, 상대 시간 표시 추가

### 병원 페이지
- 필터 간소화: specialty만 유지 (city, sort 제거)
- 뷰 모드: 그룹 뷰만 유지 (grid/list 토글 제거)
