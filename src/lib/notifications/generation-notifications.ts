/**
 * Content Generation Notifications
 *
 * 콘텐츠 생성 완료 알림 시스템
 * - 브라우저 알림 (Web Push API 준비)
 * - 이메일 알림 (구조만 - 실제 발송은 이메일 서비스 연동 필요)
 * - 인앱 알림 (DB 저장)
 */

import { getRedis } from '@/lib/upstash/redis';

// =====================================================
// TYPES
// =====================================================

export type NotificationType =
  | 'generation_started'
  | 'generation_completed'
  | 'generation_failed'
  | 'batch_completed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// =====================================================
// CONSTANTS
// =====================================================

const NOTIFICATION_KEYS = {
  list: (userId: string) => `notifications:${userId}:list`,
  unread: (userId: string) => `notifications:${userId}:unread`,
} as const;

const MAX_NOTIFICATIONS = 100;
const NOTIFICATION_TTL = 30 * 24 * 60 * 60; // 30 days

// =====================================================
// NOTIFICATION FUNCTIONS
// =====================================================

/**
 * 알림 생성 및 저장
 */
export async function createNotification(
  payload: NotificationPayload
): Promise<Notification> {
  const redis = getRedis();

  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const listKey = NOTIFICATION_KEYS.list(payload.user_id);
  const unreadKey = NOTIFICATION_KEYS.unread(payload.user_id);

  const pipeline = redis.pipeline();

  // 알림 리스트에 추가
  pipeline.lpush(listKey, JSON.stringify(notification));
  pipeline.ltrim(listKey, 0, MAX_NOTIFICATIONS - 1);
  pipeline.expire(listKey, NOTIFICATION_TTL);

  // 읽지 않은 알림 카운트 증가
  pipeline.incr(unreadKey);
  pipeline.expire(unreadKey, NOTIFICATION_TTL);

  await pipeline.exec();

  return notification;
}

/**
 * 사용자 알림 목록 조회
 */
export async function getNotifications(
  userId: string,
  limit: number = 20
): Promise<Notification[]> {
  const redis = getRedis();
  const listKey = NOTIFICATION_KEYS.list(userId);

  const items = await redis.lrange(listKey, 0, limit - 1);

  return items.map(item => JSON.parse(item as string));
}

/**
 * 읽지 않은 알림 수 조회
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const redis = getRedis();
  const unreadKey = NOTIFICATION_KEYS.unread(userId);

  const count = await redis.get(unreadKey);
  return count ? parseInt(count as string, 10) : 0;
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const redis = getRedis();
  const listKey = NOTIFICATION_KEYS.list(userId);
  const unreadKey = NOTIFICATION_KEYS.unread(userId);

  // 모든 알림 조회
  const items = await redis.lrange(listKey, 0, -1);

  for (let i = 0; i < items.length; i++) {
    const notification = JSON.parse(items[i] as string) as Notification;

    if (notification.id === notificationId && !notification.is_read) {
      notification.is_read = true;

      // 업데이트
      await redis.lset(listKey, i, JSON.stringify(notification));
      await redis.decr(unreadKey);

      return true;
    }
  }

  return false;
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const redis = getRedis();
  const listKey = NOTIFICATION_KEYS.list(userId);
  const unreadKey = NOTIFICATION_KEYS.unread(userId);

  const items = await redis.lrange(listKey, 0, -1);
  let marked = 0;

  for (let i = 0; i < items.length; i++) {
    const notification = JSON.parse(items[i] as string) as Notification;

    if (!notification.is_read) {
      notification.is_read = true;
      await redis.lset(listKey, i, JSON.stringify(notification));
      marked++;
    }
  }

  await redis.set(unreadKey, 0);

  return marked;
}

// =====================================================
// GENERATION-SPECIFIC NOTIFICATIONS
// =====================================================

/**
 * 생성 시작 알림
 */
export async function notifyGenerationStarted(
  userId: string,
  batchId: string,
  totalKeywords: number
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'generation_started',
    title: '콘텐츠 생성 시작',
    message: `${totalKeywords}개 키워드에 대한 콘텐츠 생성이 시작되었습니다.`,
    data: {
      batch_id: batchId,
      total: totalKeywords,
    },
  });
}

/**
 * 개별 콘텐츠 생성 완료 알림
 */
export async function notifyGenerationCompleted(
  userId: string,
  keyword: string,
  blogPostId: string,
  qualityScore: number
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'generation_completed',
    title: '콘텐츠 생성 완료',
    message: `"${keyword}" 키워드의 콘텐츠가 생성되었습니다. (품질: ${qualityScore}점)`,
    data: {
      keyword,
      blog_post_id: blogPostId,
      quality_score: qualityScore,
    },
  });
}

/**
 * 개별 콘텐츠 생성 실패 알림
 */
export async function notifyGenerationFailed(
  userId: string,
  keyword: string,
  errorMessage: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'generation_failed',
    title: '콘텐츠 생성 실패',
    message: `"${keyword}" 키워드의 콘텐츠 생성에 실패했습니다.`,
    data: {
      keyword,
      error: errorMessage,
    },
  });
}

/**
 * 배치 완료 알림
 */
export async function notifyBatchCompleted(
  userId: string,
  batchId: string,
  completed: number,
  failed: number,
  total: number
): Promise<Notification> {
  const status = failed === 0 ? '완료' : failed === total ? '실패' : '부분 완료';

  return createNotification({
    user_id: userId,
    type: 'batch_completed',
    title: `콘텐츠 일괄 생성 ${status}`,
    message: `총 ${total}개 중 ${completed}개 성공, ${failed}개 실패`,
    data: {
      batch_id: batchId,
      completed,
      failed,
      total,
      status,
    },
  });
}

// =====================================================
// EMAIL NOTIFICATION (Structure only)
// =====================================================

export interface EmailNotificationConfig {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

/**
 * 이메일 알림 전송 (구조만 - 실제 구현은 이메일 서비스 연동 필요)
 *
 * TODO: 다음 서비스 중 하나 연동
 * - Resend (권장)
 * - SendGrid
 * - AWS SES
 * - Nodemailer
 */
export async function sendEmailNotification(
  config: EmailNotificationConfig
): Promise<boolean> {
  // TODO: 실제 이메일 서비스 연동
  console.log('[Email Notification]', {
    to: config.to,
    subject: config.subject,
    body: config.body.substring(0, 100) + '...',
  });

  // 현재는 로그만 출력하고 성공 반환
  return true;
}

/**
 * 배치 완료 이메일 알림
 */
export async function sendBatchCompletionEmail(params: {
  email: string;
  batchId: string;
  completed: number;
  failed: number;
  total: number;
}): Promise<boolean> {
  const { email, batchId, completed, failed, total } = params;
  const status = failed === 0 ? '완료' : '부분 완료';

  return sendEmailNotification({
    to: email,
    subject: `[GetCareKorea] 콘텐츠 생성 ${status} - ${completed}/${total}`,
    body: `
콘텐츠 일괄 생성 작업이 ${status}되었습니다.

배치 ID: ${batchId}
총 키워드: ${total}개
성공: ${completed}개
실패: ${failed}개

관리자 페이지에서 결과를 확인하세요.
    `.trim(),
    html: `
<h2>콘텐츠 일괄 생성 ${status}</h2>
<table style="border-collapse: collapse;">
  <tr><td style="padding: 8px; border: 1px solid #ddd;">배치 ID</td><td style="padding: 8px; border: 1px solid #ddd;">${batchId}</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;">총 키워드</td><td style="padding: 8px; border: 1px solid #ddd;">${total}개</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;">성공</td><td style="padding: 8px; border: 1px solid #ddd; color: green;">${completed}개</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd;">실패</td><td style="padding: 8px; border: 1px solid #ddd; color: red;">${failed}개</td></tr>
</table>
<p><a href="/admin/keywords">관리자 페이지에서 결과 확인</a></p>
    `.trim(),
  });
}
