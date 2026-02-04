/**
 * Manual Content Generation API
 *
 * POST /api/content/generate
 *
 * Generates blog content for a specific keyword using the unified pipeline.
 * Used by admin dashboard for manual content generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  runContentGenerationPipeline,
  type ContentGenerationInput,
} from '@/lib/content/content-generation-pipeline';
import { getKSTTimestamp } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  const requestId = `MANUAL-${Date.now().toString(36).toUpperCase()}`;
  console.log(`\n🔵 [${requestId}] MANUAL CONTENT GENERATION REQUEST`);

  try {
    const body = await request.json();
    const {
      keywordId,
      keyword,
      locale = 'en',
      category = 'general',
      includeRAG = true,
      includeImages = true,
      imageCount = 3,
      autoSave = true,
      autoPublish = false,
      additionalInstructions,
    } = body;

    // Validate required fields
    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Get admin client for database operations
    const adminClient = await createAdminClient();

    // If keywordId is not provided, try to find or create the keyword
    let finalKeywordId = keywordId;

    if (!finalKeywordId) {
      // Check if keyword already exists
      const { data: existingKeyword } = await (adminClient.from('content_keywords') as any)
        .select('id, status')
        .eq('keyword', keyword)
        .eq('locale', locale)
        .single();

      if (existingKeyword) {
        finalKeywordId = existingKeyword.id;

        // Update status to generating
        await (adminClient.from('content_keywords') as any)
          .update({ status: 'generating', updated_at: getKSTTimestamp() })
          .eq('id', finalKeywordId);
      } else {
        // Create new keyword entry
        const { data: newKeyword, error: createError } = await (adminClient.from('content_keywords') as any)
          .insert({
            keyword,
            locale,
            category,
            status: 'generating',
            created_at: getKSTTimestamp(),
            updated_at: getKSTTimestamp(),
          })
          .select('id')
          .single();

        if (createError) {
          console.error(`❌ [${requestId}] Failed to create keyword:`, createError.message);
          return NextResponse.json(
            { success: false, error: 'Failed to create keyword entry' },
            { status: 500 }
          );
        }

        finalKeywordId = newKeyword.id;
      }
    } else {
      // Update existing keyword status to generating
      await (adminClient.from('content_keywords') as any)
        .update({ status: 'generating', updated_at: getKSTTimestamp() })
        .eq('id', finalKeywordId);
    }

    // Prepare pipeline input
    const pipelineInput: ContentGenerationInput = {
      keywordId: finalKeywordId,
      keyword,
      locale,
      category,
      includeRAG,
      includeImages,
      imageCount,
      autoPublish,
      additionalInstructions,
    };

    // Run the unified content generation pipeline
    const result = await runContentGenerationPipeline(adminClient, pipelineInput, {
      requestId,
    });

    // If autoSave is false and generation was successful, we would handle differently
    // But for now, the pipeline always saves

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Content generated successfully',
        data: {
          keywordId: result.keywordId,
          blogPostId: result.blogPostId,
          title: result.title,
          locale: result.locale,
          authorPersonaId: result.authorPersonaId,
          authorSlug: result.authorSlug,
          coverImageUrl: result.coverImageUrl,
          coverImageAlt: result.coverImageAlt,
          imagesGenerated: result.imagesGenerated,
          totalCost: result.totalCost,
        },
        saved: true,
        content: {
          id: result.blogPostId,
          title: result.title,
        },
      });
    } else {
      // Reset keyword status on failure
      await (adminClient.from('content_keywords') as any)
        .update({ status: 'pending', updated_at: getKSTTimestamp() })
        .eq('id', finalKeywordId);

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Content generation failed',
          validationErrors: result.validationErrors,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`❌ [${requestId}] Unhandled error:`, error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
