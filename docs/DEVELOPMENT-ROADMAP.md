# GetCareKorea 개발 로드맵

## 현재 상태 요약

### ✅ 완료된 기능
- 다국어 블로그 시스템 (8개 언어)
- AI 콘텐츠 생성 (Claude + DALL-E 3)
- 자동화 Cron Jobs (생성/발행/학습)
- Author Personas = Interpreters 통합
- 피드백 학습 시스템 (Upstash Vector)
- Admin 패널 기본 기능
- Google Analytics 컴포넌트

### ⏳ 미완료 / 개선 필요
- 도메인 등록 및 배포
- Google Search Console 연동
- 통역사(Author Personas) DB 데이터 입력
- 시술 페이지 완성
- 병원 페이지 완성
- CTA 버튼 메신저 링크 (WhatsApp, LINE, WeChat)
- 식당/관광 페이지
- 키워드-통역사 자동 배분 시스템

---

## Phase 1: 핵심 인프라 (우선순위 높음)

### 1.1 도메인 및 배포 설정
- [ ] 도메인 구매 (getcarekorea.com 또는 대안)
- [ ] Vercel에 도메인 연결
- [ ] SSL 인증서 자동 설정 (Vercel 제공)
- [ ] 환경 변수 Vercel에 설정

### 1.2 Google 연동
- [ ] Google Search Console 도메인 등록
- [ ] GSC 소유권 확인 (DNS 또는 HTML 태그)
- [ ] Google Analytics 4 계정 생성
- [ ] GA4 Measurement ID 환경변수 설정
- [ ] GSC API 서비스 계정 생성 (선택)

### 1.3 통역사(Author Personas) DB 구축
- [ ] 국가별 통역사 페르소나 정의
  - 영어권 (미국, 영국, 호주): 2-3명
  - 일본어: 2-3명
  - 중국어 간체 (중국): 2-3명
  - 중국어 번체 (대만, 홍콩): 2-3명
  - 태국어: 1-2명
  - 몽골어: 1-2명
  - 러시아어: 1-2명
- [ ] author_personas 테이블에 데이터 삽입
- [ ] 프로필 이미지 (AI 생성 또는 스톡)
- [ ] 각 통역사별 전문 분야 설정

### 1.4 키워드-통역사 자동 배분 시스템
- [ ] 키워드 등록 시 locale 기반 통역사 자동 매칭
- [ ] 전문 분야(category) 기반 우선 매칭
- [ ] 균등 배분 로직 (라운드 로빈)

---

## Phase 2: 핵심 페이지 완성

### 2.1 시술(Procedures) 페이지
- [ ] 시술 카테고리 목록 페이지
  - 성형외과 (Plastic Surgery)
  - 피부과 (Dermatology)
  - 치과 (Dental)
  - 건강검진 (Health Checkup)
  - 안과 (Ophthalmology)
  - 정형외과 (Orthopedics)
  - 난임치료 (Fertility)
  - 모발이식 (Hair Transplant)
- [ ] 시술 상세 페이지 템플릿
- [ ] 시술별 FAQ 섹션
- [ ] 시술별 가격 범위 표시
- [ ] 관련 블로그 포스트 연결

### 2.2 병원(Hospitals) 페이지
- [ ] 병원 목록 페이지 (필터: 지역, 전문분야)
- [ ] 병원 상세 페이지
  - 기본 정보 (이름, 주소, 연락처)
  - 전문 분야
  - 의료진 소개
  - 시설 사진
  - 인증 (JCI 등)
  - 환자 후기
- [ ] 병원 DB 구축 (hospitals 테이블)
- [ ] 병원 데이터 수집/입력

### 2.3 통역사(Interpreters) 페이지
- [ ] 현재 author_personas 기반으로 동작 중 ✅
- [ ] 프로필 상세 정보 보강
- [ ] 예약/문의 CTA 연결

---

## Phase 3: CTA 및 전환 최적화

### 3.1 메신저 CTA 버튼
- [ ] WhatsApp Business 계정 생성
- [ ] LINE 공식 계정 생성
- [ ] WeChat 공식 계정 생성 (중국 대상)
- [ ] 카카오톡 채널 생성 (한국 내)
- [ ] 각 통역사별 메신저 링크 설정
- [ ] author_personas.preferred_messenger 필드 활용
- [ ] 국가/언어별 기본 메신저 자동 선택

### 3.2 문의 폼 최적화
- [ ] 문의 폼 다국어 지원 확인
- [ ] 이메일 알림 설정
- [ ] 관리자 대시보드에서 문의 관리

---

## Phase 4: 부가 기능

### 4.1 식당/관광 페이지 (Phase 4)
- [ ] 의료관광객 추천 식당 목록
- [ ] 서울 관광 명소
- [ ] 숙소 추천
- [ ] 교통 안내

### 4.2 SEO 고도화
- [ ] 구조화된 데이터 (Schema.org)
  - Organization
  - MedicalBusiness
  - FAQPage
  - HowTo
- [ ] 사이트맵 자동 제출
- [ ] robots.txt 최적화

---

## Phase 5: 운영 및 모니터링

### 5.1 모니터링 대시보드
- [ ] 콘텐츠 생성 현황
- [ ] 발행 현황
- [ ] GSC 성과 지표
- [ ] 비용 추적 (AI API 사용량)

### 5.2 A/B 테스팅
- [ ] 제목 변형 테스트
- [ ] CTA 버튼 테스트
- [ ] 랜딩 페이지 테스트

---

## 환경 변수 체크리스트

### 필수 (현재)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
SUPABASE_SERVICE_ROLE_KEY=✅

# AI
ANTHROPIC_API_KEY=✅
OPENAI_API_KEY=✅

# Upstash
UPSTASH_VECTOR_REST_URL=✅
UPSTASH_VECTOR_REST_TOKEN=✅
UPSTASH_REDIS_REST_URL=✅
UPSTASH_REDIS_REST_TOKEN=✅
```

### 추가 필요
```env
# Cron 보안
CRON_SECRET=❌ 설정 필요

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=❌ GA4 계정 생성 후 설정

# Google Search Console (선택)
GSC_SITE_URL=❌ 도메인 등록 후 설정
GOOGLE_SERVICE_ACCOUNT_KEY=❌ 서비스 계정 생성 후 설정

# ISR
REVALIDATION_SECRET=❌ 설정 필요

# 사이트 URL
NEXT_PUBLIC_SITE_URL=❌ 도메인 등록 후 설정
```

---

## 우선순위 실행 순서

### 즉시 실행 (Day 1-2)
1. 통역사(Author Personas) DB 데이터 삽입
2. 키워드-통역사 자동 배분 로직 구현
3. CTA 메신저 링크 시스템 구현

### 단기 (Week 1)
4. 시술 페이지 완성
5. 병원 페이지 기본 구현
6. 도메인 등록 및 Vercel 배포

### 중기 (Week 2-3)
7. Google Search Console 연동
8. Google Analytics 연동
9. 병원 데이터 수집 및 입력

### 장기 (Month 1+)
10. 식당/관광 페이지
11. A/B 테스팅
12. 성과 모니터링 대시보드
