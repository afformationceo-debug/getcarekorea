/**
 * Image Generation API
 *
 * POST /api/content/generate-images
 *
 * Generates contextual images using DALL-E 3 with automatic ALT tag generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateImages,
  injectImagesIntoHTML,
  type ImageMetadata,
} from '@/lib/content/image-helper';

export const maxDuration = 300; // 5 minutes for multiple images

// =====================================================
// REQUEST TYPES
// =====================================================

interface GenerateImagesRequest {
  contentDraftId: string;
  images: ImageMetadata[];
  keyword: string;
  locale: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
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

    // Parse request body
    const body: GenerateImagesRequest = await request.json();

    const {
      contentDraftId,
      images,
      keyword,
      locale,
      size = '1024x1024',
      quality = 'hd',
      style = 'natural',
    } = body;

    // Validate request
    if (!contentDraftId || !images || !keyword || !locale) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['contentDraftId', 'images', 'keyword', 'locale'],
        },
        { status: 400 }
      );
    }

    console.log(`\n🎨 Image generation request:`);
    console.log(`   Content Draft ID: ${contentDraftId}`);
    console.log(`   Keyword: ${keyword}`);
    console.log(`   Locale: ${locale}`);
    console.log(`   Images to generate: ${images.length}`);
    console.log(`   Quality: ${quality}`);

    // Fetch content draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contentDraft, error: fetchError } = await (supabase.from('content_drafts') as any)
      .select('id, content, images')
      .eq('id', contentDraftId)
      .single();

    if (fetchError || !contentDraft) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    // Generate images
    const result = await generateImages({
      images,
      keyword,
      locale,
      size,
      quality,
      style,
    });

    if (result.errors.length > 0) {
      console.warn(`⚠️  Some images failed to generate:`);
      result.errors.forEach(({ placeholder, error }) => {
        console.warn(`   - ${placeholder}: ${error}`);
      });
    }

    // Inject images into HTML content
    const updatedContent = injectImagesIntoHTML(
      contentDraft.content as string,
      result.images
    );

    // Update content draft with generated images
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('content_drafts') as any)
      .update({
        content: updatedContent,
        images: result.images.map((img) => ({
          placeholder: img.placeholder,
          url: img.url,
          alt: img.alt,
          prompt: img.prompt,
          revised_prompt: img.revised_prompt,
          size: img.size,
          quality: img.quality,
        })),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentDraftId);

    if (updateError) {
      throw updateError;
    }

    console.log(`\n✅ Image generation complete!`);
    console.log(`   Generated: ${result.total_generated}/${images.length}`);
    console.log(`   Total cost: $${result.total_cost.toFixed(3)}`);

    return NextResponse.json({
      success: true,
      contentDraftId,
      images: result.images.map((img) => ({
        placeholder: img.placeholder,
        url: img.url,
        alt: img.alt,
        size: img.size,
        quality: img.quality,
      })),
      totalGenerated: result.total_generated,
      totalCost: result.total_cost,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate images',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET HANDLER (Status Check)
// =====================================================

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const contentDraftId = searchParams.get('contentDraftId');

    if (!contentDraftId) {
      return NextResponse.json(
        { error: 'contentDraftId parameter required' },
        { status: 400 }
      );
    }

    // Fetch content draft with images
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contentDraft, error } = await (supabase.from('content_drafts') as any)
      .select('id, title, locale, images, created_at, updated_at')
      .eq('id', contentDraftId)
      .single();

    if (error || !contentDraft) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = (contentDraft.images as any[]) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasGeneratedImages = images.some((img: any) => img.url);

    return NextResponse.json({
      success: true,
      contentDraftId: contentDraft.id,
      title: contentDraft.title,
      locale: contentDraft.locale,
      images: images,
      totalImages: images.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generatedImages: images.filter((img: any) => img.url).length,
      hasGeneratedImages,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch images:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
