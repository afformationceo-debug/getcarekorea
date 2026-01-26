'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Languages, Sparkles, ArrowRight, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FreeInterpreterBanner() {
  const t = useTranslations('landing.freeInterpreter');
  return (
    <section className="relative py-12 overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-violet-600" />

          {/* Animated background shapes */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/10"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute -left-10 -bottom-10 h-60 w-60 rounded-full border border-white/10"
          />

          {/* Sparkle effects */}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-1/4 top-6"
          >
            <Sparkles className="h-6 w-6 text-yellow-300" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            className="absolute right-1/3 bottom-8"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
          </motion.div>

          {/* Content */}
          <div className="relative px-8 py-12 md:px-12 lg:px-16">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
              {/* Left content */}
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  <Gift className="h-4 w-4" />
                  {t('badge')}
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="ml-1 h-2 w-2 rounded-full bg-red-400"
                  />
                </motion.div>

                <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                  {t('title')}
                </h2>
                <p className="mb-2 text-lg text-white/90 md:text-xl">
                  {t('subtitle')}{' '}
                  <span className="font-bold text-yellow-300">{t('noExtraCost')}</span>
                </p>
                <p className="text-sm text-white/70">
                  {t('description')}
                </p>

                {/* Features */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 lg:justify-start">
                  {[
                    { icon: Languages, text: t('features.languages') },
                    { icon: Clock, text: t('features.support') },
                    { icon: Sparkles, text: t('features.medical') },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm"
                    >
                      <feature.icon className="h-4 w-4" />
                      {feature.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-3"
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
                  asChild
                >
                  <Link href="/interpreters">
                    {t('cta')}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-white/60">*{t('disclaimer')}</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
