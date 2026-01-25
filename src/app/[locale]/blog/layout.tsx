import { getTranslations } from 'next-intl/server';
import { locales } from '@/lib/i18n/config';
import type { Metadata } from 'next';

const baseUrl = 'https://getcarekorea.com';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// SEO Metadata for blog listing page
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  const title = `${t('title')} - GetCareKorea`;
  const description = t('subtitle');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/blog`,
      siteName: 'GetCareKorea',
      images: [{ url: `${baseUrl}/og-blog.jpg`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/blog`])
      ),
    },
  };
}

export default function BlogLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
