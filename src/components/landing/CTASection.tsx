'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Sparkles, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  const t = useTranslations('inquiry');

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-violet-700" />

          {/* Animated background elements */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10"
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Content */}
          <div className="relative px-8 py-16 text-center text-white lg:px-16 lg:py-24">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-medium backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              Start Your Journey Today
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl"
            >
              {t('title')}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-8 max-w-2xl text-lg text-white/90"
            >
              {t('subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mb-10 flex flex-wrap justify-center gap-4"
            >
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 rounded-full px-8 py-6 text-lg shadow-xl"
                asChild
              >
                <Link href="/inquiry">
                  Get Free Consultation
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-full border-white/30 bg-white/10 px-8 py-6 text-lg text-white hover:bg-white/20"
                asChild
              >
                <Link href="/hospitals">
                  <MessageCircle className="h-5 w-5" />
                  Chat with AI
                </Link>
              </Button>
            </motion.div>

            {/* Contact options */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70"
            >
              <a
                href="tel:+821234567890"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4" />
                +82-2-XXX-XXXX
              </a>
              <div className="hidden h-4 w-px bg-white/30 sm:block" />
              <a
                href="mailto:support@getcarekorea.com"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4" />
                support@getcarekorea.com
              </a>
              <div className="hidden h-4 w-px bg-white/30 sm:block" />
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                24/7 Support Available
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
