'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { Star, MapPin, Languages, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Hospital {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  avg_rating: number;
  review_count: number;
  specialties: string[];
  city: string;
  district: string | null;
  languages: string[];
  certifications: string[];
  is_featured: boolean;
}

interface FeaturedHospitalsSectionProps {
  hospitals: Hospital[];
}

export function FeaturedHospitalsSection({ hospitals }: FeaturedHospitalsSectionProps) {
  const t = useTranslations('landing.featuredHospitals');
  const tHospitals = useTranslations('hospitals');

  // If no hospitals, don't render the section
  if (!hospitals || hospitals.length === 0) {
    return null;
  }

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
          {hospitals.slice(0, 3).map((hospital, index) => {
            const imageUrl = hospital.cover_image_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop';
            const location = hospital.district
              ? `${hospital.district}, ${hospital.city}`
              : hospital.city;
            const hasJCI = hospital.certifications?.includes('JCI');

            // Map full language names to short codes
            const languageMap: Record<string, string> = {
              'English': 'EN',
              'Korean': 'KO',
              'Chinese': 'ZH',
              'Japanese': 'JA',
              'Thai': 'TH',
              'Russian': 'RU',
              'Mongolian': 'MN',
            };
            const languageCodes = (hospital.languages || []).map(
              lang => languageMap[lang] || lang.substring(0, 2).toUpperCase()
            ).slice(0, 4);

            return (
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
                        src={imageUrl}
                        alt={hospital.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {hasJCI && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            <Shield className="mr-1 h-3 w-3" />
                            JCI
                          </Badge>
                        )}
                        {hospital.is_featured && (
                          <Badge className="bg-primary hover:bg-primary/90 text-white">
                            Featured
                          </Badge>
                        )}
                      </div>

                      {/* Rating overlay */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-medium shadow-lg">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{hospital.avg_rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-muted-foreground">({hospital.review_count || 0})</span>
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
                        {location}
                      </div>

                      {/* Specialties */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {(hospital.specialties || []).slice(0, 2).map((specialty) => (
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
                            {languageCodes.map((lang) => (
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
