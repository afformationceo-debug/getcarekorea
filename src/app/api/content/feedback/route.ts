/**
 * Content Feedback API
 *
 * POST /api/content/feedback - Submit feedback and optionally regenerate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Index } from '@upstash/vector';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { buildImprovementPromptV4 } from '@/lib/content/prompts/system-prompt-v4';
import { getAuthorForKeyword } from '@/lib/content/persona';

// Lazy initialization to prevent build-time errors when env vars are missing
let _vectorIndex: Index | null = null;
let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

function getVectorIndex(): Index {
  if (!_vectorIndex) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Upstash Vector credentials not configured');
    }
    _vectorIndex = new Index({ url, token });
  }
  return _vectorIndex;
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// =====================================================
// POST HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const {
      contentDraftId,
      feedbackText,
      feedbackType, // 'positive' | 'negative' | 'edit'
      regenerate,   // boolean: whether to regenerate content
    } = await request.json();

    if (!contentDraftId || !feedbackText || !feedbackType) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['contentDraftId', 'feedbackText', 'feedbackType'],
        },
        { status: 400 }
      );
    }

    // Try fetching from blog_posts first, then fallback to content_drafts
    let draft: any = null;
    let tableName = 'blog_posts';

    // First try blog_posts table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blogPost, error: blogError } = await (supabase.from('blog_posts') as any)
      .select('*')
      .eq('id', contentDraftId)
      .single();

    if (blogPost && !blogError) {
      // Map blog_posts fields to expected format
      const metadata = (blogPost.generation_metadata || {}) as Record<string, any>;
      draft = {
        id: blogPost.id,
        keyword_text: metadata.keyword || '',
        locale: metadata.locale || 'en',
        category: blogPost.category || 'general',
        title: blogPost.title_en || blogPost[`title_${(metadata.locale || 'en').replace('-', '_')}`],
        excerpt: blogPost.excerpt_en || blogPost[`excerpt_${(metadata.locale || 'en').replace('-', '_')}`],
        content: blogPost.content_en || blogPost[`content_${(metadata.locale || 'en').replace('-', '_')}`],
        meta_title: blogPost.meta_title_en || '',
        meta_description: blogPost.meta_description_en || '',
      };
      tableName = 'blog_posts';
    } else {
      // Fallback to content_drafts table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: contentDraft, error: fetchError } = await (supabase.from('content_drafts') as any)
        .select('*')
        .eq('id', contentDraftId)
        .single();

      if (fetchError || !contentDraft) {
        return NextResponse.json(
          { error: 'Content draft not found' },
          { status: 404 }
        );
      }
      draft = contentDraft;
      tableName = 'content_drafts';
    }

    // 1. Store feedback in Upstash Vector for RAG
    console.log(`📝 Storing feedback in vector database...`);

    const feedbackEmbedding = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: feedbackText,
    });

    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    await getVectorIndex().upsert({
      id: feedbackId,
      vector: feedbackEmbedding.data[0].embedding,
      metadata: {
        source: 'user-feedback',
        feedback_type: feedbackType,
        keyword: draft.keyword_text,
        locale: draft.locale,
        category: draft.category,
        content_draft_id: contentDraftId,
        feedback_text: feedbackText,
        created_at: new Date().toISOString(),
      },
    });

    console.log(`✅ Feedback stored: ${feedbackId}`);

    // 2. Optionally regenerate content with feedback
    let regeneratedContent = null;

    if (regenerate) {
      console.log(`🔄 Regenerating content with feedback...`);

      const author = getAuthorForKeyword(draft.keyword_text, draft.category);

      const improvementPrompt = buildImprovementPromptV4({
        originalContent: JSON.stringify({
          title: draft.title,
          excerpt: draft.excerpt,
          content: draft.content,
          metaTitle: draft.meta_title,
          metaDescription: draft.meta_description,
        }),
        feedback: feedbackText,
        author,
      });

      const response = await getAnthropic().messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 16000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: improvementPrompt,
          },
        ],
      });

      // Extract JSON from response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : textContent;

      regeneratedContent = JSON.parse(jsonStr);

      // Update draft with regenerated content based on table type
      if (tableName === 'blog_posts') {
        const metadata = (draft as any).generation_metadata as Record<string, any> || {};
        const localeKey = (metadata.locale || 'en').replace('-', '_');

        const updateData: Record<string, unknown> = {
          [`title_${localeKey}`]: regeneratedContent.title,
          [`excerpt_${localeKey}`]: regeneratedContent.excerpt,
          [`content_${localeKey}`]: regeneratedContent.content,
          [`meta_title_${localeKey}`]: regeneratedContent.metaTitle,
          [`meta_description_${localeKey}`]: regeneratedContent.metaDescription,
          updated_at: new Date().toISOString(),
        };

        // Also update title_en if it's the primary locale
        if (localeKey === 'en') {
          updateData.title_en = regeneratedContent.title;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('blog_posts') as any)
          .update(updateData)
          .eq('id', contentDraftId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('content_drafts') as any)
          .update({
            title: regeneratedContent.title,
            excerpt: regeneratedContent.excerpt,
            content: regeneratedContent.content,
            meta_title: regeneratedContent.metaTitle,
            meta_description: regeneratedContent.metaDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contentDraftId);

        if (updateError) {
          throw updateError;
        }
      }

      console.log(`✅ Content regenerated and updated`);
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      regenerated: regenerate,
      regeneratedContent: regenerate ? regeneratedContent : null,
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
