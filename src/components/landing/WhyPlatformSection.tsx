'use client';

import { motion } from 'framer-motion';
import {
  Check,
  X,
  Languages,
  Shield,
  Headphones,
  Wallet,
  Calendar,
  MessageCircle,
  Car,
  Hotel,
} from 'lucide-react';

const comparisonData = [
  {
    feature: 'Professional Medical Interpreter',
    platform: true,
    direct: false,
    highlight: true,
  },
  {
    feature: 'Best Price Guarantee',
    platform: true,
    direct: false,
    highlight: true,
  },
  {
    feature: '24/7 Multilingual Support',
    platform: true,
    direct: false,
  },
  {
    feature: 'Airport Pickup Service',
    platform: true,
    direct: false,
  },
  {
    feature: 'Accommodation Arrangement',
    platform: true,
    direct: false,
  },
  {
    feature: 'Post-Procedure Follow-up',
    platform: true,
    direct: false,
  },
  {
    feature: 'Verified Hospital Reviews',
    platform: true,
    direct: false,
  },
  {
    feature: 'Communication Barrier',
    platform: false,
    direct: true,
    negative: true,
  },
];

const benefits = [
  {
    icon: Languages,
    title: 'Free Interpreter',
    description: 'Professional medical interpreter at no extra cost',
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-950',
  },
  {
    icon: Shield,
    title: '100% Verified',
    description: 'All hospitals are JCI accredited and verified',
    color: 'text-green-500 bg-green-100 dark:bg-green-950',
  },
  {
    icon: Wallet,
    title: 'Best Price',
    description: 'Price match guarantee + additional 10% off',
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-950',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock assistance in your language',
    color: 'text-purple-500 bg-purple-100 dark:bg-purple-950',
  },
  {
    icon: Car,
    title: 'Airport Pickup',
    description: 'Complimentary pickup and drop-off service',
    color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-950',
  },
  {
    icon: Hotel,
    title: 'Accommodation',
    description: 'Curated recovery-friendly hotel recommendations',
    color: 'text-rose-500 bg-rose-100 dark:bg-rose-950',
  },
];

export function WhyPlatformSection() {
  return (
    <section className="relative overflow-hidden bg-muted/30 py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Why Choose Us
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            Platform vs Direct Booking
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            See why thousands of patients choose GetCareKorea over booking directly with hospitals
          </p>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border bg-background shadow-xl"
          >
            {/* Table Header */}
            <div className="grid grid-cols-3 border-b bg-muted/50 p-4">
              <div className="font-semibold">Feature</div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
                  GetCareKorea
                </span>
              </div>
              <div className="text-center text-muted-foreground">
                <span className="text-sm font-medium">Direct</span>
              </div>
            </div>

            {/* Table Body */}
            {comparisonData.map((row, index) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-3 items-center border-b p-4 last:border-b-0 ${
                  row.highlight ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`text-sm ${row.highlight ? 'font-semibold' : ''}`}>
                  {row.feature}
                </div>
                <div className="flex justify-center">
                  {row.platform ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.05, type: 'spring' }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950"
                    >
                      <Check className="h-5 w-5 text-green-600" />
                    </motion.div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {row.direct ? (
                    row.negative ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                        <X className="h-5 w-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    )
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
                      <X className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group rounded-2xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${benefit.color}`}>
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-1 font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
