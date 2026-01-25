# Multilingual SEO Implementation Guide

> 최종 업데이트: 2026-01-26
> 용도: GetCareKorea 다국어 SEO 구현 가이드

## 1. 지원 언어 (8개 로케일)

```typescript
export const locales = ['en', 'ko', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'] as const;
```

| 로케일 | 언어 | 타겟 시장 | 기본 메신저 |
|--------|------|----------|------------|
| en | English | 글로벌 | WhatsApp |
| ko | 한국어 | 한국 | KakaoTalk |
| zh-TW | 繁體中文 | 대만, 홍콩 | LINE |
| zh-CN | 简体中文 | 중국 | WeChat |
| ja | 日本語 | 일본 | LINE |
| th | ภาษาไทย | 태국 | LINE |
| mn | Монгол | 몽골 | WhatsApp |
| ru | Русский | 러시아, CIS | WhatsApp |

## 2. 핵심 파일 구조

### 번역 파일
```
messages/
├── en.json      # English (기본)
├── ko.json      # Korean
├── zh-TW.json   # Traditional Chinese
├── zh-CN.json   # Simplified Chinese
├── ja.json      # Japanese
├── th.json      # Thai
├── mn.json      # Mongolian
└── ru.json      # Russian
```

### i18n 설정
```
src/lib/i18n/
├── config.ts         # 로케일 설정, CTA 플랫폼 매핑
├── navigation.ts     # next-intl 네비게이션 헬퍼
└── request.ts        # 서버 사이드 i18n 설정
```

## 3. 페이지별 SEO 구현

### 3.1 Server Component 페이지 (권장)

```typescript
// src/app/[locale]/hospitals/page.tsx
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

const baseUrl = 'https://getcarekorea.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('hospitalsTitle'),
    description: t('hospitalsDescription'),
    openGraph: {
      title: t('hospitalsTitle'),
      description: t('hospitalsDescription'),
      url: `${baseUrl}/${locale}/hospitals`,
      locale: locale,
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/hospitals`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/hospitals`])
      ),
    },
  };
}
```

### 3.2 Client Component 페이지 (layout.tsx 활용)

Client Component 페이지는 `layout.tsx`에서 메타데이터 생성:

```typescript
// src/app/[locale]/blog/layout.tsx
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  // ... 메타데이터 반환
}

export default function BlogLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
```

### 3.3 동적 페이지 (병원/블로그 상세)

```typescript
// src/app/[locale]/hospitals/[slug]/page.tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const hospital = await fetchHospital(slug);

  const localeSuffix = locale.replace('-', '_').toLowerCase();
  const name = hospital[`name_${localeSuffix}`] || hospital.name_en;
  const description = hospital[`description_${localeSuffix}`] || hospital.description_en;

  return {
    title: `${name} - GetCareKorea`,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/hospitals/${slug}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/hospitals/${slug}`])
      ),
    },
  };
}
```

## 4. JSON-LD 스키마

### Organization (홈페이지)
```typescript
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${baseUrl}/#organization`,
  name: 'GetCareKorea',
  url: baseUrl,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Korean', 'Japanese', 'Chinese', 'Thai', 'Russian', 'Mongolian'],
  },
};
```

### MedicalOrganization (병원 상세)
```typescript
const hospitalSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: hospital.name,
  description: hospital.description,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'KR',
    addressLocality: hospital.city,
    streetAddress: hospital.address,
  },
  medicalSpecialty: hospital.specialties,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: hospital.avg_rating,
    reviewCount: hospital.review_count,
  },
};
```

### BreadcrumbList
```typescript
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/${locale}` },
    { '@type': 'ListItem', position: 2, name: 'Hospitals', item: `${baseUrl}/${locale}/hospitals` },
    { '@type': 'ListItem', position: 3, name: hospitalName, item: currentUrl },
  ],
};
```

## 5. 번역 키 구조

### 메타 태그 번역
```json
{
  "meta": {
    "homeTitle": "GetCareKorea - Premium Medical Tourism in Korea",
    "homeDescription": "Connect with top-rated Korean hospitals and certified medical interpreters.",
    "hospitalsTitle": "Top Hospitals in Korea - GetCareKorea",
    "hospitalsDescription": "Browse JCI-accredited hospitals and clinics in Korea.",
    "interpretersTitle": "Medical Interpreters in Korea - GetCareKorea",
    "interpretersDescription": "Find certified medical interpreters for your healthcare journey."
  }
}
```

### 컴포넌트 번역
```json
{
  "hospitals": {
    "detail": {
      "phone": "전화번호",
      "website": "웹사이트",
      "address": "주소",
      "whyBookWithUs": "왜 우리와 예약해야 하나요?",
      "freeInterpreter": "무료 통역 서비스"
    }
  }
}
```

## 6. 로케일별 CTA 설정

### config.ts의 localeCTAConfig
```typescript
export const localeCTAConfig: Record<Locale, CTAConfigExtended> = {
  en: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    contactId: '821012345678',
    defaultMessage: 'Hi, I\'m interested in medical tourism services in Korea.',
  },
  ko: {
    platform: 'kakao',
    displayName: 'KakaoTalk',
    contactId: 'getcarekorea',
    defaultMessage: '안녕하세요, 한국 의료관광 서비스에 관심이 있습니다.',
  },
  // ... 기타 로케일
};
```

### MessengerCTA 컴포넌트 사용
```typescript
import { localeCTAConfig, type Locale } from '@/lib/i18n/config';

const locale = useLocale() as Locale;
const config = localeCTAConfig[locale];
// config.platform, config.defaultMessage 사용
```

## 7. 사이트맵 & robots.txt

### sitemap.ts
```typescript
// IMPORTANT: Always use production URL for sitemap
const baseUrl = 'https://getcarekorea.com';

// 각 로케일별 URL 생성
for (const locale of locales) {
  urls.push({
    url: `${baseUrl}/${locale}/hospitals`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  });
}
```

### robots.ts
```typescript
const baseUrl = 'https://getcarekorea.com';

return {
  rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] }],
  sitemap: `${baseUrl}/sitemap.xml`,
};
```

## 8. 블로그 다국어 처리

### 중요: 블로그는 특정 언어에만 발행됨

```typescript
// API에서 locale 필터링
const { data: posts } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('locale', locale)  // 해당 로케일 포스트만
  .eq('status', 'published');
```

사이트맵에는 해당 로케일 포스트만 포함:
```typescript
// 블로그는 alternate 없이 해당 locale URL만
urls.push({
  url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
  lastModified: post.updated_at,
});
```

## 9. 체크리스트

### 새 페이지 추가 시
- [ ] `generateMetadata()` 추가 (Server Component) 또는 `layout.tsx` 생성 (Client Component)
- [ ] `meta` 네임스페이스에 번역 키 추가 (8개 언어)
- [ ] `alternates.languages`에 8개 로케일 URL 포함
- [ ] JSON-LD 스키마 추가 (해당되는 경우)
- [ ] sitemap.ts에 URL 추가

### 번역 품질 체크
- [ ] 단순 번역이 아닌 SEO 최적화된 문구 사용
- [ ] 해당 언어권의 검색 키워드 반영
- [ ] 문화적 차이 고려 (예: 중국어 간체/번체 구분)

### 기술 검증
- [ ] Google Search Console에서 hreflang 오류 확인
- [ ] 모든 alternate URL이 200 응답 반환
- [ ] Open Graph 미리보기 확인
- [ ] 구조화된 데이터 테스트 (Rich Results Test)

## 10. 주의사항

### ❌ 피해야 할 사항
1. 환경 변수로 baseUrl 설정 (빌드 시점에 localhost로 설정될 수 있음)
2. 하드코딩된 영어 텍스트 (반드시 useTranslations 사용)
3. 일부 로케일만 alternate에 포함
4. 블로그 포스트에 잘못된 로케일 alternate 추가

### ✅ 권장 사항
1. baseUrl은 항상 하드코딩: `const baseUrl = 'https://getcarekorea.com'`
2. 모든 UI 텍스트는 messages/*.json에서 관리
3. 8개 로케일 모두 alternate에 포함
4. 로케일별 CTA 플랫폼 자동 선택

---

## 관련 파일

- `/src/lib/i18n/config.ts` - 로케일 설정
- `/src/app/sitemap.ts` - 사이트맵 생성
- `/src/app/robots.ts` - robots.txt 설정
- `/messages/*.json` - 번역 파일
- `/docs/google-seo-guide.md` - SEO 가이드
