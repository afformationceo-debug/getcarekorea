'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  MessageCircle,
  CalendarCheck,
  Plane,
  Stethoscope,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';

const stepIcons = [MessageCircle, CalendarCheck, Plane, Stethoscope, HeartHandshake];
const stepColors = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-red-500',
];

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  const steps = [
    { number: '01', icon: stepIcons[0], title: t('steps.consultation.title'), description: t('steps.consultation.description'), color: stepColors[0] },
    { number: '02', icon: stepIcons[1], title: t('steps.matching.title'), description: t('steps.matching.description'), color: stepColors[1] },
    { number: '03', icon: stepIcons[2], title: t('steps.travel.title'), description: t('steps.travel.description'), color: stepColors[2] },
    { number: '04', icon: stepIcons[3], title: t('steps.treatment.title'), description: t('steps.treatment.description'), color: stepColors[3] },
    { number: '05', icon: stepIcons[4], title: t('steps.recovery.title'), description: t('steps.recovery.description'), color: stepColors[4] },
  ];
  return (
    <section className="relative py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/5 to-blue-500/5 blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {t('badge')}
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 opacity-20 lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative h-full rounded-2xl border bg-background p-6 shadow-lg transition-shadow hover:shadow-xl"
                >
                  {/* Step number */}
                  <div className="absolute -top-3 left-4 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    {t('stepLabel', { number: step.number })}
                  </div>

                  {/* Icon */}
                  <div
                    className={`mb-4 mt-2 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}
                  >
                    <step.icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>

                  {/* Arrow to next step (not on last) */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md"
                      >
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
