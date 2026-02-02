/**
 * Interpreter Photos API (Admin Only)
 * POST /api/interpreters/[id]/photos - Add a photo
 * PUT /api/interpreters/[id]/photos - Update photo order/caption
 * DELETE /api/interpreters/[id]/photos?photoId=xxx - Delete a photo
 *
 * Note: GET is handled by the main interpreter detail API with includePhotos=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Add a new photo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image_url, caption, display_order } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
    }

    const adminClient = await createAdminClient();

    // Get current max display_order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPhotos } = await (adminClient.from('interpreter_photos') as any)
      .select('display_order')
      .eq('persona_id', id)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = (existingPhotos?.[0] as { display_order?: number })?.display_order ?? -1;
    const newOrder = display_order ?? maxOrder + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: photo, error } = await (adminClient.from('interpreter_photos') as any)
      .insert({
        persona_id: id,
        image_url,
        caption: caption || null,
        display_order: newOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding photo:', error);
      return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 });
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update photo order or caption
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { photos } = body; // Array of { id, display_order, caption }

    if (!Array.isArray(photos)) {
      return NextResponse.json({ error: 'photos array is required' }, { status: 400 });
    }

    const adminClient = await createAdminClient();

    // Update each photo
    for (const photo of photos) {
      const updateData: Record<string, unknown> = {};
      if (typeof photo.display_order === 'number') {
        updateData.display_order = photo.display_order;
      }
      if (photo.caption !== undefined) {
        updateData.caption = photo.caption;
      }

      if (Object.keys(updateData).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from('interpreter_photos') as any)
          .update(updateData)
          .eq('id', photo.id)
          .eq('persona_id', id);
      }
    }

    // Fetch updated photos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedPhotos, error } = await (adminClient.from('interpreter_photos') as any)
      .select('*')
      .eq('persona_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error updating photos:', error);
      return NextResponse.json({ error: 'Failed to update photos' }, { status: 500 });
    }

    return NextResponse.json({ photos: updatedPhotos });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a photo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await createAdminClient();

    // Get the photo to delete (for storage cleanup)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: photo } = await (adminClient.from('interpreter_photos') as any)
      .select('image_url')
      .eq('id', photoId)
      .eq('persona_id', id)
      .single();

    // Delete from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient.from('interpreter_photos') as any)
      .delete()
      .eq('id', photoId)
      .eq('persona_id', id);

    if (error) {
      console.error('Error deleting photo:', error);
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }

    // Optionally delete from storage (if it's in our bucket)
    if (photo?.image_url?.includes('interpreter-photos')) {
      try {
        const path = photo.image_url.split('/interpreter-photos/')[1];
        if (path) {
          await adminClient.storage.from('interpreter-photos').remove([path]);
        }
      } catch (storageError) {
        console.error('Failed to delete from storage:', storageError);
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
