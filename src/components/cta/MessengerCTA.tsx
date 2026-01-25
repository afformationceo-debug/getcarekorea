'use client';

import { useLocale } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { localeCTAConfig, type Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export type MessengerType = 'whatsapp' | 'line' | 'wechat' | 'kakao' | 'telegram';

export interface MessengerCTAProps {
  /** Messenger type */
  messenger: MessengerType;
  /** Messenger ID (phone number for WhatsApp, ID for LINE/WeChat) */
  messengerId: string;
  /** CTA button text (optional, uses default if not provided) */
  ctaText?: string;
  /** Pre-filled message (optional) */
  message?: string;
  /** Author/Interpreter name for context */
  authorName?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================
// MESSENGER CONFIG
// =====================================================

const MESSENGER_CONFIG: Record<MessengerType, {
  name: string;
  color: string;
  hoverColor: string;
  icon: string;
  urlPattern: (id: string, message?: string) => string;
}> = {
  whatsapp: {
    name: 'WhatsApp',
    color: 'bg-[#25D366]',
    hoverColor: 'hover:bg-[#128C7E]',
    icon: 'whatsapp',
    urlPattern: (id, message) => {
      const phone = id.replace(/[^0-9]/g, '');
      const encodedMessage = message ? `&text=${encodeURIComponent(message)}` : '';
      return `https://wa.me/${phone}?${encodedMessage}`;
    },
  },
  line: {
    name: 'LINE',
    color: 'bg-[#00B900]',
    hoverColor: 'hover:bg-[#009900]',
    icon: 'line',
    urlPattern: (id) => {
      // LINE Official Account or user ID
      if (id.startsWith('@')) {
        return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
      }
      return `https://line.me/ti/p/${encodeURIComponent(id)}`;
    },
  },
  wechat: {
    name: 'WeChat',
    color: 'bg-[#07C160]',
    hoverColor: 'hover:bg-[#06AD56]',
    icon: 'wechat',
    urlPattern: (id) => {
      // WeChat doesn't have direct link - show QR code or ID
      return `weixin://dl/chat?${id}`;
    },
  },
  kakao: {
    name: 'KakaoTalk',
    color: 'bg-[#FEE500]',
    hoverColor: 'hover:bg-[#E5CF00]',
    icon: 'kakao',
    urlPattern: (id) => {
      // KakaoTalk Channel
      return `https://pf.kakao.com/${id}`;
    },
  },
  telegram: {
    name: 'Telegram',
    color: 'bg-[#0088cc]',
    hoverColor: 'hover:bg-[#006699]',
    icon: 'telegram',
    urlPattern: (id, message) => {
      const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
      return `https://t.me/${id}${encodedMessage}`;
    },
  },
};

// Default messenger by locale
const LOCALE_DEFAULT_MESSENGER: Record<string, MessengerType> = {
  en: 'whatsapp',
  ko: 'kakao',
  ja: 'line',
  'zh-CN': 'wechat',
  'zh-TW': 'line',
  th: 'line',
  mn: 'whatsapp',
  ru: 'whatsapp',
};

// =====================================================
// COMPONENT
// =====================================================

export default function MessengerCTA({
  messenger,
  messengerId,
  ctaText,
  message,
  authorName,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: MessengerCTAProps) {
  const locale = useLocale() as Locale;
  const config = MESSENGER_CONFIG[messenger];
  const localeConfig = localeCTAConfig[locale];

  if (!config || !messengerId) {
    return null;
  }

  // Build URL with locale-specific default message
  const defaultMessage = authorName
    ? `${localeConfig.defaultMessage.replace(/\..*$/, '')} - ${authorName}.`
    : localeConfig.defaultMessage;

  const url = config.urlPattern(messengerId, message || defaultMessage);

  // Button styles based on variant
  const variantStyles = {
    primary: `${config.color} ${config.hoverColor} text-white`,
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: `border-2 border-current ${config.color.replace('bg-', 'text-')} hover:${config.color} hover:text-white`,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonText = ctaText || `Contact via ${config.name}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium transition-all duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      <MessengerIcon messenger={messenger} className="w-5 h-5" />
      <span>{buttonText}</span>
    </a>
  );
}

// =====================================================
// MESSENGER ICON COMPONENT
// =====================================================

function MessengerIcon({ messenger, className }: { messenger: MessengerType; className?: string }) {
  switch (messenger) {
    case 'whatsapp':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      );
    case 'line':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      );
    case 'wechat':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
      );
    case 'kakao':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 00-.656-.678l-1.928 1.866V9.282a.472.472 0 00-.944 0v2.557a.471.471 0 000 .222V13.5a.472.472 0 00.944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 10.773-.543l-1.514-2.154zm-2.958 1.924h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 100-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 00-.127-.32l-1.545-2.62a.69.69 0 00-1.196 0l-1.55 2.621a.472.472 0 00.378.676.47.47 0 00.418-.263l.298-.657h1.99l.298.657a.472.472 0 00.034.052v.018z"/>
        </svg>
      );
    case 'telegram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      );
    default:
      return <MessageCircle className={className} />;
  }
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

/**
 * Get default messenger for a locale
 */
export function getDefaultMessenger(locale: string): MessengerType {
  return LOCALE_DEFAULT_MESSENGER[locale] || 'whatsapp';
}

/**
 * Multi-messenger CTA (shows the appropriate messenger based on locale)
 * Uses locale-specific default messages from config
 */
export function LocaleAwareMessengerCTA({
  messengers,
  locale,
  message,
  ...props
}: Omit<MessengerCTAProps, 'messenger' | 'messengerId'> & {
  messengers: Partial<Record<MessengerType, string>>;
  locale?: string;
}) {
  const currentLocale = (locale || useLocale()) as Locale;
  const defaultMessenger = getDefaultMessenger(currentLocale);
  const localeConfig = localeCTAConfig[currentLocale];

  // Find the best messenger for this locale
  const messenger = messengers[defaultMessenger]
    ? defaultMessenger
    : (Object.keys(messengers)[0] as MessengerType);

  const messengerId = messengers[messenger];

  if (!messengerId) {
    return null;
  }

  // Use locale-specific message if not provided
  const localizedMessage = message || localeConfig.defaultMessage;

  return (
    <MessengerCTA
      messenger={messenger}
      messengerId={messengerId}
      message={localizedMessage}
      {...props}
    />
  );
}
