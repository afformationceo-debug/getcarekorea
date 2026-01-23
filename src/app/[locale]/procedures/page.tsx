import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ProceduresPageClient } from './ProceduresPageClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProceduresPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createAdminClient();
  const localeSuffix = locale.replace('-', '_').toLowerCase();

  // Fetch procedures from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proceduresData } = await (supabase.from('procedures') as any)
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('popularity_score', { ascending: false });

  const procedures = (proceduresData || []).map((proc: Record<string, unknown>) => ({
    id: proc.slug,
    slug: proc.slug,
    category: proc.category,
    name: (proc[`name_${localeSuffix}`] || proc.name_en) as string,
    description: (proc[`short_description_${localeSuffix}`] || proc[`description_${localeSuffix}`] || proc.description_en) as string,
    image: proc.image_url as string | null,
    priceRange: proc.price_range_usd as string | null,
    recovery: (proc.recovery_time || proc.recovery_days) as string | null,
    popularity: proc.popularity_score as number,
    durationMinutes: proc.duration_minutes as number | null,
  }));

  // If no data in DB, use fallback data
  const finalProcedures = procedures.length > 0 ? procedures : getFallbackProcedures();

  return (
    <Suspense fallback={<ProceduresPageSkeleton />}>
      <ProceduresPageClient procedures={finalProcedures} locale={locale as Locale} />
    </Suspense>
  );
}

function ProceduresPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-12">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Fallback data if DB is empty
function getFallbackProcedures() {
  return [
    {
      id: 'plastic-surgery',
      slug: 'plastic-surgery',
      category: 'plastic-surgery',
      name: 'Plastic Surgery',
      description: 'Transform your appearance with world-renowned Korean plastic surgery techniques.',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
      priceRange: '$2,000 - $15,000',
      recovery: '1-4 weeks',
      popularity: 98,
      durationMinutes: 180,
    },
    {
      id: 'dermatology',
      slug: 'dermatology',
      category: 'dermatology',
      name: 'Dermatology',
      description: 'Advanced skin treatments and rejuvenation procedures.',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      priceRange: '$200 - $5,000',
      recovery: '0-7 days',
      popularity: 92,
      durationMinutes: 60,
    },
    {
      id: 'dental',
      slug: 'dental',
      category: 'dental',
      name: 'Dental Care',
      description: 'Comprehensive dental services from implants to cosmetic dentistry.',
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800',
      priceRange: '$500 - $8,000',
      recovery: '1-14 days',
      popularity: 88,
      durationMinutes: 120,
    },
    {
      id: 'ophthalmology',
      slug: 'ophthalmology',
      category: 'ophthalmology',
      name: 'Eye Care',
      description: 'Vision correction and eye health treatments.',
      image: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800',
      priceRange: '$1,500 - $6,000',
      recovery: '1-3 days',
      popularity: 85,
      durationMinutes: 30,
    },
    {
      id: 'hair-transplant',
      slug: 'hair-transplant',
      category: 'hair-transplant',
      name: 'Hair Transplant',
      description: 'Natural-looking hair restoration using advanced techniques.',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
      priceRange: '$3,000 - $10,000',
      recovery: '7-14 days',
      popularity: 82,
      durationMinutes: 360,
    },
    {
      id: 'health-checkup',
      slug: 'health-checkup',
      category: 'health-checkup',
      name: 'Health Checkup',
      description: 'Comprehensive health screening and preventive care.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
      priceRange: '$500 - $3,000',
      recovery: 'Same day',
      popularity: 90,
      durationMinutes: 240,
    },
    {
      id: 'fertility',
      slug: 'fertility',
      category: 'fertility',
      name: 'Fertility',
      description: 'Advanced fertility treatments and IVF procedures.',
      image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
      priceRange: '$5,000 - $20,000',
      recovery: 'Varies',
      popularity: 78,
      durationMinutes: null,
    },
    {
      id: 'orthopedics',
      slug: 'orthopedics',
      category: 'orthopedics',
      name: 'Orthopedics',
      description: 'Joint replacement and musculoskeletal treatments.',
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
      priceRange: '$8,000 - $25,000',
      recovery: '4-12 weeks',
      popularity: 75,
      durationMinutes: 180,
    },
  ];
}
