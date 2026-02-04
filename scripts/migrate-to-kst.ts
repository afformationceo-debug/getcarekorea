/**
 * Migration Script: Convert blog_posts timestamps from UTC to KST
 *
 * Run with: npx tsx scripts/migrate-to-kst.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Convert UTC ISO string to KST time value
 * Supabase stores timestamptz in UTC, so we add 9 hours to the actual value
 * This way, when displayed, it shows KST time
 *
 * Input: "2024-01-15T01:30:00.000Z" (UTC - actual time is 1:30 AM UTC)
 * Output: "2024-01-15T10:30:00.000Z" (stored as UTC but value is KST 10:30 AM)
 */
function utcToKST(utcString: string | null): string | null {
  if (!utcString) return null;

  try {
    const date = new Date(utcString);
    // Add 9 hours for KST
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(date.getTime() + kstOffset);

    // Return as ISO string (Supabase will store in UTC format but the time value is KST)
    return kstDate.toISOString();
  } catch (error) {
    console.error(`Failed to convert: ${utcString}`, error);
    return utcString; // Return original if conversion fails
  }
}

async function migrateBlogPostsToKST() {
  console.log('🚀 Starting UTC to KST migration for blog_posts...\n');

  // Fetch all blog posts
  const { data: posts, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, published_at, created_at, updated_at');

  if (fetchError) {
    console.error('Failed to fetch blog posts:', fetchError);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log('No blog posts found.');
    return;
  }

  console.log(`Found ${posts.length} blog posts to migrate.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const post of posts) {
    try {
      // Convert all timestamp fields to KST
      const updates: Record<string, string | null> = {};

      if (post.published_at) {
        updates.published_at = utcToKST(post.published_at);
      }

      if (post.created_at) {
        updates.created_at = utcToKST(post.created_at);
      }

      if (post.updated_at) {
        updates.updated_at = utcToKST(post.updated_at);
      }

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', post.id);

      if (updateError) {
        console.error(`❌ Failed to update post ${post.slug}:`, updateError);
        errorCount++;
      } else {
        console.log(`✅ Updated: ${post.slug?.substring(0, 50)}`);
        console.log(`   published_at: ${post.published_at} → ${updates.published_at}`);
        console.log(`   created_at: ${post.created_at} → ${updates.created_at}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing post ${post.slug}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   Total posts: ${posts.length}`);
  console.log(`   Successfully updated: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(50));
}

async function migrateContentKeywordsToKST() {
  console.log('\n🚀 Starting UTC to KST migration for content_keywords...\n');

  const { data: keywords, error: fetchError } = await supabase
    .from('content_keywords')
    .select('id, keyword, created_at, updated_at');

  if (fetchError) {
    console.error('Failed to fetch content_keywords:', fetchError);
    return;
  }

  if (!keywords || keywords.length === 0) {
    console.log('No content_keywords found.');
    return;
  }

  console.log(`Found ${keywords.length} keywords to check.\n`);

  let successCount = 0;
  let skippedCount = 0;

  for (const keyword of keywords) {
    const updates: Record<string, string | null> = {};

    if (keyword.created_at) {
      updates.created_at = utcToKST(keyword.created_at);
    }

    if (keyword.updated_at) {
      updates.updated_at = utcToKST(keyword.updated_at);
    }

    const { error: updateError } = await supabase
      .from('content_keywords')
      .update(updates)
      .eq('id', keyword.id);

    if (!updateError) {
      successCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`✅ Updated: ${successCount} keywords`);
  console.log(`⏭️  Skipped: ${skippedCount} keywords (already KST or no changes)`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('UTC to KST Timestamp Migration');
  console.log('='.repeat(50) + '\n');

  await migrateBlogPostsToKST();
  await migrateContentKeywordsToKST();

  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
