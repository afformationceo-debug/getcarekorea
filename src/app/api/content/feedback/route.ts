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

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    // Fetch content draft
    const { data: draft, error: fetchError } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('id', contentDraftId)
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    // 1. Store feedback in Upstash Vector for RAG
    console.log(`📝 Storing feedback in vector database...`);

    const feedbackEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: feedbackText,
    });

    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    await vectorIndex.upsert({
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

      const response = await anthropic.messages.create({
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

      // Update draft with regenerated content
      const { error: updateError } = await supabase
        .from('content_drafts')
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
