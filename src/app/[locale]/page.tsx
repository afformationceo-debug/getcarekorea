import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Critical above-the-fold components - load immediately
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustBanner } from '@/components/landing/TrustBanner';

// Below-the-fold components - lazy load for faster initial page load
const CategoriesSection = dynamic(() => import('@/components/landing/CategoriesSection').then(mod => ({ default: mod.CategoriesSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
const WhyPlatformSection = dynamic(() => import('@/components/landing/WhyPlatformSection').then(mod => ({ default: mod.WhyPlatformSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
});
const FreeInterpreterBanner = dynamic(() => import('@/components/landing/FreeInterpreterBanner').then(mod => ({ default: mod.FreeInterpreterBanner })), {
  loading: () => <div className="h-48 animate-pulse bg-violet-50" />,
});
const PriceComparisonSection = dynamic(() => import('@/components/landing/PriceComparisonSection').then(mod => ({ default: mod.PriceComparisonSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
const FeaturedHospitalsSection = dynamic(() => import('@/components/landing/FeaturedHospitalsSection').then(mod => ({ default: mod.FeaturedHospitalsSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
});
const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
const TestimonialsSection = dynamic(() => import('@/components/landing/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
});
const LocalInfoSection = dynamic(() => import('@/components/landing/LocalInfoSection').then(mod => ({ default: mod.LocalInfoSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
const CTASection = dynamic(() => import('@/components/landing/CTASection').then(mod => ({ default: mod.CTASection })), {
  loading: () => <div className="h-64 animate-pulse bg-violet-100" />,
});

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero with AI Chat - Critical, loads first */}
      <HeroSection />

      {/* Trust Indicators - Critical, loads first */}
      <TrustBanner />

      {/* Below-the-fold content - Lazy loaded */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <CategoriesSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <WhyPlatformSection />
      </Suspense>

      <Suspense fallback={<div className="h-48 animate-pulse bg-violet-50" />}>
        <FreeInterpreterBanner />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <PriceComparisonSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <FeaturedHospitalsSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <TestimonialsSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <LocalInfoSection />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse bg-violet-100" />}>
        <CTASection />
      </Suspense>
    </div>
  );
}
