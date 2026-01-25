'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  Scissors,
  Sparkles as SparklesIcon,
  Smile,
  Eye,
  Heart,
  Activity,
  Baby,
  Scale,
  HeartPulse,
  Leaf,
  Stethoscope,
  Syringe,
} from 'lucide-react';

const categories = [
  {
    key: 'plasticSurgery',
    icon: Scissors,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    popular: true,
  },
  {
    key: 'dermatology',
    icon: SparklesIcon,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    popular: true,
  },
  {
    key: 'dental',
    icon: Smile,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    popular: true,
  },
  {
    key: 'ophthalmology',
    icon: Eye,
    color: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  {
    key: 'hairTransplant',
    icon: Syringe,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    popular: true,
  },
  {
    key: 'healthCheckup',
    icon: Stethoscope,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    key: 'orthopedics',
    icon: Activity,
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    key: 'fertility',
    icon: Baby,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    key: 'weightLoss',
    icon: Scale,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    key: 'cardiology',
    icon: HeartPulse,
    color: 'from-red-600 to-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    key: 'oncology',
    icon: Heart,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  {
    key: 'traditionalMedicine',
    icon: Leaf,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function CategoriesSection() {
  const t = useTranslations('categories');

  return (
    <section className="relative py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/5 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-gradient-to-l from-blue-500/5 to-transparent blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center lg:mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
          >
            Medical Specialties
          </motion.span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.key} variants={item}>
                <Link
                  href={`/procedures/${category.key}`}
                  className="group relative block"
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden rounded-2xl border ${category.bgColor} p-6 transition-all duration-300`}
                  >
                    {/* Popular badge */}
                    {category.popular && (
                      <div className="absolute -right-8 top-3 rotate-45 bg-primary px-8 py-0.5 text-[10px] font-semibold text-white">
                        Popular
                      </div>
                    )}

                    {/* Icon with gradient */}
                    <div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {t(category.key)}
                    </h3>

                    {/* Hover effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className={`absolute inset-0 -z-10 bg-gradient-to-br ${category.color} opacity-0 transition-opacity`}
                      style={{ opacity: 0.05 }}
                    />

                    {/* Arrow indicator on hover */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="absolute bottom-4 right-4 text-primary"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </motion.div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
