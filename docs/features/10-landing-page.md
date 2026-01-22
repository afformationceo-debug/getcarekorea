# Landing Page

## Overview

GetCareKorea 메인 랜딩 페이지입니다. 마이크로 프론트엔드 구조로 11개 섹션으로 구성됩니다.

## Key Features

- **모듈형 섹션**: 11개 독립 컴포넌트
- **반응형 디자인**: 모바일/태블릿/데스크톱
- **애니메이션**: Framer Motion 스크롤 애니메이션
- **AI 채팅 통합**: 플로팅 챗 위젯

## File Structure

```
/src/app/[locale]/page.tsx        # 메인 페이지

/src/components/landing
├── HeroSection.tsx               # 1. 히어로 섹션
├── TrustBanner.tsx               # 2. 신뢰 지표
├── CategoriesSection.tsx         # 3. 의료 카테고리
├── WhyPlatformSection.tsx        # 4. 플랫폼 장점
├── FreeInterpreterBanner.tsx     # 5. 무료 통역사 배너
├── PriceComparisonSection.tsx    # 6. 가격 비교
├── FeaturedHospitalsSection.tsx  # 7. 추천 병원
├── HowItWorksSection.tsx         # 8. 이용 방법
├── TestimonialsSection.tsx       # 9. 환자 후기
├── LocalInfoSection.tsx          # 10. 지역 정보
└── CTASection.tsx                # 11. 최종 CTA

/src/components
└── ChatWidget.tsx                # AI 채팅 위젯
```

## Section Details

### 1. HeroSection
- 헤드라인 + 서브헤드라인
- 배경 그라디언트/이미지
- 주요 CTA 버튼
- AI 채팅 미니 프롬프트

### 2. TrustBanner
신뢰 지표 표시:
| 지표 | 값 |
|------|-----|
| JCI Certified Hospitals | 50+ |
| Satisfied Patients | 10,000+ |
| Success Rate | 99.2% |
| Languages Supported | 7 |

### 3. CategoriesSection
13개 의료 카테고리:
- Plastic Surgery, Dermatology, Dental
- Ophthalmology, Hair Restoration, Health Checkup
- Orthopedics, Reproductive, Cardiology
- Oncology, Neurology, Gastroenterology, Wellness

### 4. WhyPlatformSection
플랫폼 장점:
- JCI 인증 병원 네트워크
- 전문 의료 통역사
- 투명한 가격
- 24/7 지원

### 5. FreeInterpreterBanner
프로모션 배너:
- "첫 상담 통역 무료!"
- 기간 한정 이벤트
- CTA 버튼

### 6. PriceComparisonSection
가격 비교 테이블:

| Procedure | Korea | USA | Savings |
|-----------|-------|-----|---------|
| Rhinoplasty | $3,000-5,000 | $8,000-15,000 | 60-70% |
| Dental Implant | $1,000-2,000 | $3,000-5,000 | 60-70% |
| Lasik | $1,500-2,500 | $4,000-6,000 | 60-65% |

### 7. FeaturedHospitalsSection
- 추천 병원 캐러셀
- 병원 카드 (이미지, 이름, 평점, 전문 분야)
- 자동 슬라이드
- "전체 보기" 링크

### 8. HowItWorksSection
5단계 이용 방법:
1. 상담 요청
2. 병원 추천 받기
3. 통역사 매칭
4. 시술 받기
5. 사후 관리

### 9. TestimonialsSection
환자 후기 캐러셀:
- 환자 사진 (마스킹)
- 국적 플래그
- 리뷰 내용
- 평점
- 시술 유형

### 10. LocalInfoSection
한국 여행 정보:
- 추천 음식점
- 숙소 정보
- 공항 픽업 서비스
- 관광 명소

### 11. CTASection
최종 행동 유도:
- 강력한 헤드라인
- 메신저별 CTA 버튼
- 로케일별 최적 플랫폼 표시

## Responsive Design

| Breakpoint | 레이아웃 |
|------------|----------|
| Mobile (<640px) | 싱글 컬럼, 축소된 카드 |
| Tablet (640-1024px) | 2컬럼 그리드 |
| Desktop (>1024px) | 풀 레이아웃, 사이드바 |

## Animation

Framer Motion 사용:
- 스크롤 기반 페이드인
- 호버 효과 (버튼, 카드)
- 캐러셀 슬라이드
- 페이지 전환

## Performance

- 이미지 최적화 (Next.js Image)
- 컴포넌트 레이지 로딩
- CSS-in-JS 최소화
- Core Web Vitals 최적화

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0.0 | Initial landing page |
