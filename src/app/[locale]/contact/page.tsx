'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Locale } from '@/lib/i18n/config';

const contactMethods = [
  {
    key: 'email',
    icon: Mail,
    value: 'support@getcarekorea.com',
    color: 'from-blue-500 to-cyan-500',
    action: 'mailto:support@getcarekorea.com',
  },
  {
    key: 'kakao',
    icon: MessageCircle,
    value: 'GetCareKorea',
    color: 'from-yellow-500 to-amber-500',
    action: 'https://pf.kakao.com/_getcarekorea',
  },
  {
    key: 'line',
    icon: MessageCircle,
    value: '@getcarekorea',
    color: 'from-green-500 to-emerald-500',
    action: 'https://line.me/ti/p/@getcarekorea',
  },
  {
    key: 'whatsapp',
    icon: Phone,
    value: '+82-10-0000-0000',
    color: 'from-green-600 to-green-700',
    action: 'https://wa.me/821000000000',
  },
];

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale() as Locale;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success(t('form.successMessage'));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-16 lg:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 bg-violet-500">{t('hero.badge')}</Badge>
            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-white/70">
              {t('hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="container py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <a href={method.action} target="_blank" rel="noopener noreferrer">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${method.color}`}
                    >
                      <method.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-1 font-semibold">{t(`methods.${method.key}.title`)}</h3>
                    <p className="text-sm text-muted-foreground">{method.value}</p>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact Form & Info */}
      <div className="container pb-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <h2 className="mb-6 text-2xl font-bold">{t('form.title')}</h2>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{t('form.successTitle')}</h3>
                    <p className="text-muted-foreground">{t('form.successMessage')}</p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => setIsSubmitted(false)}
                    >
                      {t('form.sendAnother')}
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          {t('form.name')}
                        </label>
                        <Input required placeholder={t('form.namePlaceholder')} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          {t('form.email')}
                        </label>
                        <Input type="email" required placeholder={t('form.emailPlaceholder')} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('form.subject')}
                      </label>
                      <Input required placeholder={t('form.subjectPlaceholder')} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        {t('form.message')}
                      </label>
                      <Textarea
                        required
                        rows={5}
                        placeholder={t('form.messagePlaceholder')}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          {t('form.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {t('form.submit')}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Hours */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">{t('info.hours.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('info.hours.weekday')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('info.hours.weekend')}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('info.hours.timezone')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">{t('info.location.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('info.location.address')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seoul, South Korea
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold">{t('info.response.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('info.response.description')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
