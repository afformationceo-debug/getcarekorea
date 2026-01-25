'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Google Analytics 4 (GA4) Component
 *
 * 환경 변수: NEXT_PUBLIC_GA_MEASUREMENT_ID
 *
 * 설정 방법:
 * 1. Google Analytics 4 계정 생성
 * 2. 데이터 스트림 생성 (웹)
 * 3. Measurement ID 복사 (G-XXXXXXXXXX 형식)
 * 4. .env.local에 추가: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 */
export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics - Global Site Tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="beforeInteractive"
      />
      <Script id="google-analytics" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

/**
 * 이벤트 전송 유틸리티 함수
 *
 * 사용 예시:
 * - sendGAEvent('button_click', { button_name: 'contact_us' })
 * - sendGAEvent('form_submit', { form_name: 'inquiry' })
 * - sendGAEvent('content_view', { content_id: 'blog-123' })
 */
export function sendGAEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
    (window as unknown as { gtag: Function }).gtag('event', eventName, parameters);
  }
}

/**
 * 페이지뷰 전송 (SPA 라우팅용)
 */
export function sendGAPageView(url: string) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
    (window as unknown as { gtag: Function }).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

/**
 * 전환 이벤트 전송
 *
 * 사용 예시:
 * - sendGAConversion('inquiry_submit')
 * - sendGAConversion('consultation_request', 100)
 */
export function sendGAConversion(conversionId: string, value?: number) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
    (window as unknown as { gtag: Function }).gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: 'USD',
    });
  }
}
