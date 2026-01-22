/**
 * API Error Handler - Centralized error handling for all API routes
 *
 * Features:
 * - Consistent error response format
 * - No sensitive information in error messages (production mode)
 * - Secure logging with sensitive data redaction
 * - Accessibility-friendly error codes
 * - Type-safe error handling
 */

import { NextResponse } from 'next/server';

// Error codes for accessibility (screen readers can announce these)
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

// HTTP status codes mapped to error codes
const errorStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
};

// User-friendly error messages (safe for display)
const userFriendlyMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid. Please check your input and try again.',
  [ErrorCode.BAD_REQUEST]: 'The request could not be processed. Please try again.',
  [ErrorCode.UNAUTHORIZED]: 'Please sign in to access this resource.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCode.NOT_FOUND]: 'The requested resource could not be found.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service is unavailable. Please try again later.',
};

// Localized error messages
const localizedMessages: Record<string, Record<ErrorCode, string>> = {
  en: userFriendlyMessages,
  'zh-TW': {
    [ErrorCode.VALIDATION_ERROR]: '提供的數據無效。請檢查您的輸入並重試。',
    [ErrorCode.BAD_REQUEST]: '無法處理請求。請重試。',
    [ErrorCode.UNAUTHORIZED]: '請登入以訪問此資源。',
    [ErrorCode.FORBIDDEN]: '您沒有權限訪問此資源。',
    [ErrorCode.NOT_FOUND]: '找不到請求的資源。',
    [ErrorCode.RATE_LIMITED]: '請求過多。請稍等片刻再試。',
    [ErrorCode.INTERNAL_ERROR]: '發生意外錯誤。請稍後重試。',
    [ErrorCode.DATABASE_ERROR]: '發生數據庫錯誤。請稍後重試。',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服務不可用。請稍後重試。',
  },
  'zh-CN': {
    [ErrorCode.VALIDATION_ERROR]: '提供的数据无效。请检查您的输入并重试。',
    [ErrorCode.BAD_REQUEST]: '无法处理请求。请重试。',
    [ErrorCode.UNAUTHORIZED]: '请登录以访问此资源。',
    [ErrorCode.FORBIDDEN]: '您没有权限访问此资源。',
    [ErrorCode.NOT_FOUND]: '找不到请求的资源。',
    [ErrorCode.RATE_LIMITED]: '请求过多。请稍等片刻再试。',
    [ErrorCode.INTERNAL_ERROR]: '发生意外错误。请稍后重试。',
    [ErrorCode.DATABASE_ERROR]: '发生数据库错误。请稍后重试。',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务不可用。请稍后重试。',
  },
  ja: {
    [ErrorCode.VALIDATION_ERROR]: '入力されたデータが無効です。入力内容を確認して再度お試しください。',
    [ErrorCode.BAD_REQUEST]: 'リクエストを処理できませんでした。もう一度お試しください。',
    [ErrorCode.UNAUTHORIZED]: 'このリソースにアクセスするにはログインしてください。',
    [ErrorCode.FORBIDDEN]: 'このリソースにアクセスする権限がありません。',
    [ErrorCode.NOT_FOUND]: 'リクエストされたリソースが見つかりませんでした。',
    [ErrorCode.RATE_LIMITED]: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
    [ErrorCode.INTERNAL_ERROR]: '予期せぬエラーが発生しました。しばらくしてから再度お試しください。',
    [ErrorCode.DATABASE_ERROR]: 'データベースエラーが発生しました。しばらくしてから再度お試しください。',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部サービスが利用できません。しばらくしてから再度お試しください。',
  },
  th: {
    [ErrorCode.VALIDATION_ERROR]: 'ข้อมูลที่ให้มาไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
    [ErrorCode.BAD_REQUEST]: 'ไม่สามารถประมวลผลคำขอได้ กรุณาลองใหม่อีกครั้ง',
    [ErrorCode.UNAUTHORIZED]: 'กรุณาเข้าสู่ระบบเพื่อเข้าถึงข้อมูลนี้',
    [ErrorCode.FORBIDDEN]: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
    [ErrorCode.NOT_FOUND]: 'ไม่พบข้อมูลที่ร้องขอ',
    [ErrorCode.RATE_LIMITED]: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    [ErrorCode.INTERNAL_ERROR]: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่ภายหลัง',
    [ErrorCode.DATABASE_ERROR]: 'เกิดข้อผิดพลาดของฐานข้อมูล กรุณาลองใหม่ภายหลัง',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'บริการภายนอกไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง',
  },
  mn: {
    [ErrorCode.VALIDATION_ERROR]: 'Оруулсан мэдээлэл буруу байна. Шалгаад дахин оролдоно уу.',
    [ErrorCode.BAD_REQUEST]: 'Хүсэлтийг боловсруулах боломжгүй. Дахин оролдоно уу.',
    [ErrorCode.UNAUTHORIZED]: 'Энэ эх сурвалжид хандахын тулд нэвтэрнэ үү.',
    [ErrorCode.FORBIDDEN]: 'Та энэ эх сурвалжид хандах эрхгүй байна.',
    [ErrorCode.NOT_FOUND]: 'Хүссэн эх сурвалж олдсонгүй.',
    [ErrorCode.RATE_LIMITED]: 'Хэт олон хүсэлт илгээгдсэн. Түр хүлээгээд дахин оролдоно уу.',
    [ErrorCode.INTERNAL_ERROR]: 'Санаандгүй алдаа гарлаа. Дараа дахин оролдоно уу.',
    [ErrorCode.DATABASE_ERROR]: 'Мэдээллийн сангийн алдаа гарлаа. Дараа дахин оролдоно уу.',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Гадны үйлчилгээ ажиллахгүй байна. Дараа дахин оролдоно уу.',
  },
  ru: {
    [ErrorCode.VALIDATION_ERROR]: 'Предоставленные данные недействительны. Проверьте ввод и попробуйте снова.',
    [ErrorCode.BAD_REQUEST]: 'Запрос не может быть обработан. Попробуйте снова.',
    [ErrorCode.UNAUTHORIZED]: 'Войдите в систему для доступа к этому ресурсу.',
    [ErrorCode.FORBIDDEN]: 'У вас нет разрешения на доступ к этому ресурсу.',
    [ErrorCode.NOT_FOUND]: 'Запрошенный ресурс не найден.',
    [ErrorCode.RATE_LIMITED]: 'Слишком много запросов. Подождите и попробуйте снова.',
    [ErrorCode.INTERNAL_ERROR]: 'Произошла непредвиденная ошибка. Попробуйте позже.',
    [ErrorCode.DATABASE_ERROR]: 'Произошла ошибка базы данных. Попробуйте позже.',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Внешний сервис недоступен. Попробуйте позже.',
  },
};

// Custom API Error class
export class APIError extends Error {
  public code: ErrorCode;
  public details?: Record<string, unknown>;
  public locale?: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    locale?: string
  ) {
    super(message || userFriendlyMessages[code]);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.locale = locale;
  }
}

// Sensitive keys to redact from logs
const sensitiveKeys = [
  'password',
  'token',
  'authorization',
  'api_key',
  'apikey',
  'secret',
  'credential',
  'credit_card',
  'ssn',
  'phone',
  'email',
  'bearer',
];

// Redact sensitive data from objects
function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check if string looks like a token or key
    if (obj.length > 20 && /^[A-Za-z0-9+/=_-]+$/.test(obj)) {
      return '[REDACTED_TOKEN]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

// Secure logging function
export function secureLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
) {
  const isProd = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();
  const redactedData = data ? redactSensitiveData(data) : undefined;

  const logEntry = {
    timestamp,
    level,
    message,
    ...(redactedData && !isProd ? { data: redactedData } : {}),
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

// Response builder interface
interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface SuccessResponseBody<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Get localized error message
function getLocalizedMessage(code: ErrorCode, locale?: string): string {
  const lang = locale || 'en';
  const messages = localizedMessages[lang] || localizedMessages.en;
  return messages[code] || userFriendlyMessages[code];
}

// Create error response
export function createErrorResponse(
  error: APIError | Error | unknown,
  locale?: string
): NextResponse<ErrorResponseBody> {
  let code = ErrorCode.INTERNAL_ERROR;
  let message = getLocalizedMessage(ErrorCode.INTERNAL_ERROR, locale);
  let details: Record<string, unknown> | undefined;

  if (error instanceof APIError) {
    code = error.code;
    message = error.message || getLocalizedMessage(error.code, error.locale || locale);
    details = error.details;
  } else if (error instanceof Error) {
    // Log the actual error securely
    secureLog('error', 'Unhandled error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Check for specific error types
    if (error.message.includes('not found') || error.message.includes('no rows')) {
      code = ErrorCode.NOT_FOUND;
      message = getLocalizedMessage(ErrorCode.NOT_FOUND, locale);
    } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
      code = ErrorCode.VALIDATION_ERROR;
      message = getLocalizedMessage(ErrorCode.VALIDATION_ERROR, locale);
    } else if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      code = ErrorCode.UNAUTHORIZED;
      message = getLocalizedMessage(ErrorCode.UNAUTHORIZED, locale);
    }
  }

  // In production, don't expose internal details
  const isProd = process.env.NODE_ENV === 'production';
  const responseDetails = isProd ? undefined : details;

  const status = errorStatusMap[code];

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(responseDetails && { details: responseDetails }),
      },
    },
    { status }
  );
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  meta?: SuccessResponseBody<T>['meta']
): NextResponse<SuccessResponseBody<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

// Wrapper for async route handlers
export function withErrorHandling<T>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T | ErrorResponseBody>> => {
    try {
      return await handler(req);
    } catch (error) {
      // Extract locale from URL if present
      const url = new URL(req.url);
      const locale = url.searchParams.get('locale') ||
                     url.pathname.split('/')[1] ||
                     'en';

      return createErrorResponse(error, locale);
    }
  };
}

// Validation helper
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[],
  locale?: string
): void {
  const missingFields = requiredFields.filter(
    field => data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      undefined,
      { missingFields: missingFields as string[] },
      locale
    );
  }
}

// Type guard for checking if value is a valid locale
export function isValidLocale(locale: string): locale is keyof typeof localizedMessages {
  return locale in localizedMessages;
}
