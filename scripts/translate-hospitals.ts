/**
 * Translate hospital descriptions and AI summaries to all languages
 * Uses Claude AI for high-quality medical translations
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !supabaseKey || !anthropicKey) {
  console.error('Missing required environment variables');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_KEY:', !!supabaseKey);
  console.error('ANTHROPIC_KEY:', !!anthropicKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Locale mapping for database columns
const locales = {
  en: 'en',
  ko: 'ko',
  ja: 'ja',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
} as const;

type LocaleKey = keyof typeof locales;

const languageNames: Record<LocaleKey, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  'zh-TW': 'Traditional Chinese (Taiwan)',
  'zh-CN': 'Simplified Chinese',
  th: 'Thai',
  mn: 'Mongolian',
  ru: 'Russian',
};

async function translateText(
  text: string,
  targetLang: LocaleKey,
  context: 'description' | 'summary' | 'name'
): Promise<string> {
  const systemPrompt = context === 'name'
    ? `You are a professional medical translator. Translate hospital/clinic names to ${languageNames[targetLang]}.

CRITICAL: Return ONLY the translated name. No explanations, no notes, no parentheses.

- Keep proper nouns (brand names like "LUHO", "Grand", etc.) unchanged
- Translate generic terms (e.g., "Plastic Surgery" → 整形外科 in Japanese)
- Example: "LUHO Plastic Surgery" → "LUHO整形外科" (Japanese)
- Example: "Grand Dental Clinic" → "Grand牙科診所" (Chinese)`
    : `You are a professional medical translator specializing in Korean medical tourism content.
Translate the following hospital ${context} to ${languageNames[targetLang]}.

CRITICAL: Return ONLY the translated text. Do NOT include:
- Notes or explanations in parentheses
- Meta-commentary about the translation
- Suggestions or questions

Requirements:
- Maintain medical accuracy and professionalism
- Use terminology appropriate for international patients
- Keep the tone informative and trustworthy
- Preserve medical terms in their commonly used form
- For proper nouns (clinic names), keep them unchanged`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: context === 'name' ? 200 : 2000,
      temperature: 0.3, // Lower temperature for more consistent translations
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }
    return text; // Fallback to original
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error);
    return text; // Fallback to original
  }
}

async function translateHospital(hospitalId: string, dryRun = false) {
  // Fetch hospital data
  const { data: hospital, error } = await supabase
    .from('hospitals')
    .select('id, name_ko, name_en, description_ko, description_en, ai_summary_ko, ai_summary_en')
    .eq('id', hospitalId)
    .single();

  if (error || !hospital) {
    console.error(`Failed to fetch hospital ${hospitalId}:`, error);
    return;
  }

  console.log(`\n📋 Translating: ${hospital.name_en || hospital.name_ko}`);
  console.log(`   ID: ${hospital.id}`);

  const updates: Record<string, string> = {};

  // Source texts (prefer English, fallback to Korean)
  const sourceName = hospital.name_en || hospital.name_ko;
  const sourceDescription = hospital.description_en || hospital.description_ko;
  const sourceSummary = hospital.ai_summary_en || hospital.ai_summary_ko;

  // Translate to each language
  for (const [localeKey, dbSuffix] of Object.entries(locales)) {
    const locale = localeKey as LocaleKey;

    // Skip if source language
    if (locale === 'en' || locale === 'ko') continue;

    console.log(`   → Translating to ${languageNames[locale]}...`);

    // Translate name if needed
    if (sourceName && !hospital[`name_${dbSuffix}`]) {
      const translatedName = await translateText(sourceName, locale, 'name');
      updates[`name_${dbSuffix}`] = translatedName;
      console.log(`      Name: ${translatedName}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    // Translate description
    if (sourceDescription && !hospital[`description_${dbSuffix}`]) {
      const translatedDesc = await translateText(sourceDescription, locale, 'description');
      updates[`description_${dbSuffix}`] = translatedDesc;
      console.log(`      Description: ${translatedDesc.substring(0, 60)}...`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    // Translate AI summary
    if (sourceSummary && !hospital[`ai_summary_${dbSuffix}`]) {
      const translatedSummary = await translateText(sourceSummary, locale, 'summary');
      updates[`ai_summary_${dbSuffix}`] = translatedSummary;
      console.log(`      Summary: ${translatedSummary.substring(0, 60)}...`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log('   ✓ Already translated');
    return;
  }

  if (dryRun) {
    console.log('   [DRY RUN] Would update:', Object.keys(updates));
    return;
  }

  // Update database
  const { error: updateError } = await supabase
    .from('hospitals')
    .update(updates)
    .eq('id', hospitalId);

  if (updateError) {
    console.error(`   ✗ Update failed:`, updateError);
  } else {
    console.log(`   ✓ Updated ${Object.keys(updates).length} fields`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const hospitalId = args.find(arg => !arg.startsWith('--'));

  console.log('🌍 Hospital Translation Tool');
  console.log('============================\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes will be made\n');
  }

  if (hospitalId) {
    // Translate single hospital
    await translateHospital(hospitalId, dryRun);
  } else {
    // Translate all hospitals
    const { data: hospitals, error } = await supabase
      .from('hospitals')
      .select('id, name_en, name_ko')
      .in('status', ['published', 'draft'])
      .order('created_at', { ascending: false });

    if (error || !hospitals) {
      console.error('Failed to fetch hospitals:', error);
      process.exit(1);
    }

    console.log(`Found ${hospitals.length} hospitals to process\n`);

    for (const hospital of hospitals) {
      await translateHospital(hospital.id, dryRun);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting between hospitals
    }
  }

  console.log('\n✅ Translation complete!');
}

main().catch(console.error);
