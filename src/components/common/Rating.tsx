'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = 'md',
  showValue = true,
  reviewCount,
  className,
}: RatingProps) {
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizeClasses[size], 'text-muted-foreground')} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], 'text-muted-foreground')}
          />
        ))}
      </div>

      {showValue && (
        <span className={cn('font-medium', textSizeClasses[size])}>
          {value.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// Interactive rating for reviews
interface InteractiveRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InteractiveRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  className,
}: InteractiveRatingProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Star
              className={cn(
                sizeClasses[size],
                'cursor-pointer',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground hover:text-yellow-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
