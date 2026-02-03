'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Exportable types for reuse
export interface CarouselPhoto {
  id: string;
  image_url: string;
  caption?: string | null;
  alt?: string;
}

export interface PhotoCarouselProps {
  /** Array of photos to display */
  photos: CarouselPhoto[];
  /** Additional CSS classes */
  className?: string;
  /** Height configuration: 'sm' | 'md' | 'lg' | 'auto' or custom Tailwind class */
  height?: 'sm' | 'md' | 'lg' | 'auto' | string;
  /** How the image should fit: 'contain' | 'cover' */
  objectFit?: 'contain' | 'cover';
  /** Show lightbox on click */
  showLightbox?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Show dot indicators */
  showDots?: boolean;
  /** Enable loop */
  loop?: boolean;
  /** Active dot color (Tailwind class) */
  activeDotColor?: string;
  /** Show captions below image */
  showCaptions?: boolean;
  /** Aspect ratio (e.g., '16/9', '4/3', '1/1') - only used when height is 'auto' */
  aspectRatio?: string;
}

const heightClasses = {
  sm: 'h-[200px] sm:h-[250px] md:h-[300px]',
  md: 'h-[300px] sm:h-[400px] md:h-[500px]',
  lg: 'h-[400px] sm:h-[500px] md:h-[600px]',
  auto: '',
};

export function PhotoCarousel({
  photos,
  className,
  height = 'md',
  objectFit = 'contain',
  showLightbox = true,
  showArrows = true,
  showDots = true,
  loop = true,
  activeDotColor = 'bg-violet-600',
  showCaptions = false,
  aspectRatio = '16/10',
}: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const openLightbox = (index: number) => {
    if (showLightbox) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  if (photos.length === 0) return null;

  const heightClass = heightClasses[height as keyof typeof heightClasses] || height;
  const useAspectRatio = height === 'auto';

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Carousel */}
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={cn(
                  'flex-[0_0_100%] min-w-0 px-1',
                  showLightbox && 'cursor-pointer'
                )}
                onClick={() => openLightbox(index)}
              >
                <div
                  className={cn(
                    'relative w-full bg-muted rounded-lg overflow-hidden',
                    useAspectRatio ? '' : heightClass
                  )}
                  style={useAspectRatio ? { aspectRatio } : undefined}
                >
                  <Image
                    src={photo.image_url}
                    alt={photo.alt || photo.caption || `Photo ${index + 1}`}
                    fill
                    className={cn(
                      objectFit === 'contain' ? 'object-contain' : 'object-cover'
                    )}
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
                {showCaptions && photo.caption && (
                  <p className="text-sm text-muted-foreground text-center mt-2 px-2">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {showArrows && photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); scrollNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {showDots && photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  selectedIndex === index
                    ? `${activeDotColor} w-6`
                    : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Lightbox Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev + 1) % photos.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Lightbox Image */}
          <div
            className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].image_url}
              alt={photos[lightboxIndex].alt || photos[lightboxIndex].caption || 'Photo'}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Lightbox Caption */}
          {photos[lightboxIndex].caption && (
            <div className="absolute bottom-16 left-0 right-0 text-center px-4">
              <p className="text-white bg-black/50 inline-block px-4 py-2 rounded-lg max-w-2xl">
                {photos[lightboxIndex].caption}
              </p>
            </div>
          )}

          {/* Lightbox Dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(index);
                  }}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    lightboxIndex === index
                      ? 'bg-white w-4'
                      : 'bg-white/50 hover:bg-white/70'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
