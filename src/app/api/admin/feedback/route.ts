/**
 * Admin Feedback Analytics API
 *
 * GET /api/admin/feedback - Get feedback analytics data
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  secureLog,
} from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const range = searchParams.get('range') || '7d';
    const feedbackType = searchParams.get('type');
    const search = searchParams.get('search');

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get feedback entries with joined post data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let feedbackQuery = (adminSupabase.from('admin_feedback_logs') as any)
      .select(`
        id,
        content_draft_id,
        feedback_type,
        feedback_text,
        regenerated,
        admin_id,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (feedbackType && feedbackType !== 'all') {
      feedbackQuery = feedbackQuery.eq('feedback_type', feedbackType);
    }

    const { data: feedbackData, error: feedbackError } = await feedbackQuery;

    if (feedbackError) {
      secureLog('error', 'Error fetching feedback', { error: feedbackError.message });
    }

    // Get post titles for each feedback
    const feedbackWithPosts = await Promise.all(
      (feedbackData || []).map(async (fb: {
        id: string;
        content_draft_id: string;
        feedback_type: string;
        feedback_text: string | null;
        regenerated: boolean;
        admin_id: string | null;
        created_at: string;
      }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: post } = await (adminSupabase.from('blog_posts') as any)
          .select('title_en, slug')
          .eq('id', fb.content_draft_id)
          .single();

        return {
          id: fb.id,
          contentDraftId: fb.content_draft_id,
          feedbackType: fb.feedback_type,
          feedbackText: fb.feedback_text,
          regenerated: fb.regenerated,
          adminId: fb.admin_id,
          createdAt: fb.created_at,
          postTitle: post?.title_en || 'Unknown Post',
          postSlug: post?.slug || '',
        };
      })
    );

    // Apply search filter on post title
    let filteredFeedback = feedbackWithPosts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFeedback = feedbackWithPosts.filter(
        fb => fb.postTitle.toLowerCase().includes(searchLower) ||
             fb.feedbackText?.toLowerCase().includes(searchLower) ||
             fb.postSlug.toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const approved = feedbackData?.filter((f: { feedback_type: string }) => f.feedback_type === 'approve').length || 0;
    const edited = feedbackData?.filter((f: { feedback_type: string }) => f.feedback_type === 'edit').length || 0;
    const rejected = feedbackData?.filter((f: { feedback_type: string }) => f.feedback_type === 'reject').length || 0;
    const regeneratedCount = feedbackData?.filter((f: { regenerated: boolean }) => f.regenerated).length || 0;
    const totalFeedback = feedbackData?.length || 0;

    // Calculate satisfaction rate (approved / total * 100)
    const satisfactionRate = totalFeedback > 0 ? Math.round((approved / totalFeedback) * 100) : 0;

    // Analyze common issues from feedback text
    const issueKeywords: Record<string, number> = {};
    const issuePatterns = [
      { pattern: /도입부|introduction|intro/i, label: 'Introduction needs improvement' },
      { pattern: /가격|price|cost|비용/i, label: 'Pricing information unclear' },
      { pattern: /전문|용어|terminology|technical/i, label: 'Technical terms need explanation' },
      { pattern: /길이|length|짧|short|long|긴/i, label: 'Content length issues' },
      { pattern: /SEO|키워드|keyword/i, label: 'SEO optimization needed' },
      { pattern: /정확|accurate|factual|팩트/i, label: 'Factual accuracy concerns' },
      { pattern: /톤|tone|어조|스타일|style/i, label: 'Tone/style adjustment needed' },
      { pattern: /이미지|image|사진|photo/i, label: 'Image-related issues' },
      { pattern: /구조|structure|형식|format/i, label: 'Structure/formatting issues' },
      { pattern: /CTA|행동|action|call/i, label: 'CTA needs improvement' },
    ];

    // Count occurrences in edit/reject feedback
    const editRejectFeedback = (feedbackData || []).filter(
      (f: { feedback_type: string; feedback_text: string | null }) =>
        (f.feedback_type === 'edit' || f.feedback_type === 'reject') && f.feedback_text
    );

    for (const fb of editRejectFeedback) {
      const text = (fb as { feedback_text: string }).feedback_text;
      for (const { pattern, label } of issuePatterns) {
        if (pattern.test(text)) {
          issueKeywords[label] = (issueKeywords[label] || 0) + 1;
        }
      }
    }

    // Sort and format common issues
    const commonIssues = Object.entries(issueKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: editRejectFeedback.length > 0
          ? Math.round((count / editRejectFeedback.length) * 100)
          : 0,
      }));

    // Calculate trends (daily counts for the period)
    const trends: Array<{ date: string; approved: number; edited: number; rejected: number }> = [];
    const daysInRange = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30;

    for (let i = daysInRange - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayFeedback = (feedbackData || []).filter((f: { created_at: string }) =>
        f.created_at.startsWith(dateStr)
      );

      trends.push({
        date: dateStr,
        approved: dayFeedback.filter((f: { feedback_type: string }) => f.feedback_type === 'approve').length,
        edited: dayFeedback.filter((f: { feedback_type: string }) => f.feedback_type === 'edit').length,
        rejected: dayFeedback.filter((f: { feedback_type: string }) => f.feedback_type === 'reject').length,
      });
    }

    const stats = {
      totalFeedback,
      approved,
      edited,
      rejected,
      regeneratedCount,
      avgResponseTime: 0, // Would need timestamp tracking to calculate
      satisfactionRate,
    };

    secureLog('info', 'Feedback analytics fetched', { stats });

    return createSuccessResponse({
      feedback: filteredFeedback,
      stats,
      trends,
      commonIssues,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
