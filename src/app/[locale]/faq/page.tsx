'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronDown, Search, HelpCircle, MessageCircle, FileQuestion } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/navigation';

const faqCategories = [
  { key: 'general', icon: HelpCircle, color: 'from-blue-500 to-cyan-500' },
  { key: 'booking', icon: FileQuestion, color: 'from-violet-500 to-purple-500' },
  { key: 'payment', icon: MessageCircle, color: 'from-amber-500 to-orange-500' },
];

export default function FAQPage() {
  const t = useTranslations('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get FAQ items from translations
  const faqItems = useMemo(() => {
    const items: Array<{ question: string; answer: string; category: string }> = [];

    faqCategories.forEach((cat) => {
      // Load FAQ items - only items 1-3 exist in translations
      for (let i = 1; i <= 3; i++) {
        try {
          const question = t.raw(`categories.${cat.key}.items.${i}.question`) as string;
          const answer = t.raw(`categories.${cat.key}.items.${i}.answer`) as string;
          if (question && answer) {
            items.push({ question, answer, category: cat.key });
          }
        } catch {
          // Translation not found, skip
        }
      }
    });

    return items;
  }, [t]);

  // Filter FAQ items based on search and category
  const filteredItems = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesSearch = searchQuery
        ? item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = selectedCategory
        ? item.category === selectedCategory
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [faqItems, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-16 lg:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 bg-violet-500">{t('hero.badge')}</Badge>
            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="mb-8 text-lg text-white/70">
              {t('hero.subtitle')}
            </p>

            {/* Search */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="container py-8">
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            {t('categories.all')}
          </Button>
          {faqCategories.map((cat) => (
            <Button
              key={cat.key}
              variant={selectedCategory === cat.key ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.key)}
              className="rounded-full"
            >
              <cat.icon className="mr-2 h-4 w-4" />
              {t(`categories.${cat.key}.title`)}
            </Button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="container pb-16">
        <div className="mx-auto max-w-3xl">
          {filteredItems.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="rounded-xl border bg-card px-6 shadow-sm"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t('noResults')}</p>
                <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
                  {t('clearFilters')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-muted/30 py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="mb-4 text-2xl font-bold lg:text-3xl">{t('cta.title')}</h2>
            <p className="mb-6 text-muted-foreground">{t('cta.subtitle')}</p>
            <Button size="lg" asChild>
              <Link href="/contact">
                <MessageCircle className="mr-2 h-5 w-5" />
                {t('cta.button')}
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
