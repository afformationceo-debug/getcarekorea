/**
 * Import Keywords to Database
 *
 * CSV 파일에서 키워드를 읽어 DB에 삽입
 * 사용: npx tsx scripts/import-keywords.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface KeywordRow {
  keyword: string;
  locale: string;
  category: string;
  search_volume: number;
  status: string;
  priority: number;
}

async function importKeywords() {
  const inputPath = '/Users/jeongwoo/Desktop/project/getcarekorea/data/keywords-categorized.csv';

  console.log('📂 Reading CSV file...');
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.trim().split('\n');

  // 헤더 제외
  const dataLines = lines.slice(1);
  console.log(`📊 Found ${dataLines.length} keywords to import\n`);

  // 배치 처리 (100개씩)
  const batchSize = 100;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    const rows: KeywordRow[] = [];

    for (const line of batch) {
      if (!line.trim()) continue;

      const parts = line.split(',');
      const keyword = parts[0]?.trim();
      const locale = parts[1]?.trim() || 'en';
      const category = parts[2]?.trim() || 'general';
      const searchVolume = parseInt(parts[3]?.trim() || '0', 10);

      if (!keyword) continue;

      // priority 계산: search_volume 기반
      let priority = 1;
      if (searchVolume >= 1000) priority = 10;
      else if (searchVolume >= 500) priority = 8;
      else if (searchVolume >= 200) priority = 6;
      else if (searchVolume >= 100) priority = 4;
      else if (searchVolume >= 50) priority = 2;

      rows.push({
        keyword,
        locale,
        category,
        search_volume: searchVolume,
        status: 'pending',
        priority,
      });
    }

    if (rows.length === 0) continue;

    // DB 삽입
    const { error } = await supabase
      .from('content_keywords')
      .insert(rows);

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      failed += rows.length;
    } else {
      imported += rows.length;
      process.stdout.write(`\r✅ Imported: ${imported} / ${dataLines.length}`);
    }
  }

  console.log('\n\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ❌ Failed: ${failed}`);

  // 최종 카운트 확인
  const { count } = await supabase
    .from('content_keywords')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total keywords in DB: ${count}`);
}

importKeywords().catch(console.error);
