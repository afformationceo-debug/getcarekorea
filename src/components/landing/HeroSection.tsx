'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  Globe2,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { MessengerCTA } from '@/components/cta/MessengerCTA';

export function HeroSection() {
  const t = useTranslations('hero');
  const tLanding = useTranslations('landing');

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-blue-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-green-500/20 to-transparent blur-3xl"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="container relative py-12 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' as const }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge
                variant="secondary"
                className="gap-2 rounded-full px-4 py-2 text-sm font-medium"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                {tLanding('hero.badge')}
              </Badge>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl xl:text-7xl"
              >
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                  {t('title')}
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground md:text-xl lg:pr-12"
              >
                {t('subtitle')}
              </motion.p>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
            >
              {[
                { value: '10K+', label: tLanding('hero.stats.patients'), icon: Star },
                { value: '200+', label: tLanding('hero.stats.hospitals'), icon: Stethoscope },
                { value: '500+', label: tLanding('hero.stats.interpreters'), icon: Globe2 },
                { value: '100%', label: tLanding('hero.stats.jciCertified'), icon: Shield },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="rounded-2xl border bg-background/60 backdrop-blur-sm p-4 text-center"
                >
                  <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 rounded-full px-8 shadow-lg shadow-primary/30" asChild>
                  <Link href="/inquiry">
                    {tLanding('hero.getConsultation')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                  <Link href="/hospitals">{tLanding('hero.browseHospitals')}</Link>
                </Button>
              </div>

              {/* Messenger CTA */}
              <MessengerCTA variant="inline" size="lg" />
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>{tLanding('hero.trustBadges.safe')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{tLanding('hero.trustBadges.rating')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-blue-500" />
                <span>{tLanding('hero.trustBadges.languages')}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - AI Chat */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glow effect behind chat */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-blue-500/20 to-green-500/20 blur-2xl" />

            {/* Chat widget */}
            <div className="relative">
              <ChatWidget variant="embedded" className="shadow-2xl shadow-primary/10" />

              {/* Floating badges around chat */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-4 top-1/4 hidden rounded-xl border bg-background p-3 shadow-lg lg:block"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{tLanding('hero.floatingBadges.freeInterpreter')}</p>
                    <p className="text-[10px] text-muted-foreground">{tLanding('hero.floatingBadges.limitedEvent')}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -right-4 bottom-1/4 hidden rounded-xl border bg-background p-3 shadow-lg lg:block"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{tLanding('hero.floatingBadges.bestPrice')}</p>
                    <p className="text-[10px] text-muted-foreground">{tLanding('hero.floatingBadges.guaranteed')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
