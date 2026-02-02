'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function InquirySuccessPage() {
  const t = useTranslations('inquiry');

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-green-900 to-background py-20">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-500/30 to-green-600/20 blur-3xl"
          />
        </div>

        <div className="container relative z-10 py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="mx-auto max-w-md text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-2xl shadow-emerald-500/50"
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>
            <h1 className="mb-4 text-3xl font-bold text-white">{t('success.title')}</h1>
            <p className="mb-8 text-white/70">{t('success.message')}</p>
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-white text-emerald-700 hover:bg-white/90 font-semibold"
                asChild
              >
                <a href="/">{t('success.backHome')}</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
