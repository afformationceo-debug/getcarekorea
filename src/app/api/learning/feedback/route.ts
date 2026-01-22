/**
 * Manual Feedback API
 *
 * POST /api/learning/feedback - 관리자 수동 피드백 제출
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processManualFeedback } from '@/lib/content/learning-pipeline';

export const runtime = 'nodejs';

/**
 * POST /api/learning/feedback
 * 관리자 수동 피드백 제출
 *
 * Request body:
 * {
 *   blog_post_id: string;
 *   feedback_type: 'positive' | 'negative' | 'edit';
 *   edited_content?: string;  // feedback_type이 'edit'일 때 필수
 *   notes?: string;
 * }
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

    // 요청 본문 파싱
    const body = await request.json();

    // 필수 필드 검증
    if (!body.blog_post_id) {
      return NextResponse.json(
        { error: 'blog_post_id is required' },
        { status: 400 }
      );
    }

    if (!body.feedback_type || !['positive', 'negative', 'edit'].includes(body.feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback_type. Must be positive, negative, or edit' },
        { status: 400 }
      );
    }

    if (body.feedback_type === 'edit' && !body.edited_content) {
      return NextResponse.json(
        { error: 'edited_content is required when feedback_type is edit' },
        { status: 400 }
      );
    }

    // 피드백 처리
    const result = await processManualFeedback(supabase, {
      blog_post_id: body.blog_post_id,
      feedback_type: body.feedback_type,
      edited_content: body.edited_content,
      notes: body.notes,
      admin_id: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process feedback' },
        { status: 500 }
      );
    }

    // 피드백 로그 저장 (테이블이 있는 경우)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('admin_feedback_logs') as any).insert({
        admin_id: user.id,
        blog_post_id: body.blog_post_id,
        feedback_type: body.feedback_type,
        notes: body.notes,
        learning_data_id: result.learningDataId,
        created_at: new Date().toISOString(),
      });
    } catch {
      // 테이블이 없어도 무시 (피드백 로그는 선택적)
      console.log('admin_feedback_logs table not found, skipping log');
    }

    return NextResponse.json({
      success: true,
      data: {
        learningDataId: result.learningDataId,
        feedbackType: body.feedback_type,
      },
      message: body.feedback_type === 'negative'
        ? 'Negative feedback recorded (no learning data created)'
        : 'Feedback processed and learning data created',
    });
  } catch (error) {
    console.error('Feedback processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
