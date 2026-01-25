import { getTranslations } from 'next-intl/server';
import { locales } from '@/lib/i18n/config';
import type { Metadata } from 'next';

const baseUrl = 'https://getcarekorea.com';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// SEO Metadata for inquiry page
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inquiry' });

  const title = `${t('title')} - GetCareKorea`;
  const description = t('subtitle');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/inquiry`,
      siteName: 'GetCareKorea',
      images: [{ url: `${baseUrl}/og-inquiry.jpg`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/inquiry`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/inquiry`])
      ),
    },
  };
}

export default function InquiryLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
