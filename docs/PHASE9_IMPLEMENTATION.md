# Phase 9: 관리자 시스템 개선 - 구현 문서

> 완료일: 2026-01-29
> 버전: 1.0

---

## 1. 개요

Phase 9에서는 관리자 시스템의 전반적인 개선을 구현했습니다.

### 1.1 주요 목표
- 통역사 관리 시스템 구현 (CRUD)
- 키워드 관리 페이지 구조 개선 (분리된 페이지)
- 관리자 레이아웃 개선 (헤더/사이드바 분리)
- 다국어 번역 추가 (8개 언어)
- UI 컴포넌트 표준화

### 1.2 변경된 파일 구조

```
src/app/[locale]/admin/
├── layout.tsx                    # 레이아웃 개선 (헤더/사이드바 분리)
├── page.tsx                      # 대시보드 개선
├── interpreters/                 # 신규: 통역사 관리
│   ├── page.tsx                  # 목록 페이지
│   ├── InterpretersTable.tsx     # 테이블 컴포넌트
│   ├── InterpreterFormPage.tsx   # 폼 컴포넌트 (생성/수정 공용)
│   ├── new/page.tsx              # 생성 페이지
│   └── [id]/page.tsx             # 수정 페이지
├── keywords/                     # 개선: 키워드 관리
│   ├── page.tsx                  # 목록 페이지 (서버 컴포넌트로 변경)
│   ├── KeywordsTable.tsx         # 테이블 컴포넌트
│   ├── KeywordFormPage.tsx       # 폼 컴포넌트 (생성/수정 공용)
│   ├── new/page.tsx              # 생성 페이지
│   └── [id]/page.tsx             # 수정 페이지
└── ...

src/components/admin/
├── AdminHeader.tsx               # 신규: 관리자 헤더
├── AdminSidebar.tsx              # 신규: 관리자 사이드바
└── ImageUpload.tsx               # 신규: 이미지 업로드 컴포넌트

src/components/ui/
├── loading-spinner.tsx           # 신규: 로딩 스피너
├── status-badge.tsx              # 신규: 상태 배지
├── collapsible.tsx               # 신규: 접이식 패널
├── confirm-dialog.tsx            # 신규: 확인 다이얼로그
├── filter-bar.tsx                # 신규: 필터 바
├── pagination.tsx                # 신규: 페이지네이션
├── search-input.tsx              # 신규: 검색 입력
├── stats-card.tsx                # 신규: 통계 카드
└── ...

src/app/api/admin/
├── interpreters/                 # 신규: 통역사 API
│   ├── route.ts                  # POST (생성)
│   └── [id]/route.ts             # GET, PUT, DELETE
└── upload/route.ts               # 신규: 이미지 업로드 API
```

---

## 2. 통역사 관리 시스템

### 2.1 기능 개요

| 기능 | 설명 |
|------|------|
| 목록 조회 | 필터링, 검색, 정렬 지원 |
| 상세 조회 | 통역사 정보 확인 |
| 생성 | 새 통역사 프로필 생성 |
| 수정 | 기존 통역사 정보 수정 |
| 다국어 지원 | 8개 언어별 이름/소개/자격증 관리 |

### 2.2 데이터 구조

```typescript
interface AuthorPersona {
  id: string;
  slug: string;
  name: LocalizedField;           // { en: "John", ko: "존" }
  bio_short: LocalizedField;
  bio_full: LocalizedField;
  photo_url: string | null;
  years_of_experience: number;
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{              // 지원 언어 목록
    code: string;                 // 'en', 'ko', 'ja', etc.
    proficiency: string;          // 'native', 'fluent', 'conversational'
  }>;
  certifications: string[];
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  location: string;
  preferred_messenger: string | null;
  display_order: number;
  avg_rating: number;
  review_count: number;
}
```

### 2.3 필터 옵션

- **언어**: 다중 선택 가능 (OR 조건)
- **전문 분야**: 다중 선택 가능 (OR 조건)
- **상태**: 활성/비활성/추천/인증

---

## 3. 키워드 관리 개선

### 3.1 페이지 구조 변경

**Before (단일 페이지)**:
```
/admin/keywords           # 모든 CRUD 기능 포함
```

**After (분리된 페이지)**:
```
/admin/keywords           # 목록 (서버 컴포넌트)
/admin/keywords/new       # 생성
/admin/keywords/[id]      # 수정
```

### 3.2 주요 개선사항

1. **서버 컴포넌트 분리**: 목록 페이지가 서버 컴포넌트로 변경되어 초기 로딩 속도 개선
2. **테이블 컴포넌트 분리**: `KeywordsTable.tsx`로 재사용 가능
3. **폼 컴포넌트 공용화**: `KeywordFormPage.tsx`가 생성/수정 모두 지원
4. **상태별 액션 버튼**:
   - `pending` → Generate 버튼
   - `generated` → Regenerate 버튼
   - `published` → View Post 버튼 (새 탭에서 블로그 열기)

---

## 4. 관리자 레이아웃 개선

### 4.1 헤더/사이드바 분리

**AdminHeader.tsx**:
- 로고 및 사이트 이름
- 메인 사이트 링크
- 언어 전환
- 프로필 메뉴 (설정, 로그아웃)

**AdminSidebar.tsx**:
- 네비게이션 메뉴
- 아이콘 + 텍스트 표시
- 현재 페이지 하이라이트
- 접이식 지원 (향후)

### 4.2 메뉴 구조

```typescript
const menuItems = [
  { href: '/admin', icon: Home, label: 'dashboard' },
  { href: '/admin/interpreters', icon: Users, label: 'interpreters' },
  { href: '/admin/keywords', icon: Tags, label: 'keywords' },
  { href: '/admin/content', icon: FileText, label: 'content' },
  { href: '/admin/analytics', icon: BarChart3, label: 'analytics' },
  { href: '/admin/notifications', icon: Bell, label: 'notifications' },
  { href: '/admin/progress', icon: ListTodo, label: 'progress' },
  { href: '/admin/feedback', icon: MessageSquare, label: 'feedback' },
  { href: '/admin/system', icon: Settings, label: 'system' },
];
```

---

## 5. 다국어 번역 추가

### 5.1 추가된 키

**admin.interpreters**:
- 제목, 부제목
- 테이블 헤더
- 폼 필드 레이블
- 상태 메시지
- 전문 분야 목록
- 언어 목록
- 숙련도 레벨

### 5.2 지원 언어

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

## 6. UI 컴포넌트 추가

### 6.1 새 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `LoadingSpinner` | 로딩 인디케이터 (sm/md/lg 크기) |
| `StatusBadge` | 상태 표시 배지 (pending/generating/generated/published) |
| `Collapsible` | 접이식 패널 (Radix UI 기반) |
| `ConfirmDialog` | 확인 다이얼로그 |
| `FilterBar` | 필터 UI 래퍼 |
| `Pagination` | 페이지네이션 컴포넌트 |
| `SearchInput` | 검색 입력 필드 |
| `StatsCard` | 통계 카드 |

### 6.2 사용 예시

```tsx
// 로딩 스피너
<LoadingSpinner size="lg" color="primary" />

// 상태 배지
<StatusBadge status="published" />

// 접이식 패널
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>Content</CollapsibleContent>
</Collapsible>
```

---

## 7. API 변경사항

### 7.1 통역사 API

**POST /api/admin/interpreters**
- 새 통역사 생성
- 자동 슬러그 생성 (중복 시 숫자 추가)

**GET /api/admin/interpreters/[id]**
- 통역사 상세 조회

**PUT /api/admin/interpreters/[id]**
- 통역사 정보 수정

**DELETE /api/admin/interpreters/[id]**
- 통역사 삭제 (비활성화 권장)

### 7.2 업로드 API

**POST /api/admin/upload**
- 이미지 업로드
- Supabase Storage 연동
- 지원 버킷: interpreters, content, general

---

## 8. 마이그레이션

### 8.1 데이터베이스 마이그레이션

```sql
-- 20260129120000_interpreter_schema_refactor.sql
-- author_personas 테이블 구조 개선

-- 20260129130000_interpreter_storage.sql
-- Supabase Storage 버킷 설정

-- 20260129140000_cleanup_old_columns.sql
-- 사용하지 않는 컬럼 정리
```

### 8.2 실행 방법

```bash
npx supabase db push
# 또는
npx supabase migration up
```

---

## 9. 삭제된 파일

| 파일 | 이유 |
|------|------|
| `src/middleware.ts` | 인증 로직 간소화 |
| `src/app/api/bookings/*` | 미사용 API 정리 |
| `supabase/migrations/009_*.sql` | 마이그레이션 파일명 변경 |
| `supabase/migrations/010_*.sql` | 마이그레이션 파일명 변경 |

---

## 10. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-29 | 초기 구현 - 통역사 관리, 키워드 페이지 개선, 관리자 레이아웃 |

---

## 11. 관련 문서

- [PHASE8_IMPLEMENTATION.md](./PHASE8_IMPLEMENTATION.md) - 이전 단계
- [UI_UPDATE_CHANGELOG.md](./UI_UPDATE_CHANGELOG.md) - UI 변경 이력
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - 환경 설정 가이드
