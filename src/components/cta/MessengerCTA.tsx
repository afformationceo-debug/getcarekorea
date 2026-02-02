'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { getCTAForLocale, type CTAConfig } from '@/lib/settings/cta';

// Default fallback config
const DEFAULT_CONFIG: CTAConfig = {
  type: 'whatsapp',
  url: 'https://wa.me/821086081915',
  text: 'Chat on WhatsApp',
  color: 'from-green-500 to-green-600',
};

interface MessengerCTAProps {
  variant?: 'default' | 'floating' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export function MessengerCTA({ variant = 'default', size = 'md' }: MessengerCTAProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('messenger');
  const [config, setConfig] = useState<CTAConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch CTA config from database
  useEffect(() => {
    async function loadConfig() {
      try {
        const ctaConfig = await getCTAForLocale(locale);
        setConfig(ctaConfig);
      } catch (error) {
        console.error('Failed to load CTA config:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadConfig();
  }, [locale]);

  const getMessengerName = () => {
    switch (config.type) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'line':
        return 'LINE';
      case 'kakao':
        return 'KakaoTalk';
      case 'telegram':
        return 'Telegram';
      default:
        return 'WhatsApp';
    }
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

  // Get messenger icon based on type
  const MessengerIcon = () => {
    if (config.type === 'whatsapp') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      );
    }
    if (config.type === 'line') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      );
    }
    if (config.type === 'kakao') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="text-yellow-900">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 00-.656-.678l-1.928 1.866V9.282a.472.472 0 00-.944 0v2.557a.471.471 0 000 .222V13.5a.472.472 0 00.944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 10.773-.543l-1.514-2.154zm-2.958 1.924h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 100-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 00-.127-.32l-1.545-2.62a.46.46 0 00-.373-.223.47.47 0 00-.471.39l-1.323 3.5a.472.472 0 10.885.334l.254-.68h1.62l.241.605a.472.472 0 10.837-.432v-.538zm-7.063.116a.47.47 0 01-.471-.472V9.463L4.58 13.35a.473.473 0 01-.857-.405l1.763-4.113a.475.475 0 01.88.05l1.61 3.82v.341a.47.47 0 01-.471.472l-.933-.012z" />
        </svg>
      );
    }
    if (config.type === 'telegram') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    }
    return <MessageCircle className="h-full w-full" />;
  };

  // Don't render until loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

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
          href={config.url}
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
            {config.text || `${t('chatOn')} ${getMessengerName()}`}
          </span>
        </motion.a>
      </motion.div>
    );
  }

  // Inline variant (compact button)
  if (variant === 'inline') {
    return (
      <motion.a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${config.color} ${classes.button} font-semibold text-white shadow-lg transition-shadow hover:shadow-xl`}
      >
        <MessageCircle className={classes.icon} />
        <span>{config.text || t('chatNow')}</span>
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
        href={config.url}
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
            <MessengerIcon />
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
