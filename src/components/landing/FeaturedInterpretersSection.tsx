'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { Star, Languages, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const interpreters = [
  {
    id: '1',
    name: 'Sarah Kim',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 5.0,
    reviews: 127,
    languages: ['English', 'Korean'],
    specialties: ['Plastic Surgery', 'Dermatology'],
    city: 'Seoul',
    rate: 150,
    available: true,
  },
  {
    id: '2',
    name: 'Yuki Tanaka',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 203,
    languages: ['Japanese', 'Korean', 'English'],
    specialties: ['Dental', 'Ophthalmology'],
    city: 'Seoul',
    rate: 180,
    available: true,
  },
  {
    id: '3',
    name: 'Chen Wei',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    rating: 5.0,
    reviews: 156,
    languages: ['Mandarin', 'Korean', 'English'],
    specialties: ['Health Checkup', 'Orthopedics'],
    city: 'Seoul',
    rate: 160,
    available: false,
  },
];

export function FeaturedInterpretersSection() {
  const t = useTranslations('landing.featuredInterpreters');
  const tCommon = useTranslations('common');

  return (
    <section className="relative overflow-hidden bg-muted/30 py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-primary/5 to-transparent blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col items-center justify-between gap-6 text-center lg:mb-16 lg:flex-row lg:text-left"
        >
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Languages className="h-4 w-4" />
              {t('badge')}
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
              {t('title')}
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <Button size="lg" variant="outline" className="gap-2 rounded-full" asChild>
            <Link href="/interpreters">
              {t('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Interpreters Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {interpreters.map((interpreter, index) => (
            <motion.div
              key={interpreter.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/interpreters/${interpreter.id}`} className="group block h-full">
                <motion.div
                  whileHover={{ y: -8 }}
                  className="h-full overflow-hidden rounded-2xl border bg-background shadow-lg transition-shadow hover:shadow-xl"
                >
                  {/* Image & Availability */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={interpreter.image}
                      alt={interpreter.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    {interpreter.available && (
                      <div className="absolute right-3 top-3">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t('available')}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Name & Rating */}
                    <div className="mb-3">
                      <h3 className="mb-1 text-xl font-semibold">{interpreter.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{interpreter.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({interpreter.reviews} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {interpreter.city}
                    </div>

                    {/* Languages */}
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {t('languages')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {interpreter.languages.map((lang) => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="mb-4 flex flex-wrap gap-1">
                      {interpreter.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Rate */}
                    <div className="flex items-center justify-between border-t pt-4">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          ${interpreter.rate}
                          <span className="text-sm font-normal text-muted-foreground">
                            {t('perDay')}
                          </span>
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
