/**
 * Cron Job Settings Page
 *
 * 자동 콘텐츠 생성 및 발행 크론 작업 설정
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import CronSettingsForm from './CronSettingsForm';

export const metadata: Metadata = {
  title: 'Cron Settings | Admin',
  description: 'Configure automatic content generation and publishing',
};

// 설정 타입
interface CronAutoGenerateSettings {
  enabled: boolean;
  batch_size: number;
  schedule: string;
  include_rag: boolean;
  include_images: boolean;
  image_count: number;
  auto_publish: boolean;
  priority_threshold: number;
}

interface CronAutoPublishSettings {
  enabled: boolean;
  schedule: string;
  max_publish_per_run: number;
  min_quality_score: number;
}

interface AuthorAssignmentSettings {
  algorithm: 'round_robin' | 'specialty_first' | 'random';
  prefer_specialty_match: boolean;
  fallback_to_any: boolean;
}

export interface SystemSettings {
  cron_auto_generate: CronAutoGenerateSettings;
  cron_auto_publish: CronAutoPublishSettings;
  author_assignment: AuthorAssignmentSettings;
}

async function getSettings(): Promise<SystemSettings> {
  const supabase = await createAdminClient();

  const { data: settings } = await (supabase.from('system_settings') as any)
    .select('key, value')
    .in('key', ['cron_auto_generate', 'cron_auto_publish', 'author_assignment']);

  const defaultSettings: SystemSettings = {
    cron_auto_generate: {
      enabled: true,
      batch_size: 3,
      schedule: '0 9 * * *',
      include_rag: true,
      include_images: true,
      image_count: 3,
      auto_publish: false,
      priority_threshold: 0,
    },
    cron_auto_publish: {
      enabled: true,
      schedule: '0 10 * * *',
      max_publish_per_run: 10,
      min_quality_score: 0,
    },
    author_assignment: {
      algorithm: 'round_robin',
      prefer_specialty_match: true,
      fallback_to_any: true,
    },
  };

  if (settings) {
    for (const setting of settings) {
      if (setting.key in defaultSettings) {
        (defaultSettings as any)[setting.key] = {
          ...(defaultSettings as any)[setting.key],
          ...setting.value,
        };
      }
    }
  }

  return defaultSettings;
}

export default async function CronSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cron Job Settings</h1>
        <p className="text-muted-foreground mt-1">
          자동 콘텐츠 생성 및 발행 설정을 관리합니다.
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <CronSettingsForm initialSettings={settings} />
      </Suspense>
    </div>
  );
}
