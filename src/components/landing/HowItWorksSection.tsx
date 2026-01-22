'use client';

import { motion } from 'framer-motion';
import {
  MessageCircle,
  CalendarCheck,
  Plane,
  Stethoscope,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MessageCircle,
    title: 'AI Consultation',
    description: 'Chat with our AI assistant to understand your needs and get personalized recommendations',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Book & Plan',
    description: 'Select your hospital, schedule appointments, and arrange interpreter services',
    color: 'from-purple-500 to-pink-500',
  },
  {
    number: '03',
    icon: Plane,
    title: 'Arrive in Korea',
    description: 'Enjoy complimentary airport pickup and settle into your accommodation',
    color: 'from-amber-500 to-orange-500',
  },
  {
    number: '04',
    icon: Stethoscope,
    title: 'Treatment',
    description: 'Receive world-class medical care with your personal interpreter by your side',
    color: 'from-green-500 to-emerald-500',
  },
  {
    number: '05',
    icon: HeartHandshake,
    title: 'Recovery & Support',
    description: '24/7 post-procedure care, follow-up appointments, and safe return home',
    color: 'from-rose-500 to-red-500',
  },
];

export function HowItWorksSection() {
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
            Simple Process
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            Your Journey to Korea
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From initial consultation to successful recovery - we&apos;re with you every step of the way
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
                    Step {step.number}
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
