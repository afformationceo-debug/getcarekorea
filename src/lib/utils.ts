import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get current timestamp as ISO string
 *
 * The Supabase database timezone is set to 'Asia/Seoul',
 * so timestamps are automatically stored in UTC and displayed in KST (+09:00).
 * No manual timezone conversion is needed.
 */
export function getKSTTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get current timestamp as Date object
 */
export function getKSTDate(): Date {
  return new Date();
}
