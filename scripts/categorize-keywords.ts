/**
 * Keyword Categorizer
 *
 * 키워드를 분석하여 카테고리 자동 할당
 * 사용: npx tsx scripts/categorize-keywords.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 카테고리 패턴 정의
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'plastic-surgery': [
    // 코 성형
    /rhinoplasty|nose\s*(job|surgery|lift)|nostril|alar|bulbous\s*nose|flat\s*nose|short\s*nose|upturned\s*nose|arrow\s*nose/i,
    /鼻\s*(整形|フル|中隔)|코\s*성형/i,
    // 눈 성형
    /eyelid|blepharoplasty|epicanthoplasty|canthoplasty|double\s*eyelid|ptosis|eye\s*(surgery|lift|bag)|aegyo\s*sal/i,
    /目\s*(整形|の下)|二重|눈\s*성형/i,
    // 얼굴 윤곽
    /facial\s*contour|face\s*contour|jaw\s*(surgery|shaving|reduction|line)|zygoma|cheekbone|v\s*line|genioplasty|chin|mandible/i,
    /輪郭|頬骨|エラ|顎|윤곽|턱\s*수술/i,
    // 리프팅 (수술적)
    /facelift|face\s*lift|mini\s*lift|smas\s*(lift|facelift)|forehead\s*(lift|implant)|brow\s*bone/i,
    /リフト|거상술/i,
    // 가슴 성형
    /breast\s*(augmentation|surgery|implant)|boob|tit|mammoplasty|豊胸/i,
    // 지방흡입 (수술적)
    /liposuction|lipo\s*(in|korea)|tummy\s*tuck|body\s*contour|脂肪吸引/i,
    // 입술/입
    /lip\s*(lift|surgery)|protruding\s*(mouth|lip)|mouth\s*protrusion|philtrum/i,
    // 일반 성형외과 키워드
    /plastic\s*surgery|cosmetic\s*surgery|整形|성형외과/i,
    // 특정 클리닉 (성형외과)
    /da\s*(plastic|clinic|hospital|surgery)|nana\s*(plastic|hospital)|view\s*plastic|banobagi|wonjin|girin|id\s*hospital/i,
    /gangnam\s*(plastic|face)|seoul\s*plastic/i,
  ],

  'dermatology': [
    // 피부 시술
    /rejuran|oligio|botox|filler|hyaluronic|thread\s*lift|糸リフト|실리프트/i,
    /skin\s*(treatment|clinic|booster|care)|피부\s*(치료|관리)/i,
    // 레이저
    /laser|pico|fraxel|thermage|ulthera|hifu|inmode|titanium\s*lift|リフティング/i,
    /レーザー|레이저/i,
    // 주사 시술
    /injection|booster|water\s*glow|aqua\s*peel|水光注射/i,
    // 점/흉터 제거
    /mole\s*removal|tattoo\s*removal|scar|acne|ほくろ|タトゥー|점\s*제거/i,
    /シミ|クマ|ニキビ/i,
    // 피부과 클리닉
    /dermatology|skin\s*clinic|皮膚科|피부과/i,
    /ppeum|lienjang|eraser\s*clinic/i,
    // 미용 시술
    /microblading|permanent\s*makeup|semi\s*permanent|アートメイク|반영구/i,
    /eyebrow\s*(tattoo|art)|lip\s*(art|filler)|눈썹\s*(문신|아트)/i,
    // K-뷰티 트리트먼트
    /k.?beauty|korean\s*(skin|beauty)|肌管理|피부\s*관리/i,
    /juvelook|ジュベルック|쥬베룩/i,
  ],

  'dental': [
    /dental|dentist|tooth|teeth|orthodont|veneers|implant\s*tooth|치과|歯科/i,
    /eu\s*dental/i,
  ],

  'ophthalmology': [
    /lasik|lasek|eye\s*correct|vision\s*correct|cataract|안과|眼科/i,
  ],

  'hair-transplant': [
    /hair\s*(transplant|restoration|loss)|fue|fut|모발\s*이식|植毛/i,
  ],

  'health-checkup': [
    /health\s*check|medical\s*check|screening|검진|健康診断/i,
  ],

  'weight-loss': [
    /weight\s*loss|bariatric|gastric|diet\s*surgery|비만\s*수술/i,
    /fat\s*dissolv|脂肪溶解|지방\s*분해/i,
  ],
};

// locale 매핑
function mapLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'US': 'en',
    'JP': 'ja',
    'KR': 'ko',
    'CN': 'zh-CN',
    'TW': 'zh-TW',
    'TH': 'th',
    'MN': 'mn',
    'RU': 'ru',
  };
  return localeMap[locale] || locale.toLowerCase();
}

// 카테고리 결정
function determineCategory(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();

  // 우선순위대로 체크 (더 구체적인 것부터)
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(keyword)) {
        return category;
      }
    }
  }

  // 기본값
  return 'plastic-surgery'; // 대부분이 성형외과 관련
}

// 메인 함수
async function main() {
  const inputPath = '/Users/jeongwoo/Downloads/keywords - Sheet1.csv';
  const outputPath = '/Users/jeongwoo/Desktop/project/getcarekorea/data/keywords-categorized.csv';

  // CSV 읽기
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.trim().split('\n');
  const header = lines[0];

  console.log(`📊 Processing ${lines.length - 1} keywords...\n`);

  // 카테고리별 카운트
  const categoryCount: Record<string, number> = {};

  // 처리된 라인
  const processedLines: string[] = [header];

  // 중복 체크용
  const seen = new Set<string>();
  let duplicates = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // CSV 파싱 (간단한 버전)
    const parts = line.split(',');
    const keyword = parts[0]?.trim();
    let locale = parts[1]?.trim() || 'en';
    let category = parts[2]?.trim();
    const searchVolume = parts[3]?.trim() || '0';

    if (!keyword) continue;

    // 중복 체크 (keyword + locale)
    const key = `${keyword}|${locale}`;
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);

    // locale 변환
    locale = mapLocale(locale);

    // 카테고리가 없으면 자동 할당
    if (!category) {
      category = determineCategory(keyword);
    }

    // 카운트
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    // 새 라인 생성
    processedLines.push(`${keyword},${locale},${category},${searchVolume}`);
  }

  // 결과 저장
  fs.writeFileSync(outputPath, processedLines.join('\n'), 'utf-8');

  // 통계 출력
  console.log('📈 Category Distribution:');
  const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    console.log(`   ${cat}: ${count}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total keywords: ${processedLines.length - 1}`);
  console.log(`   Duplicates removed: ${duplicates}`);
  console.log(`\n✅ Saved to: ${outputPath}`);
}

main().catch(console.error);
