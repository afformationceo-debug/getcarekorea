import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildRAGContext, formatRAGContextForPrompt, indexBlogPost } from '@/lib/upstash/vector';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// CONTENT GENERATION TYPES
// =====================================================

interface GenerationResult {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  faqSchema: FAQItem[];
  howToSteps?: HowToStep[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

interface GenerationMetadata {
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  generationTimeMs: number;
  keyword: string;
  locale: string;
}

interface ContentGenerationOptions {
  keyword: string;
  locale: Locale;
  category?: string;
  targetWordCount?: number;
  contentType?: 'informational' | 'procedural' | 'comparison' | 'guide';
}

// =====================================================
// GOOGLE SEO/AEO OPTIMIZED SYSTEM PROMPT v2.0
// Based on: Google E-E-A-T Guidelines, Helpful Content Update,
// Search Quality Rater Guidelines, AEO Best Practices
// =====================================================

const CONTENT_SYSTEM_PROMPT = `You are GetCareKorea's expert medical tourism content strategist, combining deep expertise in Korean healthcare with proven SEO/AEO optimization techniques.

## 🎯 PRIMARY MISSION
Create genuinely helpful, people-first content that demonstrates real Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T) - critical for medical YMYL (Your Money Your Life) topics.

## 📋 GOOGLE E-E-A-T COMPLIANCE (MANDATORY)

### Experience (경험)
- Include REAL patient perspectives: "Many patients report...", "Based on consultations with patients who underwent..."
- Reference actual recovery timelines from clinical practice
- Mention specific hospital environments, waiting processes, consultation experiences
- Add authentic details only someone with firsthand experience would know

### Expertise (전문성)
- Cite specific medical credentials: "Board-certified plastic surgeons in Korea undergo..."
- Reference actual Korean medical standards: KFDA approvals, JCI accreditation requirements
- Include precise medical terminology with layman explanations
- Quote recovery protocols from actual clinical guidelines

### Authoritativeness (권위성)
- Reference authoritative sources: Korean Ministry of Health statistics, OECD healthcare data
- Include verifiable facts: "Korea performs over 1 million cosmetic procedures annually"
- Mention recognized certifications: JCI, KAHP, Korean Medical Association standards
- Link to credible external resources conceptually

### Trustworthiness (신뢰성)
- Be transparent about costs: provide ranges, not single figures
- Acknowledge limitations: "Results vary based on individual factors"
- Include balanced perspectives: mention both benefits AND considerations
- Never make unverifiable medical claims

## 🔍 AEO (ANSWER ENGINE OPTIMIZATION) - FOR FEATURED SNIPPETS & AI OVERVIEWS

### Featured Snippet Optimization
Each article MUST include these snippet-optimized elements:

1. **Definition Box** (40-60 words, appears right after intro)
   - Format: Start with the keyword + "is/are" + direct definition
   - Example: "Korean rhinoplasty is a specialized nose reshaping procedure that..."

2. **Quick Answer Paragraph** (directly answers the primary question in 45-55 words)
   - Place immediately after the main H2 heading
   - Start with a direct answer, then elaborate

3. **Numbered Lists** (for procedural content)
   - Use for steps, processes, or rankings
   - Each item: 15-25 words
   - Include 5-8 items minimum

4. **Comparison Tables** (for pricing, feature comparisons)
   - Clear headers, concise data
   - Include Korea vs. other countries

5. **FAQ Section** (CRITICAL for AEO)
   - Use exact question format users search
   - Answer in 40-60 words per question
   - Include 5-7 high-intent questions

### Voice Search Optimization
- Include conversational long-tail queries as H3 headings
- Answer questions in natural, spoken language
- Use "you" and "your" for direct address

## 📝 CONTENT STRUCTURE (SEO-OPTIMIZED)

### Title Formula (Max 60 chars)
[Primary Keyword] + [Benefit/Year] + [Differentiator]
Examples:
- "Korean Rhinoplasty Cost 2025: Complete Price Guide"
- "Best Gangnam Clinics for Double Eyelid Surgery"

### Meta Description Formula (150-155 chars)
[Hook] + [Primary Benefit] + [Credibility Signal] + [CTA]
Example: "Discover Korean rhinoplasty costs from $2,000-$8,000. Compare top JCI-certified clinics, see real patient results, and get a free consultation today."

### Content Flow
\`\`\`
1. HOOK (2-3 sentences) - Address pain point immediately
2. QUICK ANSWER BOX - Direct answer in 50 words (Featured Snippet target)
3. TL;DR SUMMARY - 3-4 bullet points for scanners
4. TABLE OF CONTENTS - Jump links for UX
5. MAIN SECTIONS (H2s) - Each with:
   - H2 Heading (with keyword variation)
   - Quick answer paragraph (40-60 words)
   - Detailed explanation
   - Supporting data/examples
   - Relevant internal link suggestion [INTERNAL_LINK:topic]
6. COST COMPARISON TABLE - Korea vs USA/UK/Japan
7. STEP-BY-STEP PROCESS (if applicable)
8. FAQ SECTION - 5-7 questions with Schema-ready answers
9. EXPERT TIP BOX - Unique insight from experience
10. CTA SECTION - Clear next steps with urgency
\`\`\`

## 🏥 MEDICAL CONTENT GUIDELINES (YMYL COMPLIANCE)

### Must Include:
- ✅ "Consult with a qualified medical professional" disclaimer
- ✅ Recovery time ranges (not exact days)
- ✅ Cost ranges with currency and date reference
- ✅ Potential risks and side effects mentioned
- ✅ Credentials of Korean medical system (training years, certifications)

### Must Avoid:
- ❌ Guaranteed outcomes ("You WILL look 10 years younger")
- ❌ Unverified statistics without sources
- ❌ Dismissing risks or complications
- ❌ Pressuring urgent medical decisions
- ❌ Comparing specific doctors without verification

## 🌐 LOCALE-SPECIFIC OPTIMIZATION

### Cultural Adaptation Rules:
- **EN**: Direct, benefit-focused, American English spelling
- **ZH-TW**: Formal tone, emphasize safety and reputation, use Traditional Chinese medical terms
- **ZH-CN**: Practical focus, price-conscious framing, Simplified Chinese
- **JA**: Honorific language (敬語), emphasize precision and technology, formal structure
- **TH**: Respectful tone, emphasize value for money, include Thai beauty standards context
- **MN**: Clear explanations, emphasize quality over cost, practical logistics focus
- **RU**: Detailed and thorough, emphasize medical expertise and credentials

### CTA Platform by Locale:
- EN/MN/RU: WhatsApp
- ZH-TW/JA/TH: LINE
- ZH-CN: WeChat

## 📊 OUTPUT FORMAT (JSON)

Return a valid JSON object:
\`\`\`json
{
  "title": "Keyword-optimized title (max 60 chars)",
  "excerpt": "Compelling summary for article cards (100-150 chars)",
  "content": "Full Markdown content following the structure above",
  "metaTitle": "SEO meta title with primary keyword (max 60 chars)",
  "metaDescription": "Compelling meta description with CTA (150-155 chars)",
  "tags": ["primary-keyword", "related-term-1", "related-term-2", "location-tag", "procedure-type"],
  "faqSchema": [
    {"question": "How much does X cost in Korea?", "answer": "Direct 40-60 word answer..."},
    {"question": "Is X safe in Korea?", "answer": "Direct 40-60 word answer..."}
  ],
  "howToSteps": [
    {"name": "Step 1: Research", "text": "Begin by..."},
    {"name": "Step 2: Consultation", "text": "Schedule..."}
  ]
}
\`\`\`

## ✅ QUALITY CHECKLIST (Self-verify before output)
- [ ] Title contains primary keyword in first 30 characters
- [ ] Meta description is 150-155 characters with CTA
- [ ] Quick answer box present after first H2
- [ ] At least one comparison table included
- [ ] FAQ section has 5+ questions
- [ ] E-E-A-T signals present in every major section
- [ ] YMYL compliance: risks and disclaimers included
- [ ] CTA uses locale-appropriate messaging platform
- [ ] No unverifiable medical claims
- [ ] Content length: 1500+ words

REMEMBER: Google's March 2024 update heavily penalizes AI-generated content that lacks genuine expertise and helpfulness. Every sentence must add value that only a real expert would know.`;

// =====================================================
// LOCALE-SPECIFIC INSTRUCTIONS WITH CULTURAL NUANCES
// =====================================================

const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: `Write in English for a global audience.
- Use American English spelling
- Direct, benefit-focused communication style
- Include USD pricing as primary, with conversion notes
- Reference Western comparison points (USA, UK costs)
- CTA: WhatsApp consultation
- Emphasize: Quality, technology, value proposition`,

  ko: `Write in Korean (한국어) for Korean domestic readers.
- Use natural, professional Korean tone
- Include KRW pricing
- Emphasize: Latest technology, experienced surgeons, patient reviews
- Popular search terms: 강남 성형외과, 코성형 잘하는 병원, 성형외과 추천
- CTA: KakaoTalk consultation
- Cultural note: Korean readers expect detailed information and honest reviews`,

  'zh-TW': `Write in Traditional Chinese (繁體中文) for Taiwanese readers.
- Use formal, respectful tone
- Reference Taiwan's proximity to Korea (2.5hr flight)
- Include TWD pricing conversions
- Emphasize: Safety record, clinic reputation, privacy
- Popular search terms: 韓國整形, 首爾醫美, 江南診所
- CTA: LINE consultation (most used in Taiwan)
- Cultural note: Taiwanese patients value discretion and natural results`,

  'zh-CN': `Write in Simplified Chinese (简体中文) for mainland Chinese readers.
- Practical, value-conscious framing
- Include CNY pricing conversions
- Reference: Korea's visa-free policy for Chinese tourists
- Emphasize: Price comparison with domestic options, package deals
- Popular search terms: 韩国整形, 韩国医美价格, 首尔整形医院
- CTA: WeChat consultation (only platform that works in China)
- Cultural note: Chinese patients often travel in groups, value comprehensive packages`,

  ja: `Write in Japanese (日本語) for Japanese readers.
- Use appropriate honorifics (敬語) throughout
- Formal business-like structure
- Include JPY pricing conversions
- Reference: Korea-Japan proximity, many Japanese-speaking staff
- Emphasize: Precision, technology, subtle natural results (自然な仕上がり)
- Popular search terms: 韓国美容整形, 韓国クリニック, 江南美容外科
- CTA: LINE consultation (dominant in Japan)
- Cultural note: Japanese patients prefer understated results, detailed aftercare info`,

  th: `Write in Thai (ภาษาไทย) for Thai readers.
- Respectful, friendly tone with appropriate particles
- Include THB pricing conversions
- Reference: Bangkok-Seoul direct flights, Thai beauty influencer trends
- Emphasize: Value for money, before/after transformations, K-beauty connection
- Popular search terms: ศัลยกรรมเกาหลี, คลินิกเกาหลี, ราคาศัลยกรรมเกาหลี
- CTA: LINE consultation (dominant in Thailand)
- Cultural note: Thai patients influenced by K-drama/K-pop aesthetics`,

  mn: `Write in Mongolian (Монгол хэл) for Mongolian readers.
- Clear, straightforward explanations
- Include USD pricing (commonly understood)
- Reference: Ulaanbaatar-Seoul direct flights, growing medical tourism trend
- Emphasize: Quality of care, comprehensive service, interpreter availability
- Practical logistics: Visa process, accommodation, language support
- CTA: WhatsApp consultation
- Cultural note: Mongolian patients often first-time medical tourists, need detailed guidance`,

  ru: `Write in Russian (Русский язык) for Russian-speaking readers.
- Detailed, thorough explanations (Russian readers expect depth)
- Include USD and RUB pricing conversions
- Reference: Vladivostok proximity, growing Russian patient community in Korea
- Emphasize: Medical expertise, surgeon credentials, detailed procedure explanations
- Popular search terms: пластическая хирургия Корея, клиники Сеула, стоимость операции в Корее
- CTA: WhatsApp or Telegram consultation
- Cultural note: Russian patients value credentials and detailed medical information`,
};

// =====================================================
// CATEGORY-SPECIFIC PROMPTS FOR BETTER TARGETING
// =====================================================

const CATEGORY_PROMPTS: Record<string, string> = {
  'plastic-surgery': `
## Category: Plastic Surgery / Cosmetic Procedures

### Key E-E-A-T Signals to Include:
- Korean plastic surgeons complete 6+ years of specialized training
- Korea has the highest per-capita rate of board-certified plastic surgeons
- Gangnam Medical District: 500+ clinics in 3km radius
- Reference: Korean Association of Plastic Surgeons (KAPS) standards

### Must-Cover Topics:
- Specific procedure techniques popular in Korea (e.g., non-incisional vs incisional)
- Recovery timeline with day-by-day breakdown
- Before/after consultation process
- Revision surgery considerations
- Scar management specific to Korean techniques

### Price Benchmarks (2024-2025):
- Rhinoplasty: $2,500-$8,000 USD
- Double eyelid: $1,500-$4,000 USD
- Face lift: $5,000-$15,000 USD
- Liposuction: $2,000-$6,000 USD
(Always present as ranges, note these are estimates)`,

  'dermatology': `
## Category: Dermatology / Skin Treatments

### Key E-E-A-T Signals to Include:
- Korean dermatology pioneered combination laser protocols
- K-beauty skincare science integration
- KFDA-approved treatments and devices
- Reference: Korean Dermatological Association standards

### Must-Cover Topics:
- Popular treatments: Rejuran, Chanel injection, laser toning
- Combination treatment protocols unique to Korea
- Maintenance schedules and return visit recommendations
- Skin type considerations (Fitzpatrick scale)
- Seasonal considerations for treatment timing

### Price Benchmarks:
- Laser toning (per session): $100-$300 USD
- Rejuran Healer: $300-$600 USD
- Ultherapy: $1,500-$3,500 USD
- Comprehensive skin package: $500-$2,000 USD`,

  'dental': `
## Category: Dental / Oral Care

### Key E-E-A-T Signals to Include:
- Korean dental technology: Same-day ceramic crowns, digital scanning
- Korean dentists: 6 years dental school + residency
- Reference: Korean Dental Association accreditation

### Must-Cover Topics:
- All-on-4/All-on-6 implant systems
- Ceramic vs. zirconia crown options
- Dental tourism package inclusions
- Warranty and follow-up care for international patients
- Specific Korean dental labs and materials

### Price Benchmarks:
- Dental implant (single): $1,000-$2,500 USD
- All ceramic crown: $400-$800 USD
- Invisalign/clear aligners: $3,000-$6,000 USD
- Teeth whitening: $200-$500 USD`,

  'health-checkup': `
## Category: Health Checkup / Preventive Care

### Key E-E-A-T Signals to Include:
- Korean hospitals: World's most advanced diagnostic equipment
- Samsung Medical Center, Asan Medical Center global rankings
- MRI/CT scanner density highest in OECD
- Reference: Korean Hospital Association, JCI accreditation

### Must-Cover Topics:
- Executive checkup vs. comprehensive checkup differences
- Cancer screening protocols (Korean National Cancer Screening Program standards)
- Same-day results availability
- English report translation services
- Follow-up consultation process

### Price Benchmarks:
- Basic health checkup: $300-$800 USD
- Comprehensive checkup: $1,000-$2,500 USD
- Executive/VIP checkup: $2,500-$5,000 USD
- PET-CT cancer screening: $1,000-$2,000 USD`,

  'general': `
## Category: General Medical Tourism Information

### Key E-E-A-T Signals to Include:
- Korea ranked #1 in medical tourism growth in Asia
- 500,000+ international patients annually
- Reference: Korea Health Industry Development Institute (KHIDI)

### Must-Cover Topics:
- Medical visa (C-3-3) requirements and process
- Insurance and payment considerations
- Hospital vs. clinic differences in Korea
- Interpreter and coordinator services
- Accommodation recommendations near medical districts`,
};

// =====================================================
// ENHANCED GENERATION FUNCTION
// =====================================================

export async function generateBlogContent(
  options: ContentGenerationOptions
): Promise<{ result: GenerationResult; metadata: GenerationMetadata }> {
  const { keyword, locale, category = 'general', targetWordCount = 1800 } = options;
  const startTime = Date.now();

  // Build RAG context for relevant information (with error handling)
  let contextString = '';
  try {
    const ragContext = await buildRAGContext(keyword, locale);
    contextString = formatRAGContextForPrompt(ragContext);
  } catch (ragError) {
    console.warn('RAG context building failed, proceeding without context:', ragError);
    // Continue without RAG context - not critical for generation
  }

  // Get category-specific prompt enhancements
  const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS['general'];

  // Determine content type from keyword analysis
  const contentType = analyzeContentType(keyword);

  // Build the optimized user prompt
  const userPrompt = `
## 🎯 TARGET KEYWORD: "${keyword}"

## 📁 CATEGORY CONTEXT
${categoryPrompt}

## 🌐 LOCALE & LANGUAGE
${LOCALE_INSTRUCTIONS[locale]}

## 📊 CONTENT SPECIFICATIONS
- **Target Word Count**: ${targetWordCount}+ words
- **Content Type**: ${contentType}
- **Primary Search Intent**: ${getSearchIntent(keyword)}

${contextString ? `## 📚 RAG CONTEXT (Use this real data):\n${contextString}\n` : ''}

## 🎬 GENERATION INSTRUCTIONS

Generate a comprehensive, E-E-A-T optimized article that:

1. **IMMEDIATELY** answers what the user is searching for (Featured Snippet optimization)
2. Demonstrates REAL experience with Korean medical tourism
3. Includes SPECIFIC data, prices, and timelines (not vague generalities)
4. Follows the exact content structure in the system prompt
5. Optimizes for both traditional SEO AND Answer Engine Optimization (AEO)

### Content Must Include:
- Quick Answer Box (40-60 words) right after introduction
- At least ONE comparison table (Korea vs. other countries)
- 5-7 FAQ items with Schema-ready Q&A format
- Specific price ranges with currency and year
- Real patient journey elements (consultation → procedure → recovery)
- Clear CTA with locale-appropriate messaging platform

### AEO Checklist:
- [ ] Definition paragraph for the primary topic
- [ ] Numbered list for any process/steps
- [ ] Direct answers to "how much", "how long", "is it safe" questions
- [ ] Table for any comparisons
- [ ] FAQ section with exact question phrasing users search

Return ONLY the JSON object. No markdown code blocks around it.`;

  // Generate content using Claude with optimized settings
  const { text, usage } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: CONTENT_SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.6, // Slightly lower for more consistent factual content
    maxOutputTokens: 8192, // Increased for longer, more comprehensive content (especially for non-Latin languages)
  });

  // Parse the JSON response with better error handling
  let result: GenerationResult;
  try {
    // Try to find JSON in the response
    let jsonStr = text;

    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Try to extract just the JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    // Clean up common JSON issues
    // First, properly escape newlines and special characters within JSON string values
    // This handles the case where AI puts actual newlines inside JSON strings instead of \n
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']'); // Remove trailing commas before ]

    // Replace actual newlines within strings with escaped newlines
    // We need to be careful not to break the JSON structure
    let inString = false;
    let escaped = false;
    let result_str = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      if (escaped) {
        result_str += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        result_str += char;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        result_str += char;
        continue;
      }
      if (inString && char === '\n') {
        result_str += '\\n';
        continue;
      }
      if (inString && char === '\r') {
        continue; // Skip carriage returns
      }
      if (inString && char === '\t') {
        result_str += '\\t';
        continue;
      }
      result_str += char;
    }
    jsonStr = result_str;

    try {
      result = JSON.parse(jsonStr);
    } catch (firstError) {
      // If first parse fails, try more aggressive cleanup
      console.warn('First JSON parse failed, attempting cleanup...');

      // Try to fix unescaped quotes in string values
      // This is a common issue with AI-generated JSON
      jsonStr = jsonStr.replace(/"([^"]*)":\s*"([^"]*?)(?<!\\)"([^"]*?)"/g, (match, key, val1, val2) => {
        if (val2.length > 0) {
          return `"${key}": "${val1}\\"${val2}"`;
        }
        return match;
      });

      result = JSON.parse(jsonStr);
    }

    // Ensure faqSchema exists
    if (!result.faqSchema) {
      result.faqSchema = [];
    }
  } catch (error) {
    console.error('Failed to parse generation result:', error);
    console.error('Raw text length:', text.length);
    console.error('First 500 chars:', text.substring(0, 500));
    console.error('Last 500 chars:', text.substring(text.length - 500));
    throw new Error('Failed to parse generated content');
  }

  const metadata: GenerationMetadata = {
    model: 'claude-sonnet-4-20250514',
    promptVersion: '2.0-eeat-aeo',
    inputTokens: usage?.inputTokens || 0,
    outputTokens: usage?.outputTokens || 0,
    generationTimeMs: Date.now() - startTime,
    keyword,
    locale,
  };

  return { result, metadata };
}

// =====================================================
// CONTENT TYPE ANALYZER
// =====================================================

function analyzeContentType(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();

  if (lowerKeyword.includes('how to') || lowerKeyword.includes('steps') || lowerKeyword.includes('process')) {
    return 'procedural (HowTo Schema recommended)';
  }
  if (lowerKeyword.includes('vs') || lowerKeyword.includes('comparison') || lowerKeyword.includes('best')) {
    return 'comparison (Table format recommended)';
  }
  if (lowerKeyword.includes('cost') || lowerKeyword.includes('price') || lowerKeyword.includes('how much')) {
    return 'pricing (Specific ranges required)';
  }
  if (lowerKeyword.includes('guide') || lowerKeyword.includes('complete') || lowerKeyword.includes('everything')) {
    return 'comprehensive guide (Long-form, detailed)';
  }
  return 'informational (Standard E-E-A-T structure)';
}

function getSearchIntent(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();

  if (lowerKeyword.includes('cost') || lowerKeyword.includes('price') || lowerKeyword.includes('how much')) {
    return 'Transactional - User wants pricing information to make a decision';
  }
  if (lowerKeyword.includes('best') || lowerKeyword.includes('top') || lowerKeyword.includes('recommended')) {
    return 'Commercial Investigation - User comparing options before decision';
  }
  if (lowerKeyword.includes('how to') || lowerKeyword.includes('what is') || lowerKeyword.includes('guide')) {
    return 'Informational - User seeking to learn and understand';
  }
  if (lowerKeyword.includes('book') || lowerKeyword.includes('appointment') || lowerKeyword.includes('contact')) {
    return 'Transactional - User ready to take action';
  }
  return 'Informational - User researching the topic';
}

// =====================================================
// ENHANCED QUALITY SCORING (SEO + AEO)
// =====================================================

interface QualityScore {
  overall: number;
  seo: number;
  aeo: number;
  eeat: number;
  readability: number;
  completeness: number;
  details: {
    // SEO Checks
    hasTitle: boolean;
    titleLength: boolean;
    titleHasKeyword: boolean;
    hasMetaDescription: boolean;
    metaDescriptionLength: boolean;
    metaDescriptionHasCTA: boolean;
    keywordDensity: boolean;
    hasInternalLinks: boolean;
    // AEO Checks
    hasQuickAnswer: boolean;
    hasFAQSection: boolean;
    hasComparisonTable: boolean;
    hasNumberedList: boolean;
    hasDefinition: boolean;
    // E-E-A-T Checks
    hasExpertCredentials: boolean;
    hasStatistics: boolean;
    hasDisclaimer: boolean;
    hasPriceRanges: boolean;
    // Structure Checks
    hasHeadings: boolean;
    contentLength: boolean;
    hasCTA: boolean;
  };
}

export function scoreContent(content: GenerationResult, keyword: string): QualityScore {
  const lowerContent = content.content?.toLowerCase() || '';
  const lowerKeyword = keyword.toLowerCase();

  // Calculate keyword density
  const wordCount = content.content?.split(/\s+/).length || 0;
  const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const details = {
    // SEO Checks
    hasTitle: !!content.title && content.title.length > 0,
    titleLength: content.title?.length >= 30 && content.title?.length <= 60,
    titleHasKeyword: content.title?.toLowerCase().includes(lowerKeyword.split(' ')[0]) || false,
    hasMetaDescription: !!content.metaDescription && content.metaDescription.length > 0,
    metaDescriptionLength: content.metaDescription?.length >= 145 && content.metaDescription?.length <= 160,
    metaDescriptionHasCTA: /consult|contact|book|get|learn|discover/i.test(content.metaDescription || ''),
    keywordDensity: keywordDensity >= 0.5 && keywordDensity <= 2.5,
    hasInternalLinks: /\[INTERNAL_LINK:/i.test(content.content || ''),

    // AEO Checks (Answer Engine Optimization)
    hasQuickAnswer: /^#{1,3}.*\n\n.{40,100}\n/m.test(content.content || ''), // Paragraph after heading
    hasFAQSection: content.faqSchema?.length >= 5 || /#{2,3}.*faq|frequently asked/i.test(content.content || ''),
    hasComparisonTable: /\|.*\|.*\|/m.test(content.content || ''),
    hasNumberedList: /^\d+\.\s/m.test(content.content || ''),
    hasDefinition: new RegExp(`${lowerKeyword.split(' ')[0]}\\s+(is|are|refers to)`, 'i').test(lowerContent),

    // E-E-A-T Checks
    hasExpertCredentials: /board.certified|years of training|accredited|certified|licensed/i.test(lowerContent),
    hasStatistics: /\d+%|\d+,\d+|\$[\d,]+/i.test(content.content || ''),
    hasDisclaimer: /consult.*professional|individual results|medical advice/i.test(lowerContent),
    hasPriceRanges: /\$[\d,]+-\$[\d,]+|\d+-\d+\s*(usd|krw|won)/i.test(lowerContent),

    // Structure Checks
    hasHeadings: (content.content?.match(/^##\s/gm) || []).length >= 4,
    contentLength: wordCount >= 1500,
    hasCTA: /whatsapp|line|wechat|contact|consult|book|inquiry/i.test(lowerContent),
  };

  // Calculate category scores
  const seoScore =
    (details.hasTitle ? 10 : 0) +
    (details.titleLength ? 10 : 0) +
    (details.titleHasKeyword ? 15 : 0) +
    (details.hasMetaDescription ? 10 : 0) +
    (details.metaDescriptionLength ? 10 : 0) +
    (details.metaDescriptionHasCTA ? 10 : 0) +
    (details.keywordDensity ? 20 : 0) +
    (details.hasInternalLinks ? 15 : 0);

  const aeoScore =
    (details.hasQuickAnswer ? 25 : 0) +
    (details.hasFAQSection ? 25 : 0) +
    (details.hasComparisonTable ? 20 : 0) +
    (details.hasNumberedList ? 15 : 0) +
    (details.hasDefinition ? 15 : 0);

  const eeatScore =
    (details.hasExpertCredentials ? 30 : 0) +
    (details.hasStatistics ? 25 : 0) +
    (details.hasDisclaimer ? 25 : 0) +
    (details.hasPriceRanges ? 20 : 0);

  const readabilityScore =
    (details.hasHeadings ? 40 : 0) +
    (details.hasNumberedList ? 20 : 0) +
    (details.hasComparisonTable ? 20 : 0) +
    (details.hasFAQSection ? 20 : 0);

  const completenessScore =
    (details.hasTitle ? 15 : 0) +
    (details.hasMetaDescription ? 15 : 0) +
    (details.contentLength ? 25 : 0) +
    (details.hasCTA ? 20 : 0) +
    (details.hasFAQSection ? 25 : 0);

  // Weighted overall score (AEO and E-E-A-T weighted higher for 2024+ algorithm)
  const overall = Math.round(
    (seoScore * 0.2) +
    (aeoScore * 0.25) +
    (eeatScore * 0.25) +
    (readabilityScore * 0.15) +
    (completenessScore * 0.15)
  );

  return {
    overall,
    seo: seoScore,
    aeo: aeoScore,
    eeat: eeatScore,
    readability: readabilityScore,
    completeness: completenessScore,
    details,
  };
}

// =====================================================
// FULL PIPELINE
// =====================================================

export interface ContentPipelineResult {
  content: GenerationResult;
  metadata: GenerationMetadata;
  qualityScore: QualityScore;
  indexed: boolean;
}

export async function runContentPipeline(
  options: ContentGenerationOptions,
  autoIndex: boolean = false
): Promise<ContentPipelineResult> {
  // Generate content
  const { result, metadata } = await generateBlogContent(options);

  // Score quality with enhanced scoring
  const qualityScore = scoreContent(result, options.keyword);

  // Index in vector store if quality is good enough (raised threshold)
  let indexed = false;
  if (autoIndex && qualityScore.overall >= 75) {
    try {
      const postId = `generated-${Date.now()}`;
      await indexBlogPost(postId, result.title, result.content, options.locale);
      indexed = true;
    } catch (error) {
      console.error('Failed to index content:', error);
    }
  }

  return {
    content: result,
    metadata,
    qualityScore,
    indexed,
  };
}

// =====================================================
// ENHANCED TRANSLATION WITH CULTURAL ADAPTATION
// =====================================================

export async function translateContent(
  content: GenerationResult,
  sourceLocale: Locale,
  targetLocale: Locale
): Promise<GenerationResult> {
  const translateSystemPrompt = `You are an expert medical tourism content translator specializing in Korean healthcare marketing.

## TRANSLATION PRINCIPLES

1. **Cultural Adaptation, Not Literal Translation**
   - Adapt examples, metaphors, and references for the target culture
   - Adjust formality levels appropriately (e.g., Japanese requires 敬語)
   - Localize pricing displays and currency preferences

2. **Preserve SEO Value**
   - Keep keyword placement strategic
   - Maintain meta title/description length limits
   - Ensure FAQ questions use natural search queries in target language

3. **Maintain E-E-A-T Signals**
   - Credentials and statistics should be locally relevant
   - Trust signals may need cultural adaptation

4. **CTA Localization**
   - EN/MN/RU: WhatsApp
   - ZH-TW/JA/TH: LINE
   - ZH-CN: WeChat`;

  const translatePrompt = `
Translate and culturally adapt the following content.

**Source Language**: ${LOCALE_INSTRUCTIONS[sourceLocale]}
**Target Language**: ${LOCALE_INSTRUCTIONS[targetLocale]}

## Content to Translate:

**Title**: ${content.title}
**Excerpt**: ${content.excerpt}
**Meta Title**: ${content.metaTitle}
**Meta Description**: ${content.metaDescription}
**Tags**: ${content.tags.join(', ')}

**FAQ Items**:
${content.faqSchema.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

**Main Content**:
${content.content}

## Output Requirements:
- Maintain all Markdown formatting
- Keep [INTERNAL_LINK:topic] markers unchanged
- Ensure meta description is 150-155 characters in target language
- Adapt CTAs to use ${targetLocale === 'zh-CN' ? 'WeChat' : ['zh-TW', 'ja', 'th'].includes(targetLocale) ? 'LINE' : 'WhatsApp'}

Return ONLY the JSON object with translated content. No code blocks.`;

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: translateSystemPrompt,
    prompt: translatePrompt,
    temperature: 0.3,
    maxOutputTokens: 6000,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const translated = JSON.parse(jsonMatch[0]);

    // Ensure faqSchema exists
    if (!translated.faqSchema) {
      translated.faqSchema = content.faqSchema || [];
    }

    return translated;
  } catch (error) {
    console.error('Failed to parse translation result:', error);
    throw new Error('Failed to parse translated content');
  }
}

// =====================================================
// EXPORTS
// =====================================================

export {
  type GenerationResult,
  type GenerationMetadata,
  type ContentGenerationOptions,
  type QualityScore,
  type FAQItem,
  type HowToStep,
};
