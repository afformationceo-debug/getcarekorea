/**
 * GSC Data Collection Cron Job
 *
 * Vercel Cron 또는 외부 스케줄러에서 호출
 * 일일 자동 수집용
 *
 * 설정: vercel.json에 cron 설정 추가 필요
 * {
 *   "crons": [{
 *     "path": "/api/cron/gsc-collect",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { collectGSCData, DataCollectionResult } from '@/lib/gsc';
import { runLearningPipeline } from '@/lib/content/learning-pipeline';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 타임아웃

// Cron 시크릿 확인용
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/gsc-collect
 * 일일 GSC 데이터 수집 크론잡
 */
export async function GET(request: NextRequest) {
  try {
    // Cron 시크릿 확인 (Vercel Cron 또는 외부 호출)
    const authHeader = request.headers.get('authorization');
    const cronSecret = authHeader?.replace('Bearer ', '');

    if (CRON_SECRET && cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 서비스 역할 클라이언트 생성 (RLS 우회)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. GSC 데이터 수집
    console.log('Starting GSC data collection...');
    const collectionResult: DataCollectionResult = await collectGSCData(supabase, 28);

    if (!collectionResult.success) {
      console.error('GSC collection failed:', collectionResult.errors);

      // 에러 로깅
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('cron_logs') as any).insert({
          job_name: 'gsc-collect',
          status: 'failed',
          error_message: collectionResult.errors.join(', '),
          created_at: new Date().toISOString(),
        });
      } catch {
        // cron_logs 테이블이 없어도 무시
      }

      return NextResponse.json({
        success: false,
        error: 'GSC collection failed',
        details: collectionResult.errors,
      }, { status: 500 });
    }

    // 2. 고성과 콘텐츠가 있으면 학습 파이프라인 실행
    let learningResult = null;
    if (collectionResult.highPerformers > 0) {
      console.log('Running learning pipeline for high performers...');
      try {
        learningResult = await runLearningPipeline(supabase);
      } catch (error) {
        console.error('Learning pipeline error:', error);
      }
    }

    // 결과 로깅
    const logEntry = {
      job_name: 'gsc-collect',
      status: 'completed',
      result_data: {
        pagesProcessed: collectionResult.pagesProcessed,
        newRecords: collectionResult.newRecords,
        updatedRecords: collectionResult.updatedRecords,
        highPerformers: collectionResult.highPerformers,
        learningPipeline: learningResult,
      },
      created_at: new Date().toISOString(),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('cron_logs') as any).insert(logEntry);
    } catch {
      // cron_logs 테이블이 없어도 무시
    }

    console.log('GSC collection completed:', logEntry);

    return NextResponse.json({
      success: true,
      data: {
        collection: {
          pagesProcessed: collectionResult.pagesProcessed,
          newRecords: collectionResult.newRecords,
          updatedRecords: collectionResult.updatedRecords,
          highPerformers: collectionResult.highPerformers,
        },
        learning: learningResult,
      },
      message: 'Daily GSC collection completed',
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
