'use client';

import { Suspense, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Send,
  CheckCircle,
  MessageCircle,
  Phone,
  Mail,
  Loader2,
  Sparkles,
  Shield,
  Clock,
  Award,
  HeartPulse,
  ArrowRight,
  User,
  Building2,
  Calendar,
  FileText,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { localeCTAConfig, type Locale } from '@/lib/i18n/config';

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

function InquiryFormContent() {
  const t = useTranslations('inquiry');
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hospitalId = searchParams.get('hospital');
  const preselectedProcedure = searchParams.get('procedure');

  const ctaConfig = localeCTAConfig[locale];

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      messengerType: ctaConfig.platform,
      messengerId: '',
      procedureInterest: preselectedProcedure || '',
      message: '',
    },
  });

  const procedures = [
    { value: 'plastic-surgery', label: 'Plastic Surgery' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'dental', label: 'Dental' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
    { value: 'hair-transplant', label: 'Hair Transplant' },
    { value: 'health-checkup', label: 'Health Checkup' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'fertility', label: 'Fertility' },
    { value: 'other', label: 'Other' },
  ];

  const messengers = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'line', label: 'LINE' },
    { value: 'wechat', label: 'WeChat' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'email', label: 'Email' },
  ];

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          hospitalId,
          locale,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Inquiry submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-green-900 to-background py-20">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-500/30 to-green-600/20 blur-3xl"
            />
          </div>

          <div className="container relative z-10 py-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="mx-auto max-w-md text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-2xl shadow-emerald-500/50"
              >
                <CheckCircle className="h-12 w-12 text-white" />
              </motion.div>
              <h1 className="mb-4 text-3xl font-bold text-white">{t('success.title')}</h1>
              <p className="mb-8 text-white/70">{t('success.message')}</p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <a href="/">Back to Home</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="text-sm font-medium text-white/90">Free Consultation</span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-5xl">
              <span className="block">Start Your</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Medical Journey
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
                { icon: Shield, text: 'JCI Certified' },
                { icon: Clock, text: '24h Response' },
                { icon: Award, text: 'Best Price' },
                { icon: HeartPulse, text: 'Expert Care' },
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
                <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Inquiry Form</CardTitle>
                      <p className="text-sm text-muted-foreground">Fill out the form below and we'll get back to you within 24 hours</p>
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
                                <Input placeholder="John Doe" className="h-12 rounded-xl" {...field} />
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
                                  placeholder="john@example.com"
                                  className="h-12 rounded-xl"
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
                                <Input placeholder="+1 234 567 8900" className="h-12 rounded-xl" {...field} />
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
                                  <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Select messenger" />
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
                                    placeholder={`Your ${form.watch('messengerType')} ID`}
                                    className="h-12 rounded-xl"
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
                                <SelectTrigger className="h-12 rounded-xl">
                                  <SelectValue placeholder="Select a procedure" />
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
                                placeholder="Tell us about your needs, questions, or any specific requirements..."
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
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
                <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-violet-500" />
                    Quick Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <motion.a
                    whileHover={{ x: 5 }}
                    href={`${ctaConfig.urlPrefix}821234567890`}
                    className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{ctaConfig.displayName}</p>
                      <p className="text-sm text-muted-foreground">Chat with us</p>
                    </div>
                  </motion.a>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href="tel:+821234567890"
                    className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">+82-2-XXX-XXXX</p>
                    </div>
                  </motion.a>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href="mailto:support@getcarekorea.com"
                    className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">support@getcarekorea.com</p>
                    </div>
                  </motion.a>
                </CardContent>
              </Card>

              {/* Why Choose Us */}
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-violet-500/5 to-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-violet-500" />
                    Why GetCareKorea?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Free consultation with no obligation',
                      'JCI-accredited hospitals only',
                      'Professional medical interpreters',
                      'Best price guarantee',
                      '24/7 support throughout your journey',
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

              {/* AI Assistance */}
              <Card className="overflow-hidden border-0 shadow-xl border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-purple-900/50">
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600"
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="mb-2 font-bold text-white">AI Assistant Available</h3>
                  <p className="mb-4 text-sm text-white/70">
                    Need help filling out the form? Our AI can assist you.
                  </p>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI Help
                  </Button>
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-12 w-12 text-white" />
          </motion.div>
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
