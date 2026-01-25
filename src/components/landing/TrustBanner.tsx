'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck,
  Star,
  Users,
  Building2,
  Languages,
  Clock,
} from 'lucide-react';

export function TrustBanner() {
  const t = useTranslations('landing.trust');

  const trustItems = [
    { icon: ShieldCheck, label: t('jciAccredited') },
    { icon: Star, label: t('avgRating') },
    { icon: Users, label: t('patientsServed') },
    { icon: Building2, label: t('partnerHospitals') },
    { icon: Languages, label: t('languagesSupported') },
    { icon: Clock, label: t('support247') },
  ];

  return (
    <section className="relative overflow-hidden border-y bg-muted/30 py-6">
      {/* Animated gradient line */}
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
      />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:gap-x-12"
        >
          {trustItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
