'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X, Heart, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const t = useTranslations('navigation');
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/hospitals', label: t('hospitals') },
    { href: '/procedures', label: t('procedures') },
    { href: '/interpreters', label: t('interpreters') },
    { href: '/blog', label: t('blog') },
    { href: '/about', label: t('about') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">
            Get<span className="text-primary">Care</span>Korea
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inquiry">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">{t('contact')}</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/login">
              <User className="mr-2 h-4 w-4" />
              {t('signIn')}
            </Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="minimal" />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 pt-6">
                {/* Mobile Logo */}
                <div className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">
                    Get<span className="text-primary">Care</span>Korea
                  </span>
                </div>

                {/* Mobile Nav Items */}
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Actions */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button asChild>
                    <Link href="/inquiry" onClick={() => setIsOpen(false)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t('contact')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      {t('signIn')}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
