/**
 * Database Migration Check API
 * GET /api/admin/db-check - 필요한 테이블 존재 여부 확인
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const REQUIRED_TABLES = [
  'content_keywords',
  'content_performance',
  'llm_learning_data',
  'image_generations',
  'publish_history',
  'cron_logs',
  'blog_posts',
  'profiles',
];

export async function GET() {
  try {
    const supabase = await createClient();
    const results: Record<string, { exists: boolean; rowCount?: number; error?: string }> = {};

    for (const tableName of REQUIRED_TABLES) {
      try {
         
        const { count, error } = await (supabase
          .from(tableName) as any)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            results[tableName] = { exists: false, error: 'Table does not exist' };
          } else {
            results[tableName] = { exists: true, error: error.message };
          }
        } else {
          results[tableName] = { exists: true, rowCount: count || 0 };
        }
      } catch (e) {
        results[tableName] = { exists: false, error: String(e) };
      }
    }

    // content_keywords 컬럼 확인 (keyword_native, keyword_ko)
    let keywordColumnsOk = false;
    if (results['content_keywords']?.exists) {
      try {
         
        const { data, error } = await (supabase
          .from('content_keywords') as any)
          .select('keyword_native, keyword_ko')
          .limit(1);

        keywordColumnsOk = !error;
      } catch {
        keywordColumnsOk = false;
      }
    }

    const missingTables = Object.entries(results)
      .filter(([, v]) => !v.exists)
      .map(([k]) => k);

    const migrations = [];
    if (missingTables.includes('content_keywords') || !keywordColumnsOk) {
      migrations.push('003_content_keywords_extension.sql');
    }
    if (missingTables.includes('llm_learning_data')) {
      migrations.push('004_llm_learning_system.sql');
    }
    if (missingTables.includes('content_performance') || missingTables.includes('cron_logs')) {
      migrations.push('005_gsc_integration.sql');
    }
    if (missingTables.includes('image_generations')) {
      migrations.push('006_image_generations.sql');
    }
    if (missingTables.includes('publish_history')) {
      migrations.push('007_publishing_enhancements.sql');
    }

    return NextResponse.json({
      success: true,
      allReady: missingTables.length === 0 && keywordColumnsOk,
      tables: results,
      keywordColumnsOk,
      missingTables,
      requiredMigrations: migrations,
      message: missingTables.length === 0 && keywordColumnsOk
        ? '모든 테이블이 준비되었습니다!'
        : `다음 마이그레이션이 필요합니다: ${migrations.join(', ')}`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
