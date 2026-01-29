import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KeywordFormPage } from '../KeywordFormPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewKeywordPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/keywords`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Keyword</h1>
          <p className="text-muted-foreground text-sm">Create a new keyword for content generation</p>
        </div>
      </div>

      <KeywordFormPage />
    </div>
  );
}
