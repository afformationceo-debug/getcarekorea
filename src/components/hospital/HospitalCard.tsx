'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Star, MapPin, Languages, BadgeCheck, Cctv, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Hospital } from '@/types/database';
import { getLocalizedContent, type Locale } from '@/lib/i18n/config';

interface HospitalCardProps {
  hospital: Hospital;
  locale: Locale;
}

export function HospitalCard({ hospital, locale }: HospitalCardProps) {
  const t = useTranslations('hospitals');

  const name = getLocalizedContent(hospital, 'name', locale);
  const description = getLocalizedContent(hospital, 'description', locale);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden">
        {hospital.cover_image_url ? (
          <Image
            src={hospital.cover_image_url}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {hospital.is_featured && (
            <Badge variant="default" className="bg-primary">
              {t('badges.featured')}
            </Badge>
          )}
          {hospital.certifications.includes('JCI') && (
            <Badge variant="secondary" className="bg-blue-500 text-white">
              {t('badges.jci')}
            </Badge>
          )}
        </div>

        {/* Rating overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-white">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{hospital.avg_rating.toFixed(1)}</span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Logo and Name */}
        <div className="mb-3 flex items-start gap-3">
          {hospital.logo_url && (
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={hospital.logo_url}
                alt={`${name} logo`}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{hospital.city}</span>
              <span className="mx-1">·</span>
              <span>{t('card.reviews', { count: hospital.review_count })}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}

        {/* Specialties */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {hospital.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="outline" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {hospital.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{hospital.specialties.length - 3}
            </Badge>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {hospital.languages.length > 0 && (
            <div className="flex items-center gap-1">
              <Languages className="h-3.5 w-3.5" />
              <span>{hospital.languages.slice(0, 2).join(', ')}</span>
            </div>
          )}
          {hospital.is_verified && (
            <div className="flex items-center gap-1 text-green-600">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>{t('badges.verified')}</span>
            </div>
          )}
          {hospital.has_cctv && (
            <div className="flex items-center gap-1">
              <Cctv className="h-3.5 w-3.5" />
              <span>{t('badges.cctv')}</span>
            </div>
          )}
          {hospital.has_female_doctor && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{t('badges.femaleDoctor')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/hospitals/${hospital.slug}`}>{t('detail.overview')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/inquiry?hospital=${hospital.id}`}>{t('card.from')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
export function HospitalCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/9] animate-pulse bg-muted" />
      <CardContent className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1">
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mb-3 h-10 animate-pulse rounded bg-muted" />
        <div className="mb-3 flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-10 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
