import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAdminClient } from '@/lib/supabase/server';
import { InterpreterFormPage } from '../InterpreterFormPage';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

type LocalizedField = Record<string, string>;

interface AuthorPersona {
  id: string;
  slug: string;
  name: LocalizedField;
  bio_short: LocalizedField;
  bio_full: LocalizedField;
  photo_url: string | null;
  years_of_experience: number;
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
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

async function getInterpreter(id: string): Promise<AuthorPersona | null> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('author_personas')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AuthorPersona;
}

// Get localized name with English fallback
function getDisplayName(name: LocalizedField | undefined, locale: string): string {
  if (!name) return 'No name';
  return name[locale] || name.en || Object.values(name).find(v => v) || 'No name';
}

export default async function InterpreterDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin.interpreters');
  const interpreter = await getInterpreter(id);

  if (!interpreter) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/interpreters`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('editInterpreter')}</h1>
          <p className="text-muted-foreground text-sm">
            {getDisplayName(interpreter.name, locale)} · /{interpreter.slug}
          </p>
        </div>
      </div>

      <InterpreterFormPage interpreter={interpreter} />
    </div>
  );
}
