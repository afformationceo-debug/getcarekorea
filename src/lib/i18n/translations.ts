/**
 * Shared i18n translations for categories, specialties, and languages
 *
 * Used by both API routes and frontend components
 */

// Category/Specialty translations
export const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  'plastic-surgery': { en: 'Plastic Surgery', ko: '성형외과', ja: '美容整形', 'zh-TW': '整形外科', 'zh-CN': '整形外科', th: 'ศัลยกรรมตกแต่ง', ru: 'Пластическая хирургия', mn: 'Гоо сайхны мэс засал' },
  'dermatology': { en: 'Dermatology', ko: '피부과', ja: '皮膚科', 'zh-TW': '皮膚科', 'zh-CN': '皮肤科', th: 'ผิวหนัง', ru: 'Дерматология', mn: 'Арьс судлал' },
  'dental': { en: 'Dental', ko: '치과', ja: '歯科', 'zh-TW': '牙科', 'zh-CN': '牙科', th: 'ทันตกรรม', ru: 'Стоматология', mn: 'Шүдний эмнэлэг' },
  'ophthalmology': { en: 'Ophthalmology', ko: '안과', ja: '眼科', 'zh-TW': '眼科', 'zh-CN': '眼科', th: 'จักษุ', ru: 'Офтальмология', mn: 'Нүдний эмч' },
  'orthopedics': { en: 'Orthopedics', ko: '정형외과', ja: '整形外科', 'zh-TW': '骨科', 'zh-CN': '骨科', th: 'กระดูก', ru: 'Ортопедия', mn: 'Ортопед' },
  'health-checkup': { en: 'Health Checkup', ko: '건강검진', ja: '健康診断', 'zh-TW': '健康檢查', 'zh-CN': '健康检查', th: 'ตรวจสุขภาพ', ru: 'Медосмотр', mn: 'Эрүүл мэндийн үзлэг' },
  'cardiology': { en: 'Cardiology', ko: '심장내과', ja: '循環器科', 'zh-TW': '心臟科', 'zh-CN': '心脏科', th: 'หัวใจ', ru: 'Кардиология', mn: 'Зүрхний эмч' },
  'neurology': { en: 'Neurology', ko: '신경과', ja: '神経科', 'zh-TW': '神經科', 'zh-CN': '神经科', th: 'ประสาท', ru: 'Неврология', mn: 'Мэдрэлийн эмч' },
  'oncology': { en: 'Oncology', ko: '종양내과', ja: '腫瘍科', 'zh-TW': '腫瘤科', 'zh-CN': '肿瘤科', th: 'มะเร็ง', ru: 'Онкология', mn: 'Хавдар судлал' },
  'fertility': { en: 'Fertility', ko: '난임/불임', ja: '不妊治療', 'zh-TW': '生殖醫學', 'zh-CN': '生殖医学', th: 'ภาวะมีบุตรยาก', ru: 'Репродуктология', mn: 'Үргүйдэл' },
  'hair-transplant': { en: 'Hair Transplant', ko: '모발이식', ja: '植毛', 'zh-TW': '植髮', 'zh-CN': '植发', th: 'ปลูกผม', ru: 'Пересадка волос', mn: 'Үс шилжүүлэн суулгах' },
  'general': { en: 'General', ko: '일반', ja: '一般', 'zh-TW': '一般', 'zh-CN': '一般', th: 'ทั่วไป', ru: 'Общее', mn: 'Ерөнхий' },
};

// Language code to localized name mapping
export const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  ko: { en: 'Korean', ko: '한국어', ja: '韓国語', 'zh-TW': '韓語', 'zh-CN': '韩语', th: 'เกาหลี', ru: 'Корейский', mn: 'Солонгос' },
  en: { en: 'English', ko: '영어', ja: '英語', 'zh-TW': '英語', 'zh-CN': '英语', th: 'อังกฤษ', ru: 'Английский', mn: 'Англи' },
  ja: { en: 'Japanese', ko: '일본어', ja: '日本語', 'zh-TW': '日語', 'zh-CN': '日语', th: 'ญี่ปุ่น', ru: 'Японский', mn: 'Япон' },
  'zh-TW': { en: 'Chinese (Traditional)', ko: '중국어(번체)', ja: '中国語(繁体)', 'zh-TW': '中文(繁體)', 'zh-CN': '中文(繁体)', th: 'จีน(ตัวเต็ม)', ru: 'Китайский (традиционный)', mn: 'Хятад (уламжлалт)' },
  'zh-CN': { en: 'Chinese (Simplified)', ko: '중국어(간체)', ja: '中国語(簡体)', 'zh-TW': '中文(簡體)', 'zh-CN': '中文(简体)', th: 'จีน(ตัวย่อ)', ru: 'Китайский (упрощенный)', mn: 'Хятад (хялбаршуулсан)' },
  zh: { en: 'Chinese', ko: '중국어', ja: '中国語', 'zh-TW': '中文', 'zh-CN': '中文', th: 'จีน', ru: 'Китайский', mn: 'Хятад' },
  th: { en: 'Thai', ko: '태국어', ja: 'タイ語', 'zh-TW': '泰語', 'zh-CN': '泰语', th: 'ไทย', ru: 'Тайский', mn: 'Тайланд' },
  ru: { en: 'Russian', ko: '러시아어', ja: 'ロシア語', 'zh-TW': '俄語', 'zh-CN': '俄语', th: 'รัสเซีย', ru: 'Русский', mn: 'Орос' },
  mn: { en: 'Mongolian', ko: '몽골어', ja: 'モンゴル語', 'zh-TW': '蒙古語', 'zh-CN': '蒙古语', th: 'มองโกเลีย', ru: 'Монгольский', mn: 'Монгол' },
};

/**
 * Get translated category/specialty name
 */
export function getCategoryName(code: string | null | undefined, targetLocale: string): string {
  if (!code) return '';
  const names = CATEGORY_NAMES[code];
  if (!names) return code;
  return names[targetLocale] || names['en'] || code;
}

/**
 * Get translated language name
 */
export function getLanguageName(code: string | null | undefined, targetLocale: string): string {
  if (!code) return '';
  const langNames = LANGUAGE_NAMES[code];
  if (!langNames) return code;
  return langNames[targetLocale] || langNames['en'] || code;
}
