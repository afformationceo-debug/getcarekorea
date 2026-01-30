/**
 * Auto Content Generation Cron Job
 *
 * GET /api/cron/auto-generate
 *
 * Automatically generates content for pending keywords using the unified pipeline.
 * Triggered by Vercel Cron every 15 minutes.
 *
 * Flow:
 * 1. Check schedule settings from DB
 * 2. Fetch pending keywords
 * 3. Run content generation pipeline for each keyword
 * 4. Update keyword status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  runContentGenerationPipeline,
  type ContentGenerationInput,
} from '@/lib/content/content-generation-pipeline';
import type { Locale } from '@/lib/content/multi-language-generator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// Cron authentication
const CRON_SECRET = process.env.CRON_SECRET;

// Valid locales
const VALID_LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

// =====================================================
// SCHEDULE CHECK HELPERS
// =====================================================

interface CronSettings {
  enabled: boolean;
  batch_size: number;
  schedule: string;
  include_rag: boolean;
  include_images: boolean;
  image_count: number;
  auto_publish: boolean;
  priority_threshold: number;
}

function shouldRunNow(cronExpression: string): boolean {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentDow = now.getDay();

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;

  if (!matchesCronField(minutePart, currentMinute, 0, 59)) return false;
  if (!matchesCronField(hourPart, currentHour, 0, 23)) return false;
  if (!matchesCronField(dayPart, currentDay, 1, 31)) return false;
  if (!matchesCronField(monthPart, currentMonth, 1, 12)) return false;
  if (!matchesCronField(dowPart, currentDow, 0, 6)) return false;

  return true;
}

function matchesCronField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true;

  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2));
    return (value - min) % step === 0;
  }

  if (field.includes(',')) {
    const values = field.split(',').map(v => parseInt(v.trim()));
    return values.includes(value);
  }

  if (field.includes('-')) {
    const [start, end] = field.split('-').map(v => parseInt(v.trim()));
    return value >= start && value <= end;
  }

  return parseInt(field) === value;
}

// =====================================================
// CRON LOG HELPER
// =====================================================

async function logCronExecution(
  supabase: any,
  jobName: string,
  status: 'success' | 'failed' | 'skipped',
  details: Record<string, any>,
  durationMs: number
) {
  try {
    await supabase.from('cron_logs').insert({
      job_name: jobName,
      status,
      details,
      duration_ms: durationMs,
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log cron execution:', error);
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  const cronId = `CRON-${Date.now().toString(36).toUpperCase()}`;
  const startTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🟠 [${cronId}] AUTO-GENERATE CRON JOB STARTED`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Verify cron secret (optional in development)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log(`❌ [${cronId}] Unauthorized - invalid cron secret`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // 1. Get cron settings
    const { data: settingsData } = await (supabase.from('system_settings') as any)
      .select('value')
      .eq('key', 'cron_auto_generate')
      .single();

    const settings: CronSettings = settingsData?.value || {
      enabled: false,
      batch_size: 3,
      schedule: '0 9,21 * * *',
      include_rag: true,
      include_images: true,
      image_count: 3,
      auto_publish: false,
      priority_threshold: 0,
    };

    console.log(`📋 [${cronId}] Settings:`, JSON.stringify(settings, null, 2));

    // Check if enabled
    if (!settings.enabled) {
      console.log(`⏭️ [${cronId}] SKIPPED - Auto-generation is disabled`);
      await logCronExecution(supabase, 'auto-generate', 'skipped', {
        reason: 'Auto-generation is disabled',
      }, Date.now() - startTime);

      return NextResponse.json({
        success: true,
        data: { skipped: true, reason: 'Auto-generation is disabled' },
      });
    }

    // Check schedule
    if (!shouldRunNow(settings.schedule)) {
      console.log(`⏭️ [${cronId}] SKIPPED - Current time does not match schedule: ${settings.schedule}`);
      await logCronExecution(supabase, 'auto-generate', 'skipped', {
        reason: 'Schedule not matched',
        schedule: settings.schedule,
        currentTime: new Date().toISOString(),
      }, Date.now() - startTime);

      return NextResponse.json({
        success: true,
        data: { skipped: true, reason: 'Schedule not matched' },
      });
    }

    // 2. Fetch pending keywords
    let query = (supabase.from('content_keywords') as any)
      .select('id, keyword, locale, category, priority, search_volume')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('search_volume', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(settings.batch_size);

    if (settings.priority_threshold > 0) {
      query = query.gte('priority', settings.priority_threshold);
    }

    const { data: pendingKeywords, error: fetchError } = await query;

    if (fetchError) {
      console.error(`❌ [${cronId}] Failed to fetch pending keywords:`, fetchError);
      throw fetchError;
    }

    if (!pendingKeywords || pendingKeywords.length === 0) {
      console.log(`✅ [${cronId}] No pending keywords to process`);
      await logCronExecution(supabase, 'auto-generate', 'success', {
        message: 'No pending keywords',
        processedCount: 0,
      }, Date.now() - startTime);

      return NextResponse.json({
        success: true,
        data: { generated: 0, message: 'No pending keywords to process' },
      });
    }

    console.log(`\n🚀 [${cronId}] Processing ${pendingKeywords.length} keywords`);

    // 3. Process each keyword with the unified pipeline
    const results: Array<{
      keywordId: string;
      keyword: string;
      locale: string;
      success: boolean;
      blogPostId?: string;
      authorSlug?: string;
      error?: string;
    }> = [];

    // Track assigned personas in this batch for round-robin
    const assignedInBatch = new Map<string, number>();

    for (const kw of pendingKeywords) {
      console.log(`\n📝 [${cronId}] Processing: ${kw.keyword} (${kw.locale})`);

      // Validate locale
      if (!VALID_LOCALES.includes(kw.locale as Locale)) {
        console.warn(`   ⚠️ Invalid locale: ${kw.locale}, skipping`);
        results.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          locale: kw.locale,
          success: false,
          error: `Invalid locale: ${kw.locale}`,
        });
        continue;
      }

      // Update keyword status to generating
      await (supabase.from('content_keywords') as any)
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', kw.id);

      // Prepare pipeline input
      const pipelineInput: ContentGenerationInput = {
        keywordId: kw.id,
        keyword: kw.keyword,
        locale: kw.locale,
        category: kw.category || 'general',
        includeRAG: settings.include_rag,
        includeImages: settings.include_images,
        imageCount: settings.image_count,
        autoPublish: settings.auto_publish,
      };

      // Run the unified pipeline
      const result = await runContentGenerationPipeline(supabase, pipelineInput, {
        requestId: `${cronId}-${kw.id.substring(0, 8)}`,
        assignedInBatch,
      });

      // Track assigned persona for round-robin
      if (result.authorPersonaId) {
        assignedInBatch.set(
          result.authorPersonaId,
          (assignedInBatch.get(result.authorPersonaId) || 0) + 1
        );
      }

      results.push({
        keywordId: kw.id,
        keyword: kw.keyword,
        locale: kw.locale,
        success: result.success,
        blogPostId: result.blogPostId,
        authorSlug: result.authorSlug,
        error: result.error,
      });
    }

    // 4. Summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const totalDuration = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ [${cronId}] CRON JOB COMPLETE`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`${'='.repeat(60)}\n`);

    await logCronExecution(supabase, 'auto-generate', 'success', {
      processedCount: results.length,
      successCount,
      failedCount,
      results: results.map(r => ({
        keyword: r.keyword,
        success: r.success,
        blogPostId: r.blogPostId,
        error: r.error,
      })),
    }, totalDuration);

    return NextResponse.json({
      success: true,
      data: {
        generated: successCount,
        failed: failedCount,
        total: results.length,
        results,
        durationMs: totalDuration,
      },
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`\n❌ [${cronId}] CRON JOB FAILED:`, error instanceof Error ? error.message : error);

    const supabase = await createAdminClient();
    await logCronExecution(supabase, 'auto-generate', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, totalDuration);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
