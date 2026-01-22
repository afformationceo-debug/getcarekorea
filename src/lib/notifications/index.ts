/**
 * Notification System
 *
 * Handles email and messenger notifications for bookings, inquiries, etc.
 * This is a placeholder implementation - integrate with actual services as needed.
 */

import { secureLog } from '@/lib/api/error-handler';

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'inquiry_received'
  | 'inquiry_updated';

export type MessengerType = 'whatsapp' | 'line' | 'wechat' | 'telegram' | 'email';

interface NotificationPayload {
  type: NotificationType;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientMessenger?: MessengerType;
  locale: string;
  data: Record<string, unknown>;
}

interface NotificationTemplate {
  subject: string;
  body: string;
}

// Notification templates by type and locale
const templates: Record<NotificationType, Record<string, NotificationTemplate>> = {
  booking_created: {
    en: {
      subject: 'Booking Request Received - GetCareKorea',
      body: 'Your booking request for {{hospitalName}} on {{bookingDate}} has been received. We will confirm your appointment within 24 hours.',
    },
    'zh-TW': {
      subject: '預約請求已收到 - GetCareKorea',
      body: '您在{{hospitalName}}於{{bookingDate}}的預約請求已收到。我們將在24小時內確認您的預約。',
    },
    ja: {
      subject: '予約リクエストを受け取りました - GetCareKorea',
      body: '{{hospitalName}}での{{bookingDate}}の予約リクエストを受け取りました。24時間以内にご予約を確認いたします。',
    },
  },
  booking_confirmed: {
    en: {
      subject: 'Booking Confirmed - GetCareKorea',
      body: 'Your booking at {{hospitalName}} on {{bookingDate}} at {{bookingTime}} has been confirmed. Please arrive 15 minutes early.',
    },
    'zh-TW': {
      subject: '預約已確認 - GetCareKorea',
      body: '您在{{hospitalName}}於{{bookingDate}} {{bookingTime}}的預約已確認。請提前15分鐘到達。',
    },
    ja: {
      subject: '予約が確認されました - GetCareKorea',
      body: '{{hospitalName}}での{{bookingDate}} {{bookingTime}}の予約が確認されました。15分前にお越しください。',
    },
  },
  booking_cancelled: {
    en: {
      subject: 'Booking Cancelled - GetCareKorea',
      body: 'Your booking at {{hospitalName}} on {{bookingDate}} has been cancelled. If you have questions, please contact us.',
    },
    'zh-TW': {
      subject: '預約已取消 - GetCareKorea',
      body: '您在{{hospitalName}}於{{bookingDate}}的預約已取消。如有疑問，請與我們聯繫。',
    },
    ja: {
      subject: '予約がキャンセルされました - GetCareKorea',
      body: '{{hospitalName}}での{{bookingDate}}の予約がキャンセルされました。ご質問がありましたらお問い合わせください。',
    },
  },
  booking_completed: {
    en: {
      subject: 'Thank You for Your Visit - GetCareKorea',
      body: 'Thank you for choosing {{hospitalName}}. We hope your experience was excellent. Please consider leaving a review to help other patients.',
    },
    'zh-TW': {
      subject: '感謝您的來訪 - GetCareKorea',
      body: '感謝您選擇{{hospitalName}}。希望您的體驗很好。請考慮留下評論以幫助其他患者。',
    },
    ja: {
      subject: 'ご来院ありがとうございます - GetCareKorea',
      body: '{{hospitalName}}をお選びいただきありがとうございます。素晴らしい体験ができましたことを願っております。他の患者さんの参考になるよう、レビューをお願いいたします。',
    },
  },
  inquiry_received: {
    en: {
      subject: 'Inquiry Received - GetCareKorea',
      body: 'Thank you for your inquiry about {{procedureInterest}}. Our team will contact you within 24 hours.',
    },
    'zh-TW': {
      subject: '詢問已收到 - GetCareKorea',
      body: '感謝您對{{procedureInterest}}的詢問。我們的團隊將在24小時內與您聯繫。',
    },
    ja: {
      subject: 'お問い合わせを受け取りました - GetCareKorea',
      body: '{{procedureInterest}}についてのお問い合わせありがとうございます。24時間以内にご連絡いたします。',
    },
  },
  inquiry_updated: {
    en: {
      subject: 'Inquiry Update - GetCareKorea',
      body: 'Your inquiry has been updated. Please check your messages for the latest information.',
    },
    'zh-TW': {
      subject: '詢問更新 - GetCareKorea',
      body: '您的詢問已更新。請查看您的消息以獲取最新信息。',
    },
    ja: {
      subject: 'お問い合わせの更新 - GetCareKorea',
      body: 'お問い合わせが更新されました。最新情報についてはメッセージをご確認ください。',
    },
  },
};

/**
 * Get template with data interpolation
 */
function getTemplate(type: NotificationType, locale: string): NotificationTemplate {
  return templates[type]?.[locale] || templates[type]?.en || { subject: '', body: '' };
}

/**
 * Interpolate template variables
 */
function interpolate(text: string, data: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] || ''));
}

/**
 * Send notification via email
 * TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  // Placeholder - log for now
  secureLog('info', 'Email notification queued', {
    to,
    subject,
    bodyLength: body.length,
  });

  // In production, integrate with:
  // - SendGrid: @sendgrid/mail
  // - AWS SES: @aws-sdk/client-ses
  // - Resend: resend
  // - Postmark: postmark

  return true;
}

/**
 * Send notification via messenger
 * TODO: Integrate with actual messenger APIs
 */
async function sendMessenger(
  platform: MessengerType,
  recipient: string,
  message: string
): Promise<boolean> {
  secureLog('info', 'Messenger notification queued', {
    platform,
    recipientMasked: recipient.substring(0, 3) + '***',
    messageLength: message.length,
  });

  // In production, integrate with:
  // - WhatsApp: Twilio WhatsApp API or WhatsApp Business API
  // - LINE: LINE Messaging API
  // - WeChat: WeChat Official Account API
  // - Telegram: Telegram Bot API

  return true;
}

/**
 * Main notification function
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const template = getTemplate(payload.type, payload.locale);
    const subject = interpolate(template.subject, payload.data);
    const body = interpolate(template.body, payload.data);

    const results: Promise<boolean>[] = [];

    // Send email if recipient email provided
    if (payload.recipientEmail) {
      results.push(sendEmail(payload.recipientEmail, subject, body));
    }

    // Send messenger notification if provided
    if (payload.recipientPhone && payload.recipientMessenger) {
      results.push(sendMessenger(payload.recipientMessenger, payload.recipientPhone, body));
    }

    // Wait for all notifications
    const outcomes = await Promise.all(results);
    return outcomes.every(Boolean);
  } catch (error) {
    secureLog('error', 'Notification error', { error: String(error), type: payload.type });
    return false;
  }
}

/**
 * Send booking notification
 */
export async function sendBookingNotification(
  type: Extract<NotificationType, `booking_${string}`>,
  booking: {
    recipientEmail: string;
    recipientPhone?: string;
    recipientMessenger?: MessengerType;
    locale: string;
    hospitalName: string;
    bookingDate: string;
    bookingTime?: string;
  }
): Promise<boolean> {
  return sendNotification({
    type,
    recipientEmail: booking.recipientEmail,
    recipientPhone: booking.recipientPhone,
    recipientMessenger: booking.recipientMessenger,
    locale: booking.locale,
    data: {
      hospitalName: booking.hospitalName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime || '',
    },
  });
}

/**
 * Send inquiry notification
 */
export async function sendInquiryNotification(
  type: Extract<NotificationType, `inquiry_${string}`>,
  inquiry: {
    recipientEmail: string;
    recipientPhone?: string;
    recipientMessenger?: MessengerType;
    locale: string;
    procedureInterest?: string;
  }
): Promise<boolean> {
  return sendNotification({
    type,
    recipientEmail: inquiry.recipientEmail,
    recipientPhone: inquiry.recipientPhone,
    recipientMessenger: inquiry.recipientMessenger,
    locale: inquiry.locale,
    data: {
      procedureInterest: inquiry.procedureInterest || 'General consultation',
    },
  });
}

export default {
  sendNotification,
  sendBookingNotification,
  sendInquiryNotification,
};
