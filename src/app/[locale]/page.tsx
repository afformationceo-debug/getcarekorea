import { setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustBanner } from '@/components/landing/TrustBanner';
import { CategoriesSection } from '@/components/landing/CategoriesSection';
import { WhyPlatformSection } from '@/components/landing/WhyPlatformSection';
import { FreeInterpreterBanner } from '@/components/landing/FreeInterpreterBanner';
import { PriceComparisonSection } from '@/components/landing/PriceComparisonSection';
import { FeaturedHospitalsSection } from '@/components/landing/FeaturedHospitalsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { LocalInfoSection } from '@/components/landing/LocalInfoSection';
import { CTASection } from '@/components/landing/CTASection';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero with AI Chat */}
      <HeroSection />

      {/* Trust Indicators */}
      <TrustBanner />

      {/* Medical Categories */}
      <CategoriesSection />

      {/* Why Book Through Platform */}
      <WhyPlatformSection />

      {/* Free Interpreter Event */}
      <FreeInterpreterBanner />

      {/* Price Comparison */}
      <PriceComparisonSection />

      {/* Featured Hospitals */}
      <FeaturedHospitalsSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Local Info (Restaurants, Accommodation, Pickup) */}
      <LocalInfoSection />

      {/* Final CTA */}
      <CTASection />
    </div>
  );
}
