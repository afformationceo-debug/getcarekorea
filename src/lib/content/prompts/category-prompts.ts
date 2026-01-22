/**
 * Category-Specific Prompts v3.0
 *
 * 각 의료 카테고리별 전문화된 프롬프트
 * - 시술 상세 정보
 * - 가격 벤치마크
 * - E-E-A-T 신호
 * - FAQ 템플릿
 */

// =====================================================
// TYPES
// =====================================================

export interface CategoryPromptConfig {
  category: string;
  displayName: string;
  description: string;
  eeatSignals: string[];
  mustCoverTopics: string[];
  priceBenchmarks: Array<{
    procedure: string;
    priceRange: string;
    note?: string;
  }>;
  commonFAQs: string[];
  keyProcedures: string[];
  recoveryInfo: {
    typical: string;
    factors: string[];
  };
  riskDisclaimer: string;
  qualityIndicators: string[];
}

// =====================================================
// CATEGORY CONFIGURATIONS
// =====================================================

export const CATEGORY_PROMPT_CONFIGS: Record<string, CategoryPromptConfig> = {
  'plastic-surgery': {
    category: 'plastic-surgery',
    displayName: 'Plastic Surgery / Cosmetic Procedures',
    description: '성형외과 및 미용 시술 관련 콘텐츠',
    eeatSignals: [
      'Korean plastic surgeons complete 6+ years of specialized training after medical school',
      'Korea has the highest per-capita rate of board-certified plastic surgeons globally',
      'Gangnam Medical District: 500+ clinics concentrated in 3km radius',
      'Korean Association of Plastic Surgeons (KAPS) maintains strict standards',
      'Korea performs over 1 million cosmetic procedures annually',
      'Many surgeons trained at top Korean medical schools (Seoul National, Yonsei, KAIST)',
    ],
    mustCoverTopics: [
      'Specific procedure techniques popular in Korea (e.g., non-incisional vs incisional)',
      'Recovery timeline with realistic day-by-day breakdown',
      'Before/after consultation process details',
      'Revision surgery considerations and statistics',
      'Scar management specific to Korean techniques',
      'Anesthesia options (local vs general)',
      'Hospital stay requirements',
      'Post-operative care package inclusions',
    ],
    priceBenchmarks: [
      { procedure: 'Rhinoplasty', priceRange: '$2,500-$8,000 USD', note: 'Varies by complexity' },
      { procedure: 'Double Eyelid Surgery', priceRange: '$1,500-$4,000 USD', note: 'Non-incisional vs incisional' },
      { procedure: 'Face Lift', priceRange: '$5,000-$15,000 USD', note: 'Mini vs full face lift' },
      { procedure: 'Liposuction', priceRange: '$2,000-$6,000 USD', note: 'Per area' },
      { procedure: 'Breast Augmentation', priceRange: '$4,000-$10,000 USD', note: 'Implant type affects price' },
      { procedure: 'Jaw Reduction', priceRange: '$5,000-$12,000 USD', note: 'V-line surgery' },
      { procedure: 'Fat Grafting', priceRange: '$2,000-$5,000 USD', note: 'Per area' },
    ],
    commonFAQs: [
      'How much does [procedure] cost in Korea?',
      'How long is the recovery time for [procedure]?',
      'Is [procedure] safe in Korea?',
      'What is the best clinic for [procedure] in Gangnam?',
      'Can I combine multiple procedures in one trip?',
      'How do I choose between different techniques?',
      'What should I avoid before and after surgery?',
    ],
    keyProcedures: [
      'Rhinoplasty (nose job)',
      'Blepharoplasty (eyelid surgery)',
      'Face lift / Mini face lift',
      'V-line surgery (jaw reduction)',
      'Breast augmentation',
      'Liposuction',
      'Fat grafting',
      'Facial contouring',
    ],
    recoveryInfo: {
      typical: '1-2 weeks for most procedures, 4-6 weeks for full recovery',
      factors: [
        'Type of procedure',
        'Surgical technique used',
        'Individual healing capacity',
        'Post-operative care compliance',
        'Combination procedures may extend recovery',
      ],
    },
    riskDisclaimer: 'All surgical procedures carry risks including infection, scarring, asymmetry, and anesthesia complications. Results vary by individual. Always consult with a board-certified plastic surgeon.',
    qualityIndicators: [
      'Before/after photos portfolio',
      'Surgeon\'s specialization and case volume',
      'Hospital/clinic accreditation (JCI, KAHP)',
      'English-speaking coordinators',
      'Comprehensive aftercare programs',
    ],
  },

  'dermatology': {
    category: 'dermatology',
    displayName: 'Dermatology / Skin Treatments',
    description: '피부과 및 피부 미용 시술 관련 콘텐츠',
    eeatSignals: [
      'Korean dermatology pioneered combination laser protocols',
      'K-beauty skincare science is globally recognized',
      'KFDA (Korean FDA) approved treatments and devices',
      'Korean Dermatological Association maintains strict treatment standards',
      'Korea leads innovation in skin rejuvenation technology',
      'Many treatments developed specifically for Asian skin types',
    ],
    mustCoverTopics: [
      'Popular treatments: Rejuran, Chanel injection, laser toning, PDRN',
      'Combination treatment protocols unique to Korea',
      'Maintenance schedules and return visit recommendations',
      'Skin type considerations (Fitzpatrick scale)',
      'Seasonal considerations for treatment timing',
      'Pre and post-treatment skincare routines',
      'Treatment frequency recommendations',
    ],
    priceBenchmarks: [
      { procedure: 'Laser Toning (per session)', priceRange: '$100-$300 USD' },
      { procedure: 'Rejuran Healer', priceRange: '$300-$600 USD' },
      { procedure: 'Ultherapy (full face)', priceRange: '$1,500-$3,500 USD' },
      { procedure: 'Comprehensive Skin Package', priceRange: '$500-$2,000 USD' },
      { procedure: 'PDRN/Salmon DNA injection', priceRange: '$200-$400 USD' },
      { procedure: 'Hydrafacial', priceRange: '$150-$300 USD' },
      { procedure: 'Botox (per area)', priceRange: '$200-$500 USD' },
      { procedure: 'Filler (per syringe)', priceRange: '$400-$800 USD' },
    ],
    commonFAQs: [
      'How many sessions do I need for [treatment]?',
      'What is the downtime for laser treatments?',
      'Is [treatment] suitable for my skin type?',
      'Can I combine different skin treatments?',
      'How long do the results last?',
      'What skincare should I use after treatment?',
      'Are Korean skin treatments safe for darker skin tones?',
    ],
    keyProcedures: [
      'Laser toning / Laser resurfacing',
      'Rejuran Healer',
      'Ultherapy / HIFU',
      'Botox / Fillers',
      'Thread lift',
      'Chemical peels',
      'Microneedling',
      'LED therapy',
    ],
    recoveryInfo: {
      typical: 'Most treatments: 0-3 days, Laser resurfacing: 5-7 days',
      factors: [
        'Treatment intensity',
        'Skin sensitivity',
        'Sun exposure post-treatment',
        'Proper aftercare routine',
      ],
    },
    riskDisclaimer: 'Skin treatments may cause temporary redness, swelling, or sensitivity. Results vary based on skin type and condition. Consult with a dermatologist to determine the best treatment plan.',
    qualityIndicators: [
      'FDA/KFDA approved devices',
      'Dermatologist credentials',
      'Treatment customization approach',
      'Pre-treatment skin analysis',
      'Post-treatment care products',
    ],
  },

  'dental': {
    category: 'dental',
    displayName: 'Dental / Oral Care',
    description: '치과 및 구강 관리 관련 콘텐츠',
    eeatSignals: [
      'Korean dental technology: Same-day ceramic crowns, digital scanning',
      'Korean dentists complete 6 years dental school + additional residency',
      'Korean Dental Association accreditation standards',
      'State-of-the-art dental labs producing high-quality prosthetics',
      'Korea is a leader in dental implant technology',
      'Digital smile design technology widely available',
    ],
    mustCoverTopics: [
      'All-on-4/All-on-6 implant systems',
      'Ceramic vs. zirconia crown options',
      'Dental tourism package inclusions',
      'Warranty and follow-up care for international patients',
      'Specific Korean dental labs and materials used',
      'Same-day treatment options',
      'Sedation dentistry availability',
    ],
    priceBenchmarks: [
      { procedure: 'Dental Implant (single)', priceRange: '$1,000-$2,500 USD', note: 'Including crown' },
      { procedure: 'All-on-4', priceRange: '$8,000-$15,000 USD', note: 'Per arch' },
      { procedure: 'All Ceramic Crown', priceRange: '$400-$800 USD' },
      { procedure: 'Zirconia Crown', priceRange: '$500-$1,000 USD' },
      { procedure: 'Invisalign/Clear Aligners', priceRange: '$3,000-$6,000 USD' },
      { procedure: 'Teeth Whitening', priceRange: '$200-$500 USD' },
      { procedure: 'Veneers (per tooth)', priceRange: '$400-$900 USD' },
      { procedure: 'Root Canal', priceRange: '$200-$500 USD' },
    ],
    commonFAQs: [
      'How long do dental implants last?',
      'Is dental work in Korea safe?',
      'How many trips to Korea do I need for implants?',
      'What warranty comes with dental work?',
      'Can I get same-day crowns in Korea?',
      'How does Korean dental quality compare to the US/Europe?',
      'What if I need follow-up care after returning home?',
    ],
    keyProcedures: [
      'Dental implants',
      'All-on-4/All-on-6',
      'Crowns and bridges',
      'Veneers',
      'Invisalign / Clear aligners',
      'Teeth whitening',
      'Root canal treatment',
      'Full mouth restoration',
    ],
    recoveryInfo: {
      typical: 'Implants: 3-6 months healing before final crown, Crowns: same day to 2 weeks',
      factors: [
        'Bone density and quality',
        'Number of procedures',
        'Healing capacity',
        'Oral hygiene maintenance',
      ],
    },
    riskDisclaimer: 'Dental procedures may involve risks such as infection, nerve damage, or implant failure. Success rates for dental implants exceed 95% when performed by qualified professionals. Always choose accredited dental clinics.',
    qualityIndicators: [
      'Digital imaging technology',
      'In-house dental lab',
      'International warranty programs',
      'Multi-lingual dental coordinators',
      'Material certifications (CE, FDA)',
    ],
  },

  'health-checkup': {
    category: 'health-checkup',
    displayName: 'Health Checkup / Preventive Care',
    description: '건강검진 및 예방 의료 관련 콘텐츠',
    eeatSignals: [
      'Korean hospitals have world\'s most advanced diagnostic equipment',
      'Samsung Medical Center, Asan Medical Center global rankings',
      'Highest MRI/CT scanner density in OECD countries',
      'Korean Hospital Association and JCI accreditation',
      'Korea\'s National Cancer Screening Program sets gold standards',
      'Same-day or next-day comprehensive results available',
    ],
    mustCoverTopics: [
      'Executive checkup vs. comprehensive checkup differences',
      'Cancer screening protocols (Korean National Cancer Screening Program standards)',
      'Same-day results availability',
      'English report translation services',
      'Follow-up consultation process',
      'VIP/Executive packages with concierge services',
      'Genetic testing options',
    ],
    priceBenchmarks: [
      { procedure: 'Basic Health Checkup', priceRange: '$300-$800 USD' },
      { procedure: 'Comprehensive Checkup', priceRange: '$1,000-$2,500 USD' },
      { procedure: 'Executive/VIP Checkup', priceRange: '$2,500-$5,000 USD' },
      { procedure: 'PET-CT Cancer Screening', priceRange: '$1,000-$2,000 USD' },
      { procedure: 'Cardiac Checkup (CT angio)', priceRange: '$500-$1,500 USD' },
      { procedure: 'Women\'s Comprehensive Checkup', priceRange: '$1,200-$2,800 USD' },
      { procedure: 'Genetic Cancer Risk Test', priceRange: '$500-$2,000 USD' },
    ],
    commonFAQs: [
      'What does a comprehensive health checkup include?',
      'How long does a full health checkup take?',
      'Can I get results in English?',
      'What is the best hospital for health checkups in Korea?',
      'Do I need to fast before my checkup?',
      'What should I do if something is found during my checkup?',
      'How often should I get a comprehensive health checkup?',
    ],
    keyProcedures: [
      'Full body checkup',
      'Cancer screening (PET-CT)',
      'Cardiac evaluation',
      'Endoscopy (gastroscopy, colonoscopy)',
      'MRI/CT imaging',
      'Genetic testing',
      'Women\'s health screening',
      'Executive health programs',
    ],
    recoveryInfo: {
      typical: 'No recovery needed, results within 1-3 days',
      factors: [
        'Sedation for endoscopy (few hours)',
        'Fasting requirements',
        'Contrast dye considerations',
      ],
    },
    riskDisclaimer: 'Health checkups are diagnostic and may require follow-up tests or treatments. Some procedures like endoscopy carry minimal risks. Discuss any concerns with your healthcare provider.',
    qualityIndicators: [
      'JCI accreditation',
      'Latest generation diagnostic equipment',
      'International patient coordinators',
      'Multilingual result reports',
      'Follow-up telemedicine options',
    ],
  },

  'general': {
    category: 'general',
    displayName: 'General Medical Tourism',
    description: '일반 의료 관광 정보 관련 콘텐츠',
    eeatSignals: [
      'Korea ranked #1 in medical tourism growth in Asia',
      'Over 500,000 international patients annually',
      'Korea Health Industry Development Institute (KHIDI) oversight',
      'Government-backed medical tourism support programs',
      'K-MEDI program for international patient protection',
    ],
    mustCoverTopics: [
      'Medical visa (C-3-3) requirements and process',
      'Insurance and payment considerations',
      'Hospital vs. clinic differences in Korea',
      'Interpreter and coordinator services',
      'Accommodation recommendations near medical districts',
      'Transportation and logistics',
      'Cultural tips for medical tourists',
    ],
    priceBenchmarks: [
      { procedure: 'Medical Interpreter (per day)', priceRange: '$100-$200 USD' },
      { procedure: 'Medical Coordinator Package', priceRange: '$200-$500 USD' },
      { procedure: 'Airport Transfer', priceRange: '$50-$100 USD' },
      { procedure: 'Recovery Accommodation (per night)', priceRange: '$80-$200 USD' },
    ],
    commonFAQs: [
      'How do I plan a medical trip to Korea?',
      'Do I need a visa for medical treatment in Korea?',
      'How do I communicate with doctors in Korea?',
      'What should I pack for medical tourism?',
      'Is medical treatment in Korea safe?',
      'How do I choose the right clinic or hospital?',
      'What happens if something goes wrong?',
    ],
    keyProcedures: [],
    recoveryInfo: {
      typical: 'Varies by treatment type',
      factors: ['Procedure type', 'Individual health', 'Post-care compliance'],
    },
    riskDisclaimer: 'All medical procedures carry some risk. Research thoroughly, choose accredited facilities, and ensure clear communication with your medical team.',
    qualityIndicators: [
      'Government registration',
      'International accreditations',
      'Patient reviews and testimonials',
      'Transparent pricing',
      'Comprehensive aftercare programs',
    ],
  },
};

// =====================================================
// PROMPT GENERATORS
// =====================================================

/**
 * 카테고리별 상세 프롬프트 생성
 */
export function generateCategoryPrompt(category: string): string {
  const config = CATEGORY_PROMPT_CONFIGS[category] || CATEGORY_PROMPT_CONFIGS['general'];

  const priceTable = config.priceBenchmarks
    .map(p => `| ${p.procedure} | ${p.priceRange} | ${p.note || '-'} |`)
    .join('\n');

  return `
## 🏥 CATEGORY: ${config.displayName}

${config.description}

### E-E-A-T Signals (MUST Include)
${config.eeatSignals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Topics to Cover
${config.mustCoverTopics.map(t => `- ${t}`).join('\n')}

### Price Benchmarks (2024-2025)
| Procedure | Price Range | Note |
|-----------|-------------|------|
${priceTable}

⚠️ Always present prices as ranges and note these are estimates subject to change.

### Common FAQ Questions (Include relevant ones)
${config.commonFAQs.map((q, i) => `${i + 1}. ${q}`).join('\n')}

${config.keyProcedures.length > 0 ? `### Key Procedures in This Category
${config.keyProcedures.map(p => `- ${p}`).join('\n')}` : ''}

### Recovery Information
- Typical: ${config.recoveryInfo.typical}
- Factors affecting recovery:
${config.recoveryInfo.factors.map(f => `  - ${f}`).join('\n')}

### Required Disclaimer
"${config.riskDisclaimer}"

### Quality Indicators to Mention
${config.qualityIndicators.map(q => `✓ ${q}`).join('\n')}
`.trim();
}

/**
 * 카테고리 가격 벤치마크 가져오기
 */
export function getCategoryPriceBenchmarks(category: string): CategoryPromptConfig['priceBenchmarks'] {
  const config = CATEGORY_PROMPT_CONFIGS[category] || CATEGORY_PROMPT_CONFIGS['general'];
  return config.priceBenchmarks;
}

/**
 * 카테고리 FAQ 템플릿 가져오기
 */
export function getCategoryFAQTemplates(category: string): string[] {
  const config = CATEGORY_PROMPT_CONFIGS[category] || CATEGORY_PROMPT_CONFIGS['general'];
  return config.commonFAQs;
}

/**
 * 모든 카테고리 목록 가져오기
 */
export function getAllCategories(): string[] {
  return Object.keys(CATEGORY_PROMPT_CONFIGS);
}
