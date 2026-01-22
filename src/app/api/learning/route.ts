/**
 * LLM Learning Pipeline API
 *
 * POST /api/learning - 학습 파이프라인 실행
 * GET /api/learning - 학습 상태 조회
 * POST /api/learning/feedback - 수동 피드백 제출
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  runLearningPipeline,
  getLearningPipelineStatus,
} from '@/lib/content/learning-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/learning
 * 학습 파이프라인 상태 조회
 */
export async function GET() {
  try {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 파이프라인 상태 조회
    const status = await getLearningPipelineStatus();

    // 최근 학습 데이터 조회
    const { data: recentLearning } = await supabase
      .from('llm_learning_data')
      .select('id, source_type, locale, category, performance_score, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        status,
        recentLearning: recentLearning || [],
      },
    });
  } catch (error) {
    console.error('Learning status error:', error);
    return NextResponse.json(
      { error: 'Failed to get learning status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning
 * 학습 파이프라인 실행
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 파이프라인 실행
    const result = await runLearningPipeline(supabase);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} posts, found ${result.newHighPerformers} new high performers, indexed ${result.indexed}`,
    });
  } catch (error) {
    console.error('Learning pipeline error:', error);
    return NextResponse.json(
      { error: 'Failed to run learning pipeline' },
      { status: 500 }
    );
  }
}
