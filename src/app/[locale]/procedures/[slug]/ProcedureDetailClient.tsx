'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Calendar,
  Star,
  MapPin,
  ChevronDown,
  ChevronUp,
  Building2,
  Shield,
  Globe,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Locale } from '@/lib/i18n/config';

interface Hospital {
  id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  city: string;
  avg_rating: number;
  review_count: number;
  certifications: string[];
  languages: string[];
  price_range: string | null;
  is_featured: boolean;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  featured_image: string | null;
  created_at: string;
}

interface Procedure {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
  short_description: string;
  image_url: string | null;
  price_range_usd: string | null;
  duration_minutes: number | null;
  recovery_days: string | null;
  popularity_score: number;
  is_featured: boolean;
  faq: Array<{ q: string; a: string }> | null;
  hospitals: Hospital[];
  relatedPosts: RelatedPost[];
}

interface Props {
  procedure: Procedure;
  locale: Locale;
}

const categoryColors: Record<string, string> = {
  'plastic-surgery': 'from-pink-500 to-rose-600',
  dermatology: 'from-violet-500 to-purple-600',
  dental: 'from-cyan-500 to-blue-600',
  ophthalmology: 'from-emerald-500 to-teal-600',
  'hair-transplant': 'from-amber-500 to-orange-600',
  'health-checkup': 'from-green-500 to-emerald-600',
  fertility: 'from-pink-400 to-purple-500',
  orthopedics: 'from-slate-500 to-gray-600',
};

export function ProcedureDetailClient({ procedure, locale }: Props) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const gradientColor = categoryColors[procedure.category] || 'from-violet-500 to-purple-600';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br ${gradientColor} opacity-20 blur-3xl`}
          />
        </div>

        <div className="container relative z-10 py-12 lg:py-20">
          {/* Back Button */}
          <Link href={`/${locale}/procedures`}>
            <Button variant="ghost" className="mb-6 text-white/80 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Procedures
            </Button>
          </Link>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col justify-center"
            >
              <Badge className={`mb-4 w-fit bg-gradient-to-r ${gradientColor} border-0 text-white`}>
                {procedure.category.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>

              <h1 className="mb-4 text-3xl font-bold text-white lg:text-5xl">
                {procedure.name}
              </h1>

              <p className="mb-6 text-lg text-white/70">
                {procedure.short_description || procedure.description.slice(0, 200)}
              </p>

              {/* Quick Stats */}
              <div className="mb-8 grid grid-cols-3 gap-4">
                {procedure.price_range_usd && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <DollarSign className="mb-2 h-5 w-5 text-green-400" />
                    <div className="text-sm text-white/60">Price Range</div>
                    <div className="font-semibold text-white">{procedure.price_range_usd}</div>
                  </div>
                )}
                {procedure.duration_minutes && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <Clock className="mb-2 h-5 w-5 text-blue-400" />
                    <div className="text-sm text-white/60">Duration</div>
                    <div className="font-semibold text-white">
                      {procedure.duration_minutes < 60
                        ? `${procedure.duration_minutes} mins`
                        : `${Math.round(procedure.duration_minutes / 60)} hrs`}
                    </div>
                  </div>
                )}
                {procedure.recovery_days && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <Calendar className="mb-2 h-5 w-5 text-purple-400" />
                    <div className="text-sm text-white/60">Recovery</div>
                    <div className="font-semibold text-white">{procedure.recovery_days}</div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className={`bg-gradient-to-r ${gradientColor} text-white`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Get Consultation
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Heart className="mr-2 h-4 w-4" />
                  Save Procedure
                </Button>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                {procedure.image_url ? (
                  <Image
                    src={procedure.image_url}
                    alt={procedure.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientColor}`}>
                    <Sparkles className="h-20 w-20 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Popularity Badge */}
                {procedure.popularity_score > 80 && (
                  <Badge className="absolute right-4 top-4 bg-yellow-500/90 text-black">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Top Rated
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">About This Procedure</h2>
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p>{procedure.description}</p>
              </div>
            </section>

            {/* Why Choose Korea */}
            <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-50 to-purple-50 p-8 dark:from-violet-950/30 dark:to-purple-950/30">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <CheckCircle2 className="h-6 w-6 text-violet-500" />
                Why Choose Korea?
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: 'World-Class Technology', desc: 'Latest medical equipment and techniques' },
                  { title: 'Expert Surgeons', desc: '15+ years average experience' },
                  { title: 'Cost Savings', desc: '40-70% lower than US/Europe' },
                  { title: 'K-Beauty Standards', desc: 'Natural, refined aesthetic results' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-3"
                  >
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            {procedure.faq && procedure.faq.length > 0 && (
              <section>
                <h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {procedure.faq.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="overflow-hidden rounded-xl border bg-card"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/50"
                      >
                        <span>{item.q}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t bg-muted/30 p-4 text-muted-foreground">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Hospitals */}
            {procedure.hospitals.length > 0 && (
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Building2 className="h-5 w-5 text-violet-500" />
                  Recommended Hospitals
                </h3>
                <div className="space-y-4">
                  {procedure.hospitals.slice(0, 5).map((hospital, index) => (
                    <motion.div
                      key={hospital.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/${locale}/hospitals/${hospital.slug}`}>
                        <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-violet-500/30">
                          <CardContent className="p-0">
                            <div className="relative h-32">
                              {hospital.cover_image_url ? (
                                <Image
                                  src={hospital.cover_image_url}
                                  alt={hospital.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900">
                                  <Building2 className="h-8 w-8 text-violet-500/50" />
                                </div>
                              )}
                              {hospital.is_featured && (
                                <Badge className="absolute right-2 top-2 bg-yellow-500 text-black">Featured</Badge>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold">{hospital.name}</h4>
                              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {hospital.city}
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{hospital.avg_rating}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({hospital.review_count})
                                  </span>
                                </div>
                                {hospital.price_range && (
                                  <span className="text-sm font-medium text-green-600">
                                    {hospital.price_range}
                                  </span>
                                )}
                              </div>
                              {hospital.certifications && hospital.certifications.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {hospital.certifications.slice(0, 2).map(cert => (
                                    <Badge key={cert} variant="outline" className="text-xs">
                                      <Shield className="mr-1 h-3 w-3" />
                                      {cert}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                {procedure.hospitals.length > 5 && (
                  <Link href={`/${locale}/hospitals?specialty=${procedure.category}`}>
                    <Button variant="outline" className="mt-4 w-full">
                      View All {procedure.hospitals.length} Hospitals
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </section>
            )}

            {/* Related Posts */}
            {procedure.relatedPosts.length > 0 && (
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Globe className="h-5 w-5 text-violet-500" />
                  Related Articles
                </h3>
                <div className="space-y-3">
                  {procedure.relatedPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/${locale}/blog/${post.slug}`}>
                        <div className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                            {post.featured_image ? (
                              <Image
                                src={post.featured_image}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <Sparkles className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="line-clamp-2 text-sm font-medium">{post.title}</h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Consultation CTA */}
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-50 to-purple-50 p-6 dark:from-violet-950/50 dark:to-purple-950/50">
              <Sparkles className="mb-3 h-8 w-8 text-violet-500" />
              <h3 className="mb-2 text-lg font-semibold">Need Help Deciding?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Get personalized recommendations from our medical tourism experts.
              </p>
              <Link href={`/${locale}/inquiry`}>
                <Button className={`w-full bg-gradient-to-r ${gradientColor} text-white`}>
                  Free Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
