'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale from pathname and add new locale
    const segments = pathname.split('/');
    const currentLocaleIndex = locales.findIndex((l) => segments[1] === l);

    if (currentLocaleIndex !== -1) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join('/') || '/';
    router.push(newPath);
  };

  if (variant === 'minimal') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Globe className="h-4 w-4" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((l) => (
            <DropdownMenuItem
              key={l}
              onClick={() => handleLocaleChange(l)}
              className={locale === l ? 'bg-accent' : ''}
            >
              <span className="mr-2">{localeFlags[l]}</span>
              {localeNames[l]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span>{localeFlags[locale]}</span>
          <span className="hidden sm:inline">{localeNames[locale]}</span>
          <Globe className="h-4 w-4 sm:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={locale === l ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeFlags[l]}</span>
            <span className="flex-1">{localeNames[l]}</span>
            {locale === l && (
              <span className="text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
