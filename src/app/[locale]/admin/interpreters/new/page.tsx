import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterpreterFormPage } from '../InterpreterFormPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewInterpreterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin.interpreters');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/interpreters`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('addInterpreter')}</h1>
          <p className="text-muted-foreground text-sm">{t('createNew')}</p>
        </div>
      </div>

      <InterpreterFormPage />
    </div>
  );
}
