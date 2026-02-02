'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Send,
  CheckCircle,
  MessageCircle,
  Mail,
  Sparkles,
  Shield,
  Clock,
  Award,
  HeartPulse,
  User,
  Building2,
  FileText,
  Zap,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/lib/i18n/config';
import { getCTAForLocale, type CTAConfig } from '@/lib/settings/cta';

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  messengerType: z.string().optional(),
  messengerId: z.string().optional(),
  procedureInterest: z.string().min(1, 'Please select a procedure'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

// Country codes with flags
const COUNTRY_CODES = [
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA/Canada' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+886', country: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+976', country: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'UK' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
];

// Get default country code based on locale
function getDefaultCountryCode(locale: string): string {
  const localeToCountry: Record<string, string> = {
    'ko': '+82',
    'en': '+1',
    'ja': '+81',
    'zh-TW': '+886',
    'zh-CN': '+86',
    'th': '+66',
    'mn': '+976',
    'ru': '+7',
  };
  return localeToCountry[locale] || '+1';
}

function InquiryFormContent() {
  const t = useTranslations('inquiry');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | null>(null);
  const [countryCode, setCountryCode] = useState(() => getDefaultCountryCode(locale));

  const hospitalId = searchParams.get('hospital');
  const preselectedProcedure = searchParams.get('procedure');

  // Load CTA config from database
  useEffect(() => {
    async function loadCTA() {
      try {
        const config = await getCTAForLocale(locale);
        setCtaConfig(config);
      } catch (error) {
        console.error('Failed to load CTA config:', error);
      }
    }
    loadCTA();
  }, [locale]);

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      messengerType: 'whatsapp',
      messengerId: '',
      procedureInterest: preselectedProcedure || '',
      message: '',
    },
  });

  const procedures = [
    { value: 'plastic-surgery', label: t('procedures.plasticSurgery') },
    { value: 'dermatology', label: t('procedures.dermatology') },
    { value: 'dental', label: t('procedures.dental') },
    { value: 'ophthalmology', label: t('procedures.ophthalmology') },
    { value: 'hair-transplant', label: t('procedures.hairTransplant') },
    { value: 'health-checkup', label: t('procedures.healthCheckup') },
    { value: 'orthopedics', label: t('procedures.orthopedics') },
    { value: 'fertility', label: t('procedures.fertility') },
    { value: 'other', label: t('procedures.other') },
  ];

  const messengers = [
    { value: 'whatsapp', label: t('messengers.whatsapp') },
    { value: 'line', label: t('messengers.line') },
    { value: 'wechat', label: t('messengers.wechat') },
    { value: 'telegram', label: t('messengers.telegram') },
    { value: 'email', label: t('messengers.email') },
  ];

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      // Combine country code with phone number
      const fullPhone = data.phone ? `${countryCode} ${data.phone}` : '';

      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: fullPhone,
          hospitalId,
          locale,
        }),
      });

      if (response.ok) {
        router.push('/inquiry/success');
      }
    } catch (error) {
      console.error('Inquiry submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </motion.div>
              <span className="text-sm font-medium text-white/90">{t('heroTagline')}</span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-5xl">
              <span className="block">{t('heroTitle1')}</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70">
              {t('subtitle')}
            </p>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: Shield, text: t('badges.jciCertified') },
                { icon: Clock, text: t('badges.response24h') },
                { icon: Award, text: t('badges.bestPrice') },
                { icon: HeartPulse, text: t('badges.expertCare') },
              ].map((item, i) => (
                <Badge key={i} variant="secondary" className="bg-white/10 text-white/80 backdrop-blur-sm px-4 py-2">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.text}
                </Badge>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container py-8">
        <div className="-mt-16 relative z-20 mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="overflow-hidden border-0 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{t('form.formTitle')}</CardTitle>
                      <p className="text-sm text-muted-foreground">{t('form.formDescription')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Name */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <User className="h-4 w-4 text-violet-500" />
                                {t('form.name')}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder={t('form.namePlaceholder')} className="!h-12 rounded-xl" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-violet-500" />
                                {t('form.email')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder={t('form.emailPlaceholder')}
                                  className="!h-12 rounded-xl"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Phone */}
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-violet-500" />
                                {t('form.phone')}
                              </FormLabel>
                              <FormControl>
                                <div className="flex gap-2 items-center">
                                  <Select value={countryCode} onValueChange={setCountryCode}>
                                    <SelectTrigger className="!h-12 w-[110px] rounded-xl flex-shrink-0">
                                      <SelectValue>
                                        {COUNTRY_CODES.find(c => c.code === countryCode)?.flag} {countryCode}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {COUNTRY_CODES.map((country) => (
                                        <SelectItem key={country.code} value={country.code}>
                                          <span className="flex items-center gap-2">
                                            <span>{country.flag}</span>
                                            <span>{country.code}</span>
                                            <span className="text-muted-foreground text-xs">{country.name}</span>
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="010-1234-5678"
                                    className="!h-12 rounded-xl flex-1"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Messenger Type */}
                        <FormField
                          control={form.control}
                          name="messengerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-violet-500" />
                                {t('form.messenger')}
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="!h-12 rounded-xl">
                                    <SelectValue placeholder={t('form.messengerPlaceholder')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {messengers.map((messenger) => (
                                    <SelectItem key={messenger.value} value={messenger.value}>
                                      {messenger.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Messenger ID */}
                      {form.watch('messengerType') && form.watch('messengerType') !== 'email' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <FormField
                            control={form.control}
                            name="messengerId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {form.watch('messengerType')?.toUpperCase()} ID
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('form.messengerIdPlaceholder')}
                                    className="!h-12 rounded-xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}

                      {/* Procedure Interest */}
                      <FormField
                        control={form.control}
                        name="procedureInterest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-violet-500" />
                              {t('form.procedure')}
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="!h-12 rounded-xl">
                                  <SelectValue placeholder={t('form.procedurePlaceholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {procedures.map((procedure) => (
                                  <SelectItem key={procedure.value} value={procedure.value}>
                                    {procedure.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Message */}
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-violet-500" />
                              {t('form.message')}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('form.messagePlaceholder')}
                                rows={5}
                                className="rounded-xl resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-lg shadow-lg shadow-violet-500/25"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" color="white" className="mr-2" />
                            {t('form.submitting')}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            {t('form.submit')}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Quick Contact */}
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {t('sidebar.quickContact')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {ctaConfig && (
                    <motion.a
                      whileHover={{ x: 5 }}
                      href={ctaConfig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ctaConfig.color}`}>
                        <MessageCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{ctaConfig.text || t('sidebar.chatWithUs')}</p>
                        <p className="text-sm text-muted-foreground">{t('sidebar.chatWithUs')}</p>
                      </div>
                    </motion.a>
                  )}
                  <motion.a
                    whileHover={{ x: 5 }}
                    href="mailto:support@getcarekorea.com"
                    className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{t('sidebar.email')}</p>
                      <p className="text-sm text-muted-foreground">support@getcarekorea.com</p>
                    </div>
                  </motion.a>
                </CardContent>
              </Card>

              {/* Why Choose Us */}
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    {t('sidebar.whyTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      t('sidebar.benefits.1'),
                      t('sidebar.benefits.2'),
                      t('sidebar.benefits.3'),
                      t('sidebar.benefits.4'),
                      t('sidebar.benefits.5'),
                    ].map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InquiryFormFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-32">
        <div className="container flex items-center justify-center">
          <LoadingSpinner size="xl" color="white" />
        </div>
      </div>
    </div>
  );
}

export default function InquiryPage() {
  return (
    <Suspense fallback={<InquiryFormFallback />}>
      <InquiryFormContent />
    </Suspense>
  );
}
