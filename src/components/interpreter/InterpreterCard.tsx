'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Star, Languages, Calendar, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Interpreter } from '@/types/database';
import { getLocalizedContent, type Locale } from '@/lib/i18n/config';

interface InterpreterCardProps {
  interpreter: Interpreter & {
    profile?: {
      full_name: string;
      avatar_url: string | null;
    };
  };
  locale: Locale;
}

export function InterpreterCard({ interpreter, locale }: InterpreterCardProps) {
  const t = useTranslations('interpreters');

  const bio = getLocalizedContent(interpreter, 'bio', locale);
  const languages = interpreter.languages as Array<{ code: string; level: string; name: string }>;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-5">
        {/* Profile Header */}
        <div className="mb-4 flex items-start gap-4">
          <div className="relative">
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              {interpreter.photo_url ? (
                <Image
                  src={interpreter.photo_url}
                  alt={interpreter.profile?.full_name || 'Interpreter'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-semibold">
                  {interpreter.profile?.full_name?.[0] || 'I'}
                </div>
              )}
            </div>
            {/* Online indicator */}
            {interpreter.is_available && (
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{interpreter.profile?.full_name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">
                    {interpreter.avg_rating.toFixed(1)}
                  </span>
                  <span>({interpreter.review_count} reviews)</span>
                </div>
              </div>
              {interpreter.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Languages className="h-4 w-4" />
            <span>{t('card.languages')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.slice(0, 4).map((lang) => (
              <Badge key={lang.code} variant="outline" className="text-xs">
                {lang.name}
                {lang.level === 'native' && ' (Native)'}
              </Badge>
            ))}
            {languages.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{languages.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Specialties */}
        {interpreter.specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {interpreter.specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bio excerpt */}
        {bio && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{bio}</p>
        )}

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t('card.bookings', { count: interpreter.total_bookings })}</span>
          </div>
          {interpreter.video_url && (
            <div className="flex items-center gap-1 text-primary">
              <Video className="h-4 w-4" />
              <span>Video intro</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            {interpreter.hourly_rate && (
              <p className="text-lg font-semibold text-primary">
                ${interpreter.hourly_rate}
                <span className="text-sm font-normal text-muted-foreground">/hour</span>
              </p>
            )}
          </div>
          {interpreter.daily_rate && (
            <p className="text-sm text-muted-foreground">
              ${interpreter.daily_rate}/day
            </p>
          )}
        </div>

        {/* Availability & Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" asChild>
            <Link href={`/interpreters/${interpreter.id}`}>View Profile</Link>
          </Button>
          <Button
            variant={interpreter.is_available ? 'default' : 'secondary'}
            disabled={!interpreter.is_available}
          >
            {interpreter.is_available ? t('card.available') : t('card.unavailable')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
export function InterpreterCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
          <div className="flex-1">
            <div className="mb-2 h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-4 h-10 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
