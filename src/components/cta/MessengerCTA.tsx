'use client';

import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

// Messenger configuration by locale
const MESSENGER_CONFIG = {
  en: { type: 'whatsapp', phone: '821012345678', color: 'from-green-500 to-green-600' },
  ko: { type: 'whatsapp', phone: '821012345678', color: 'from-green-500 to-green-600' },
  ja: { type: 'line', id: '@getcarekorea', color: 'from-green-400 to-green-500' },
  'zh-TW': { type: 'line', id: '@getcarekorea', color: 'from-green-400 to-green-500' },
  'zh-CN': { type: 'wechat', id: 'getcarekorea', color: 'from-green-500 to-green-600' },
  th: { type: 'line', id: '@getcarekorea', color: 'from-green-400 to-green-500' },
  mn: { type: 'whatsapp', phone: '821012345678', color: 'from-green-500 to-green-600' },
  ru: { type: 'whatsapp', phone: '821012345678', color: 'from-green-500 to-green-600' },
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
    if (config.type === 'whatsapp') {
      return `https://wa.me/${config.phone}`;
    } else if (config.type === 'line') {
      return `https://line.me/R/ti/p/${config.id}`;
    } else if (config.type === 'wechat') {
      return `weixin://dl/chat?${config.id}`;
    }
    return '#';
  };

  const getMessengerName = () => {
    if (config.type === 'whatsapp') return 'WhatsApp';
    if (config.type === 'line') return 'LINE';
    if (config.type === 'wechat') return 'WeChat';
    return 'Messenger';
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
            {config.type === 'whatsapp' && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            )}
            {config.type === 'line' && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            )}
            {config.type === 'wechat' && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 2.932-6.446 1.232-.654 2.594-.968 3.905-.968.093 0 .186.008.278.011-.09-.446-.141-.893-.141-1.348 0-4.054-3.891-7.342-8.691-7.342zm-.876 3.498a.843.843 0 0 1 .843.843.843.843 0 0 1-.843.843.843.843 0 0 1-.844-.843c0-.465.379-.843.844-.843zm-4.681 0a.843.843 0 0 1 .843.843.843.843 0 0 1-.843.843.843.843 0 0 1-.844-.843c0-.465.379-.843.844-.843zM24 14.252c0-3.454-3.351-6.244-7.414-6.244-4.064 0-7.414 2.79-7.414 6.244s3.35 6.244 7.414 6.244c.794 0 1.587-.107 2.342-.315.218-.064.458-.078.676-.029l1.619.95a.279.279 0 0 0 .14.047.281.281 0 0 0 .281-.281c0-.061-.025-.122-.04-.181l-.33-1.258a.498.498 0 0 1 .18-.564C22.875 17.803 24 16.143 24 14.252zM13.846 12.77a.72.72 0 0 1-.72.72.72.72 0 0 1-.72-.72.72.72 0 0 1 .72-.72.72.72 0 0 1 .72.72zm5.09 0a.72.72 0 0 1-.72.72.72.72 0 0 1-.72-.72.72.72 0 0 1 .72-.72.72.72 0 0 1 .72.72z" />
              </svg>
            )}
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
