'use client';

import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

// Messenger configuration by locale
const MESSENGER_CONFIG = {
  en: { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  ko: { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  ja: { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  'zh-TW': { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  'zh-CN': { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  th: { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  mn: { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
  ru: { type: 'whatsapp', phone: '821086081915', color: 'from-green-500 to-green-600' },
} as const;

interface MessengerCTAProps {
  variant?: 'default' | 'floating' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export function MessengerCTA({ variant = 'default', size = 'md' }: MessengerCTAProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('messenger');
  const config = MESSENGER_CONFIG[locale];

  const getMessengerUrl = () => {
    // All locales now use WhatsApp
    return `https://wa.me/${config.phone}`;
  };

  const getMessengerName = () => {
    // All locales now use WhatsApp
    return 'WhatsApp';
  };

  // Size configurations
  const sizeClasses = {
    sm: {
      button: 'px-4 py-2 text-sm',
      icon: 'h-5 w-5',
      logo: 'h-6 w-6',
    },
    md: {
      button: 'px-6 py-3 text-base',
      icon: 'h-6 w-6',
      logo: 'h-8 w-8',
    },
    lg: {
      button: 'px-8 py-4 text-lg',
      icon: 'h-7 w-7',
      logo: 'h-10 w-10',
    },
  };

  const classes = sizeClasses[size];

  // Floating variant (bottom-right corner)
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.a
          href={getMessengerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${config.color} shadow-2xl transition-shadow hover:shadow-green-500/50`}
        >
          {/* Pulse animation */}
          <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20" />

          {/* Icon */}
          <MessageCircle className="h-8 w-8 text-white" />

          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 hidden w-max rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white group-hover:block">
            {t('chatOn')} {getMessengerName()}
          </span>
        </motion.a>
      </motion.div>
    );
  }

  // Inline variant (compact button)
  if (variant === 'inline') {
    return (
      <motion.a
        href={getMessengerUrl()}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${config.color} ${classes.button} font-semibold text-white shadow-lg transition-shadow hover:shadow-xl`}
      >
        <MessageCircle className={classes.icon} />
        <span>{t('chatNow')}</span>
      </motion.a>
    );
  }

  // Default variant (prominent CTA with 3D-style logo)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="relative"
    >
      <motion.a
        href={getMessengerUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${config.color} ${classes.button} font-bold text-white shadow-2xl transition-all hover:shadow-green-500/50`}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />

        {/* 3D-style messenger logo using CSS */}
        <div className="relative">
          <div
            className={`relative ${classes.logo} rounded-full bg-white/90 p-1.5 shadow-lg backdrop-blur-sm`}
            style={{
              transform: 'perspective(100px) rotateY(-10deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            {/* All locales now use WhatsApp */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>

          {/* Online indicator */}
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
        </div>

        {/* Text content */}
        <div className="relative flex flex-col items-start">
          <span className="text-xs opacity-90">{t('chatOn')}</span>
          <span className="font-bold">{getMessengerName()}</span>
        </div>

        {/* Arrow icon */}
        <Send className={`${classes.icon} relative ml-auto`} />
      </motion.a>

      {/* Subtext */}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t('instantResponse')}
      </p>
    </motion.div>
  );
}
