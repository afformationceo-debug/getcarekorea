import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { InterpretersTable } from './InterpretersTable';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Type for localized JSONB fields
type LocalizedField = Record<string, string>;

interface AuthorPersona {
  id: string;
  slug: string;
  name: LocalizedField;
  bio_short: LocalizedField;
  bio_full: LocalizedField;
  photo_url: string | null;
  years_of_experience: number;
  target_locales: string[];
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
  certifications: string[];
  is_active: boolean;
  is_verified: boolean;
  is_available: boolean;
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  total_posts: number;
  location: string;
  preferred_messenger: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

async function getInterpreters(): Promise<AuthorPersona[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('author_personas')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching interpreters:', error);
    return [];
  }

  return (data || []) as AuthorPersona[];
}

export default async function InterpretersAdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin.interpreters');
  const interpreters = await getInterpreters();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <InterpretersTable interpreters={interpreters} />
    </div>
  );
}
