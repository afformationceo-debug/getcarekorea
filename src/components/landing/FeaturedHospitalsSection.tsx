'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { Star, MapPin, Languages, Shield, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const hospitals = [
  {
    id: '1',
    slug: 'grand-plastic-surgery',
    name: 'Grand Plastic Surgery',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    rating: 4.9,
    reviews: 1250,
    specialties: ['Plastic Surgery', 'Dermatology'],
    city: 'Gangnam, Seoul',
    languages: ['EN', 'ZH', 'JA'],
    badges: ['JCI', 'Featured'],
    description: 'Premium plastic surgery clinic with 20+ years experience',
  },
  {
    id: '2',
    slug: 'seoul-wellness-clinic',
    name: 'Seoul Wellness Clinic',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=600&fit=crop',
    rating: 4.8,
    reviews: 890,
    specialties: ['Health Checkup', 'Internal Medicine'],
    city: 'Myeongdong, Seoul',
    languages: ['EN', 'ZH', 'JA', 'RU'],
    badges: ['JCI', 'Popular'],
    description: 'Comprehensive health screening with advanced diagnostics',
  },
  {
    id: '3',
    slug: 'smile-dental-korea',
    name: 'Smile Dental Korea',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
    rating: 4.9,
    reviews: 2100,
    specialties: ['Dental', 'Orthodontics'],
    city: 'Gangnam, Seoul',
    languages: ['EN', 'ZH', 'JA', 'TH'],
    badges: ['Top Rated'],
    description: 'Award-winning dental care with latest technology',
  },
];

export function FeaturedHospitalsSection() {
  const t = useTranslations('landing.featuredHospitals');
  const tHospitals = useTranslations('hospitals');

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
          className="mb-12 flex flex-col items-center justify-between gap-6 text-center lg:mb-16 lg:flex-row lg:text-left"
        >
          <div>
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              {t('badge')}
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-5xl">
              {tHospitals('title')}
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              {tHospitals('subtitle')}
            </p>
          </div>
          <Button size="lg" variant="outline" className="gap-2 rounded-full" asChild>
            <Link href="/hospitals">
              {t('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Hospitals Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital, index) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/hospitals/${hospital.slug}`} className="group block h-full">
                <motion.div
                  whileHover={{ y: -8 }}
                  className="h-full overflow-hidden rounded-2xl border bg-background shadow-lg transition-shadow hover:shadow-xl"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={hospital.image}
                      alt={hospital.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badges */}
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {hospital.badges.map((badge) => (
                        <Badge
                          key={badge}
                          className={`${
                            badge === 'JCI'
                              ? 'bg-green-500 hover:bg-green-600'
                              : badge === 'Featured'
                              ? 'bg-primary hover:bg-primary/90'
                              : badge === 'Popular'
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'bg-amber-500 hover:bg-amber-600'
                          } text-white`}
                        >
                          {badge === 'JCI' && <Shield className="mr-1 h-3 w-3" />}
                          {badge}
                        </Badge>
                      ))}
                    </div>

                    {/* Favorite button */}
                    <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 transition-colors hover:bg-white hover:text-red-500">
                      <Heart className="h-5 w-5" />
                    </button>

                    {/* Rating overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium shadow-lg">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{hospital.rating}</span>
                      <span className="text-muted-foreground">({hospital.reviews})</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary">
                      {hospital.name}
                    </h3>

                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {hospital.description}
                    </p>

                    {/* Location */}
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {hospital.city}
                    </div>

                    {/* Specialties */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {hospital.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Languages */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <div className="flex gap-1">
                          {hospital.languages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
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
