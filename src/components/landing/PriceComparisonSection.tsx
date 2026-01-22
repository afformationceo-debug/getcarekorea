'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { TrendingDown, DollarSign, BadgePercent, Info } from 'lucide-react';

const procedures = [
  {
    name: 'Rhinoplasty',
    korea: { min: 2500, max: 5000 },
    usa: { min: 8000, max: 15000 },
    emoji: '👃',
  },
  {
    name: 'Double Eyelid Surgery',
    korea: { min: 1500, max: 3000 },
    usa: { min: 4000, max: 8000 },
    emoji: '👁️',
  },
  {
    name: 'Dental Implant (per tooth)',
    korea: { min: 1200, max: 2000 },
    usa: { min: 3000, max: 6000 },
    emoji: '🦷',
  },
  {
    name: 'LASIK (both eyes)',
    korea: { min: 1500, max: 2500 },
    usa: { min: 4000, max: 6000 },
    emoji: '👓',
  },
  {
    name: 'Facelift',
    korea: { min: 5000, max: 10000 },
    usa: { min: 15000, max: 30000 },
    emoji: '✨',
  },
  {
    name: 'Hair Transplant (2000 grafts)',
    korea: { min: 3000, max: 5000 },
    usa: { min: 8000, max: 15000 },
    emoji: '💇',
  },
  {
    name: 'Comprehensive Health Checkup',
    korea: { min: 500, max: 1500 },
    usa: { min: 2000, max: 5000 },
    emoji: '🏥',
  },
];

function calculateSavings(korea: { min: number; max: number }, usa: { min: number; max: number }) {
  const koreaAvg = (korea.min + korea.max) / 2;
  const usaAvg = (usa.min + usa.max) / 2;
  return Math.round(((usaAvg - koreaAvg) / usaAvg) * 100);
}

function formatPrice(min: number, max: number) {
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}

export function PriceComparisonSection() {
  const t = useTranslations('pricing');

  return (
    <section className="relative py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/50 to-transparent dark:via-green-950/20" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
            <TrendingDown className="h-4 w-4" />
            Save Up To 70%
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Price Comparison Cards */}
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 p-4 md:p-6">
              <div className="col-span-1 font-semibold">Procedure</div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white">
                  🇰🇷 Korea
                </div>
              </div>
              <div className="text-center text-muted-foreground">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">
                  🇺🇸 USA
                </div>
              </div>
              <div className="text-center font-semibold text-green-600">Savings</div>
            </div>

            {/* Body */}
            <div className="divide-y">
              {procedures.map((procedure, index) => {
                const savings = calculateSavings(procedure.korea, procedure.usa);
                return (
                  <motion.div
                    key={procedure.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="grid grid-cols-4 items-center gap-4 p-4 transition-colors hover:bg-muted/30 md:p-6"
                  >
                    {/* Procedure */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{procedure.emoji}</span>
                      <span className="font-medium text-sm md:text-base">{procedure.name}</span>
                    </div>

                    {/* Korea Price */}
                    <div className="text-center">
                      <motion.span
                        initial={{ scale: 0.9 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary text-sm md:text-base"
                      >
                        {formatPrice(procedure.korea.min, procedure.korea.max)}
                      </motion.span>
                    </div>

                    {/* USA Price */}
                    <div className="text-center">
                      <span className="text-muted-foreground line-through text-sm md:text-base">
                        {formatPrice(procedure.usa.min, procedure.usa.max)}
                      </span>
                    </div>

                    {/* Savings */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + index * 0.05, type: 'spring' }}
                        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-sm font-bold text-green-700 dark:bg-green-950 dark:text-green-400"
                      >
                        <BadgePercent className="h-4 w-4" />
                        {savings}%
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 flex items-start gap-2 text-center text-sm text-muted-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t('disclaimer')}</p>
          </motion.div>

          {/* Bottom Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-6 text-center text-white md:p-8"
          >
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold">Best Price Guarantee</p>
                  <p className="text-sm text-white/80">We match any lower price + 10% off</p>
                </div>
              </div>
              <div className="hidden h-12 w-px bg-white/20 md:block" />
              <p className="text-sm md:text-base">
                Found a better price elsewhere? We&apos;ll beat it by <span className="font-bold">10%</span>!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
