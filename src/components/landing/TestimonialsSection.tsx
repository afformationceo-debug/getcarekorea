'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    country: 'United States',
    flag: '🇺🇸',
    procedure: 'Rhinoplasty',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    text: "GetCareKorea made my entire journey seamless. The interpreter was amazing and the hospital exceeded my expectations. I saved over $10,000 compared to prices back home!",
    highlight: 'Saved over $10,000',
  },
  {
    id: 2,
    name: 'Chen Wei',
    country: 'Taiwan',
    flag: '🇹🇼',
    procedure: 'Double Eyelid Surgery',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    text: "The Chinese-speaking interpreter made everything so comfortable. From airport pickup to post-surgery care, everything was perfectly organized. Highly recommend!",
    highlight: 'Perfect communication',
  },
  {
    id: 3,
    name: 'Yuki T.',
    country: 'Japan',
    flag: '🇯🇵',
    procedure: 'Dental Implants',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    text: "日本語通訳が同行してくれたので、医師との相談も安心でした。アフターケアも完璧で、本当に満足しています。",
    highlight: 'Complete satisfaction',
  },
  {
    id: 4,
    name: 'Anna K.',
    country: 'Russia',
    flag: '🇷🇺',
    procedure: 'Health Checkup',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    text: "Comprehensive health checkup at a fraction of the cost. The Russian interpreter was professional and the clinic was world-class. Planning to come back next year!",
    highlight: 'World-class facilities',
  },
];

export function TestimonialsSection() {
  const tLanding = useTranslations('landing.testimonials');
  return (
    <section className="relative overflow-hidden bg-muted/30 py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {tLanding('badge')}
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
            {tLanding('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {tLanding('subtitle')}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-wrap justify-center gap-8 lg:gap-16"
        >
          {[
            { value: '10,000+', label: tLanding('stats.patients') },
            { value: '4.9/5', label: tLanding('stats.rating') },
            { value: '50+', label: tLanding('stats.countries') },
            { value: '98%', label: tLanding('stats.satisfaction') },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-primary lg:text-4xl">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                className="relative h-full rounded-2xl border bg-background p-6 shadow-lg"
              >
                {/* Quote icon */}
                <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" />

                {/* Header */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <span>{testimonial.flag}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.procedure} • {testimonial.country}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="mb-4 text-muted-foreground">&quot;{testimonial.text}&quot;</p>

                {/* Highlight */}
                <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                  ✓ {testimonial.highlight}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
