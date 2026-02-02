const fs = require('fs');
const path = require('path');

// Complete interpreters translations for all languages
const interpretersTranslations = {
  ko: {
    title: "의료 통역사",
    subtitle: "의료 여행을 도와드릴 전문 통역사",
    heroTitle1: "의료",
    heroTitle2: "통역사",
    heroDescription: "귀하의 언어를 구사하는 인증된 의료 통역사를 만나보세요.",
    freeService: "무료 플랫폼 서비스",
    aiPoweredMatching: "AI 기반 매칭",
    searchPlaceholder: "이름, 언어, 전문 분야로 통역사 검색...",
    found: "통역사 {count}명 검색됨",
    stats: {
      languages: "언어",
      certified: "인증",
      support: "지원",
      serviceFee: "서비스 비용"
    },
    filters: {
      language: "언어",
      allLanguages: "전체 언어",
      specialty: "전문 분야",
      allSpecialties: "전체 전문 분야",
      availability: "예약 가능",
      all: "전체",
      availableNow: "지금 가능"
    },
    card: {
      available: "예약 가능",
      unavailable: "예약 불가",
      verified: "인증됨",
      viewProfile: "프로필 보기",
      yearsExp: "년 경력",
      bookings: "예약 완료"
    },
    noResults: {
      title: "검색 결과가 없습니다",
      description: "필터나 검색어를 조정해 보세요"
    },
    cta: {
      title: "적합한 통역사를 찾지 못하셨나요?",
      description: "AI가 귀하의 요구 사항, 언어, 의료 전문 분야에 맞는 완벽한 통역사를 매칭해 드립니다.",
      button: "AI 매칭 통역사 찾기"
    },
    languages: {
      en: "영어",
      ko: "한국어",
      "zh-CN": "중국어(간체)",
      "zh-TW": "중국어(번체)",
      ja: "일본어",
      th: "태국어",
      ru: "러시아어",
      mn: "몽골어"
    },
    specialties: {
      "Plastic Surgery": "성형외과",
      "Dermatology": "피부과",
      "Dental": "치과",
      "Health Checkup": "건강검진",
      "Fertility": "난임치료",
      "Hair Transplant": "모발이식",
      "Ophthalmology": "안과"
    },
    detail: {
      home: "홈",
      interpreters: "통역사",
      availableNow: "지금 가능",
      unavailable: "현재 불가",
      verified: "인증됨",
      experience: "년 이상 경력",
      bookingsCompleted: "예약 완료",
      reviews: "리뷰",
      watchIntro: "소개 영상 보기",
      about: "소개",
      services: "서비스",
      aboutMe: "자기 소개",
      education: "학력",
      certifications: "자격증",
      languageProficiency: "언어 능력",
      native: "원어민",
      fluent: "유창",
      conversational: "회화 가능",
      servicesOffered: "제공 서비스",
      excellentService: "우수한 서비스",
      ratingDescription: "전문성, 정확성, 환자 케어로 높은 평가를 받고 있습니다.",
      bookNow: "지금 예약",
      save: "저장",
      share: "공유",
      sendMessage: "메시지 보내기",
      bookYourInterpreter: "통역사 예약",
      readyToAssist: "도움 준비 완료",
      professionalInterpretation: "한국에서의 의료 여정을 위한 전문 통역 서비스.",
      freeCancellation: "무료 취소",
      response24h: "24시간 응답",
      whyChooseMe: "왜 저를 선택해야 하나요?",
      verifiedProfessional: "검증된 전문가",
      multiLingualExpert: "다국어 전문가",
      medicalCertified: "의료 인증",
      flexibleSchedule: "유연한 일정"
    }
  },
  en: {
    title: "Medical Interpreters",
    subtitle: "Professional interpreters to assist your medical journey",
    heroTitle1: "Medical",
    heroTitle2: "Interpreters",
    heroDescription: "Connect with certified medical interpreters who speak your language.",
    freeService: "Free platform service.",
    aiPoweredMatching: "AI-Powered Matching",
    searchPlaceholder: "Search interpreters by name, language, specialty...",
    found: "Found {count} interpreters",
    stats: {
      languages: "Languages",
      certified: "Certified",
      support: "Support",
      serviceFee: "Service Fee"
    },
    filters: {
      language: "Language",
      allLanguages: "All Languages",
      specialty: "Specialty",
      allSpecialties: "All Specialties",
      availability: "Availability",
      all: "All",
      availableNow: "Available Now"
    },
    card: {
      available: "Available",
      unavailable: "Unavailable",
      verified: "Verified",
      viewProfile: "View Profile",
      yearsExp: "yrs",
      bookings: "bookings"
    },
    noResults: {
      title: "No interpreters found",
      description: "Try adjusting your filters or search term"
    },
    cta: {
      title: "Can't find the right interpreter?",
      description: "Our AI will match you with the perfect interpreter based on your specific needs, language, and medical specialty.",
      button: "Get AI-Matched Interpreter"
    },
    languages: {
      en: "English",
      ko: "Korean",
      "zh-CN": "Chinese (Simplified)",
      "zh-TW": "Chinese (Traditional)",
      ja: "Japanese",
      th: "Thai",
      ru: "Russian",
      mn: "Mongolian"
    },
    specialties: {
      "Plastic Surgery": "Plastic Surgery",
      "Dermatology": "Dermatology",
      "Dental": "Dental",
      "Health Checkup": "Health Checkup",
      "Fertility": "Fertility",
      "Hair Transplant": "Hair Transplant",
      "Ophthalmology": "Ophthalmology"
    },
    detail: {
      home: "Home",
      interpreters: "Interpreters",
      availableNow: "Available Now",
      unavailable: "Currently Unavailable",
      verified: "Verified",
      experience: "+ years experience",
      bookingsCompleted: "bookings completed",
      reviews: "reviews",
      watchIntro: "Watch Intro",
      about: "About",
      services: "Services",
      aboutMe: "About Me",
      education: "Education",
      certifications: "Certifications",
      languageProficiency: "Language Proficiency",
      native: "Native",
      fluent: "Fluent",
      conversational: "Conversational",
      servicesOffered: "Services Offered",
      excellentService: "Excellent Service",
      ratingDescription: "Highly rated by patients for professionalism, accuracy, and patient care.",
      bookNow: "Book Now",
      save: "Save",
      share: "Share",
      sendMessage: "Send Message",
      bookYourInterpreter: "Book Your Interpreter",
      readyToAssist: "Ready to Assist",
      professionalInterpretation: "Professional interpretation for your medical journey in Korea.",
      freeCancellation: "Free Cancellation",
      response24h: "24h Response",
      whyChooseMe: "Why Choose Me?",
      verifiedProfessional: "Verified Professional",
      multiLingualExpert: "Multi-lingual Expert",
      medicalCertified: "Medical Certified",
      flexibleSchedule: "Flexible Schedule"
    }
  },
  ja: {
    title: "医療通訳士",
    subtitle: "医療ツアーをサポートするプロの通訳士",
    heroTitle1: "医療",
    heroTitle2: "通訳士",
    heroDescription: "あなたの言語を話す認定医療通訳士とつながりましょう。",
    freeService: "無料プラットフォームサービス",
    aiPoweredMatching: "AIマッチング",
    searchPlaceholder: "名前、言語、専門分野で通訳士を検索...",
    found: "通訳士 {count}名 見つかりました",
    stats: {
      languages: "言語",
      certified: "認定",
      support: "サポート",
      serviceFee: "サービス料"
    },
    filters: {
      language: "言語",
      allLanguages: "全ての言語",
      specialty: "専門分野",
      allSpecialties: "全ての専門分野",
      availability: "予約可能",
      all: "全て",
      availableNow: "今すぐ可能"
    },
    card: {
      available: "予約可能",
      unavailable: "予約不可",
      verified: "認証済み",
      viewProfile: "プロフィールを見る",
      yearsExp: "年",
      bookings: "予約完了"
    },
    noResults: {
      title: "通訳士が見つかりません",
      description: "フィルターや検索条件を調整してみてください"
    },
    cta: {
      title: "適切な通訳士が見つかりませんか？",
      description: "AIがあなたのニーズ、言語、医療専門分野に合った完璧な通訳士をマッチングします。",
      button: "AIマッチング通訳士を探す"
    },
    languages: {
      en: "英語",
      ko: "韓国語",
      "zh-CN": "中国語（簡体字）",
      "zh-TW": "中国語（繁体字）",
      ja: "日本語",
      th: "タイ語",
      ru: "ロシア語",
      mn: "モンゴル語"
    },
    specialties: {
      "Plastic Surgery": "美容整形",
      "Dermatology": "皮膚科",
      "Dental": "歯科",
      "Health Checkup": "健康診断",
      "Fertility": "不妊治療",
      "Hair Transplant": "植毛",
      "Ophthalmology": "眼科"
    },
    detail: {
      home: "ホーム",
      interpreters: "通訳士",
      availableNow: "今すぐ可能",
      unavailable: "現在不可",
      verified: "認証済み",
      experience: "年以上の経験",
      bookingsCompleted: "予約完了",
      reviews: "レビュー",
      watchIntro: "紹介動画を見る",
      about: "紹介",
      services: "サービス",
      aboutMe: "自己紹介",
      education: "学歴",
      certifications: "資格",
      languageProficiency: "言語能力",
      native: "ネイティブ",
      fluent: "流暢",
      conversational: "会話可能",
      servicesOffered: "提供サービス",
      excellentService: "優れたサービス",
      ratingDescription: "専門性、正確性、患者ケアで高い評価を受けています。",
      bookNow: "今すぐ予約",
      save: "保存",
      share: "共有",
      sendMessage: "メッセージを送る",
      bookYourInterpreter: "通訳士を予約",
      readyToAssist: "サポート準備完了",
      professionalInterpretation: "韓国での医療旅行のためのプロフェッショナル通訳サービス。",
      freeCancellation: "無料キャンセル",
      response24h: "24時間対応",
      whyChooseMe: "私を選ぶ理由",
      verifiedProfessional: "認証済み専門家",
      multiLingualExpert: "多言語エキスパート",
      medicalCertified: "医療認定",
      flexibleSchedule: "柔軟なスケジュール"
    }
  },
  "zh-CN": {
    title: "医疗翻译",
    subtitle: "协助您医疗之旅的专业翻译",
    heroTitle1: "医疗",
    heroTitle2: "翻译",
    heroDescription: "与会说您语言的认证医疗翻译联系。",
    freeService: "免费平台服务",
    aiPoweredMatching: "AI智能匹配",
    searchPlaceholder: "按姓名、语言、专业搜索翻译...",
    found: "找到 {count} 位翻译",
    stats: {
      languages: "语言",
      certified: "认证",
      support: "支持",
      serviceFee: "服务费"
    },
    filters: {
      language: "语言",
      allLanguages: "所有语言",
      specialty: "专业领域",
      allSpecialties: "所有专业",
      availability: "可预约",
      all: "全部",
      availableNow: "现在可预约"
    },
    card: {
      available: "可预约",
      unavailable: "不可预约",
      verified: "已认证",
      viewProfile: "查看资料",
      yearsExp: "年",
      bookings: "次预约"
    },
    noResults: {
      title: "未找到翻译",
      description: "请尝试调整筛选条件或搜索词"
    },
    cta: {
      title: "找不到合适的翻译？",
      description: "我们的AI将根据您的具体需求、语言和医疗专业为您匹配完美的翻译。",
      button: "获取AI匹配翻译"
    },
    languages: {
      en: "英语",
      ko: "韩语",
      "zh-CN": "中文（简体）",
      "zh-TW": "中文（繁体）",
      ja: "日语",
      th: "泰语",
      ru: "俄语",
      mn: "蒙古语"
    },
    specialties: {
      "Plastic Surgery": "整形外科",
      "Dermatology": "皮肤科",
      "Dental": "牙科",
      "Health Checkup": "健康检查",
      "Fertility": "生育治疗",
      "Hair Transplant": "植发",
      "Ophthalmology": "眼科"
    },
    detail: {
      home: "首页",
      interpreters: "翻译",
      availableNow: "现在可预约",
      unavailable: "目前不可",
      verified: "已认证",
      experience: "年以上经验",
      bookingsCompleted: "次预约完成",
      reviews: "条评价",
      watchIntro: "观看介绍",
      about: "关于",
      services: "服务",
      aboutMe: "关于我",
      education: "教育背景",
      certifications: "资质证书",
      languageProficiency: "语言能力",
      native: "母语",
      fluent: "流利",
      conversational: "会话水平",
      servicesOffered: "提供的服务",
      excellentService: "优质服务",
      ratingDescription: "因专业性、准确性和患者护理而获得高度评价。",
      bookNow: "立即预约",
      save: "保存",
      share: "分享",
      sendMessage: "发送消息",
      bookYourInterpreter: "预约翻译",
      readyToAssist: "准备就绪",
      professionalInterpretation: "为您在韩国的医疗之旅提供专业翻译服务。",
      freeCancellation: "免费取消",
      response24h: "24小时响应",
      whyChooseMe: "为什么选择我？",
      verifiedProfessional: "认证专业人士",
      multiLingualExpert: "多语言专家",
      medicalCertified: "医疗认证",
      flexibleSchedule: "灵活时间"
    }
  },
  "zh-TW": {
    title: "醫療翻譯",
    subtitle: "協助您醫療之旅的專業翻譯",
    heroTitle1: "醫療",
    heroTitle2: "翻譯",
    heroDescription: "與會說您語言的認證醫療翻譯聯繫。",
    freeService: "免費平台服務",
    aiPoweredMatching: "AI智能配對",
    searchPlaceholder: "按姓名、語言、專業搜尋翻譯...",
    found: "找到 {count} 位翻譯",
    stats: {
      languages: "語言",
      certified: "認證",
      support: "支援",
      serviceFee: "服務費"
    },
    filters: {
      language: "語言",
      allLanguages: "所有語言",
      specialty: "專業領域",
      allSpecialties: "所有專業",
      availability: "可預約",
      all: "全部",
      availableNow: "現在可預約"
    },
    card: {
      available: "可預約",
      unavailable: "不可預約",
      verified: "已認證",
      viewProfile: "查看資料",
      yearsExp: "年",
      bookings: "次預約"
    },
    noResults: {
      title: "未找到翻譯",
      description: "請嘗試調整篩選條件或搜尋詞"
    },
    cta: {
      title: "找不到合適的翻譯？",
      description: "我們的AI將根據您的具體需求、語言和醫療專業為您配對完美的翻譯。",
      button: "獲取AI配對翻譯"
    },
    languages: {
      en: "英語",
      ko: "韓語",
      "zh-CN": "中文（簡體）",
      "zh-TW": "中文（繁體）",
      ja: "日語",
      th: "泰語",
      ru: "俄語",
      mn: "蒙古語"
    },
    specialties: {
      "Plastic Surgery": "整形外科",
      "Dermatology": "皮膚科",
      "Dental": "牙科",
      "Health Checkup": "健康檢查",
      "Fertility": "生育治療",
      "Hair Transplant": "植髮",
      "Ophthalmology": "眼科"
    },
    detail: {
      home: "首頁",
      interpreters: "翻譯",
      availableNow: "現在可預約",
      unavailable: "目前不可",
      verified: "已認證",
      experience: "年以上經驗",
      bookingsCompleted: "次預約完成",
      reviews: "則評價",
      watchIntro: "觀看介紹",
      about: "關於",
      services: "服務",
      aboutMe: "關於我",
      education: "教育背景",
      certifications: "資格證書",
      languageProficiency: "語言能力",
      native: "母語",
      fluent: "流利",
      conversational: "會話程度",
      servicesOffered: "提供的服務",
      excellentService: "優質服務",
      ratingDescription: "因專業性、準確性和患者護理而獲得高度評價。",
      bookNow: "立即預約",
      save: "儲存",
      share: "分享",
      sendMessage: "發送訊息",
      bookYourInterpreter: "預約翻譯",
      readyToAssist: "準備就緒",
      professionalInterpretation: "為您在韓國的醫療之旅提供專業翻譯服務。",
      freeCancellation: "免費取消",
      response24h: "24小時回應",
      whyChooseMe: "為什麼選擇我？",
      verifiedProfessional: "認證專業人士",
      multiLingualExpert: "多語言專家",
      medicalCertified: "醫療認證",
      flexibleSchedule: "彈性時間"
    }
  },
  th: {
    title: "ล่ามแพทย์",
    subtitle: "ล่ามมืออาชีพช่วยเหลือการเดินทางทางการแพทย์ของคุณ",
    heroTitle1: "ล่าม",
    heroTitle2: "แพทย์",
    heroDescription: "เชื่อมต่อกับล่ามแพทย์ที่ได้รับการรับรองที่พูดภาษาของคุณ",
    freeService: "บริการแพลตฟอร์มฟรี",
    aiPoweredMatching: "การจับคู่ด้วย AI",
    searchPlaceholder: "ค้นหาล่ามตามชื่อ ภาษา ความเชี่ยวชาญ...",
    found: "พบ {count} ล่าม",
    stats: {
      languages: "ภาษา",
      certified: "รับรอง",
      support: "สนับสนุน",
      serviceFee: "ค่าบริการ"
    },
    filters: {
      language: "ภาษา",
      allLanguages: "ทุกภาษา",
      specialty: "ความเชี่ยวชาญ",
      allSpecialties: "ทุกความเชี่ยวชาญ",
      availability: "พร้อมให้บริการ",
      all: "ทั้งหมด",
      availableNow: "พร้อมให้บริการตอนนี้"
    },
    card: {
      available: "พร้อมให้บริการ",
      unavailable: "ไม่พร้อม",
      verified: "ยืนยันแล้ว",
      viewProfile: "ดูโปรไฟล์",
      yearsExp: "ปี",
      bookings: "การจอง"
    },
    noResults: {
      title: "ไม่พบล่าม",
      description: "ลองปรับตัวกรองหรือคำค้นหา"
    },
    cta: {
      title: "หาล่ามที่เหมาะสมไม่ได้?",
      description: "AI ของเราจะจับคู่คุณกับล่ามที่สมบูรณ์แบบตามความต้องการ ภาษา และความเชี่ยวชาญทางการแพทย์ของคุณ",
      button: "รับล่ามที่จับคู่ด้วย AI"
    },
    languages: {
      en: "อังกฤษ",
      ko: "เกาหลี",
      "zh-CN": "จีน (ตัวย่อ)",
      "zh-TW": "จีน (ตัวเต็ม)",
      ja: "ญี่ปุ่น",
      th: "ไทย",
      ru: "รัสเซีย",
      mn: "มองโกเลีย"
    },
    specialties: {
      "Plastic Surgery": "ศัลยกรรมตกแต่ง",
      "Dermatology": "ผิวหนัง",
      "Dental": "ทันตกรรม",
      "Health Checkup": "ตรวจสุขภาพ",
      "Fertility": "การเจริญพันธุ์",
      "Hair Transplant": "ปลูกผม",
      "Ophthalmology": "จักษุ"
    },
    detail: {
      home: "หน้าแรก",
      interpreters: "ล่าม",
      availableNow: "พร้อมให้บริการ",
      unavailable: "ไม่พร้อมในขณะนี้",
      verified: "ยืนยันแล้ว",
      experience: "ปีขึ้นไป",
      bookingsCompleted: "การจองเสร็จสิ้น",
      reviews: "รีวิว",
      watchIntro: "ดูวิดีโอแนะนำ",
      about: "เกี่ยวกับ",
      services: "บริการ",
      aboutMe: "เกี่ยวกับฉัน",
      education: "การศึกษา",
      certifications: "ใบรับรอง",
      languageProficiency: "ความสามารถทางภาษา",
      native: "เจ้าของภาษา",
      fluent: "คล่องแคล่ว",
      conversational: "สนทนาได้",
      servicesOffered: "บริการที่เสนอ",
      excellentService: "บริการยอดเยี่ยม",
      ratingDescription: "ได้รับการจัดอันดับสูงจากผู้ป่วยสำหรับความเป็นมืออาชีพ ความแม่นยำ และการดูแลผู้ป่วย",
      bookNow: "จองเลย",
      save: "บันทึก",
      share: "แชร์",
      sendMessage: "ส่งข้อความ",
      bookYourInterpreter: "จองล่ามของคุณ",
      readyToAssist: "พร้อมช่วยเหลือ",
      professionalInterpretation: "บริการแปลมืออาชีพสำหรับการเดินทางทางการแพทย์ในเกาหลี",
      freeCancellation: "ยกเลิกฟรี",
      response24h: "ตอบกลับใน 24 ชม.",
      whyChooseMe: "ทำไมต้องเลือกฉัน?",
      verifiedProfessional: "ผู้เชี่ยวชาญที่ยืนยันแล้ว",
      multiLingualExpert: "ผู้เชี่ยวชาญหลายภาษา",
      medicalCertified: "รับรองทางการแพทย์",
      flexibleSchedule: "ตารางเวลายืดหยุ่น"
    }
  },
  mn: {
    title: "Эмнэлгийн орчуулагч",
    subtitle: "Таны эмнэлгийн аялалд туслах мэргэжлийн орчуулагч",
    heroTitle1: "Эмнэлгийн",
    heroTitle2: "орчуулагч",
    heroDescription: "Таны хэлээр ярьдаг баталгаажсан эмнэлгийн орчуулагчтай холбогдоорой.",
    freeService: "Үнэгүй платформ үйлчилгээ",
    aiPoweredMatching: "AI-ээр тохирох",
    searchPlaceholder: "Нэр, хэл, мэргэшлээр орчуулагч хайх...",
    found: "{count} орчуулагч олдлоо",
    stats: {
      languages: "Хэл",
      certified: "Баталгаажсан",
      support: "Дэмжлэг",
      serviceFee: "Үйлчилгээний төлбөр"
    },
    filters: {
      language: "Хэл",
      allLanguages: "Бүх хэл",
      specialty: "Мэргэшил",
      allSpecialties: "Бүх мэргэшил",
      availability: "Боломжтой",
      all: "Бүгд",
      availableNow: "Одоо боломжтой"
    },
    card: {
      available: "Боломжтой",
      unavailable: "Боломжгүй",
      verified: "Баталгаажсан",
      viewProfile: "Профайл харах",
      yearsExp: "жил",
      bookings: "захиалга"
    },
    noResults: {
      title: "Орчуулагч олдсонгүй",
      description: "Шүүлтүүр эсвэл хайлтын нөхцөлөө тохируулна уу"
    },
    cta: {
      title: "Тохирох орчуулагч олж чадахгүй байна уу?",
      description: "Манай AI таны хэрэгцээ, хэл, эмнэлгийн мэргэшилд тохирсон төгс орчуулагчийг олж өгнө.",
      button: "AI-ээр орчуулагч олох"
    },
    languages: {
      en: "Англи",
      ko: "Солонгос",
      "zh-CN": "Хятад (Хялбаршуулсан)",
      "zh-TW": "Хятад (Уламжлалт)",
      ja: "Япон",
      th: "Тайланд",
      ru: "Орос",
      mn: "Монгол"
    },
    specialties: {
      "Plastic Surgery": "Гоо сайхны мэс засал",
      "Dermatology": "Арьс судлал",
      "Dental": "Шүдний эмчилгээ",
      "Health Checkup": "Эрүүл мэндийн үзлэг",
      "Fertility": "Үргүйдлийн эмчилгээ",
      "Hair Transplant": "Үс суулгах",
      "Ophthalmology": "Нүдний эмчилгээ"
    },
    detail: {
      home: "Нүүр",
      interpreters: "Орчуулагч",
      availableNow: "Одоо боломжтой",
      unavailable: "Одоогоор боломжгүй",
      verified: "Баталгаажсан",
      experience: "жил дээш туршлагатай",
      bookingsCompleted: "захиалга гүйцэтгэсэн",
      reviews: "сэтгэгдэл",
      watchIntro: "Танилцуулга үзэх",
      about: "Тухай",
      services: "Үйлчилгээ",
      aboutMe: "Миний тухай",
      education: "Боловсрол",
      certifications: "Гэрчилгээ",
      languageProficiency: "Хэлний чадвар",
      native: "Төрөлх",
      fluent: "Чөлөөтэй",
      conversational: "Харилцааны түвшин",
      servicesOffered: "Үзүүлэх үйлчилгээ",
      excellentService: "Маш сайн үйлчилгээ",
      ratingDescription: "Мэргэжлийн ур чадвар, нарийвчлал, өвчтөний халамжаар өндөр үнэлгээ авсан.",
      bookNow: "Одоо захиалах",
      save: "Хадгалах",
      share: "Хуваалцах",
      sendMessage: "Мессеж илгээх",
      bookYourInterpreter: "Орчуулагч захиалах",
      readyToAssist: "Туслахад бэлэн",
      professionalInterpretation: "Солонгос дахь эмнэлгийн аялалд зориулсан мэргэжлийн орчуулгын үйлчилгээ.",
      freeCancellation: "Үнэгүй цуцлалт",
      response24h: "24 цагийн хариулт",
      whyChooseMe: "Яагаад намайг сонгох вэ?",
      verifiedProfessional: "Баталгаажсан мэргэжилтэн",
      multiLingualExpert: "Олон хэлний мэргэжилтэн",
      medicalCertified: "Эмнэлгийн гэрчилгээтэй",
      flexibleSchedule: "Уян хатан цагийн хуваарь"
    }
  },
  ru: {
    title: "Медицинские переводчики",
    subtitle: "Профессиональные переводчики для вашего медицинского путешествия",
    heroTitle1: "Медицинские",
    heroTitle2: "Переводчики",
    heroDescription: "Свяжитесь с сертифицированными медицинскими переводчиками, говорящими на вашем языке.",
    freeService: "Бесплатный сервис платформы",
    aiPoweredMatching: "AI-подбор",
    searchPlaceholder: "Поиск переводчиков по имени, языку, специализации...",
    found: "Найдено {count} переводчиков",
    stats: {
      languages: "Языки",
      certified: "Сертифицированы",
      support: "Поддержка",
      serviceFee: "Плата за услуги"
    },
    filters: {
      language: "Язык",
      allLanguages: "Все языки",
      specialty: "Специализация",
      allSpecialties: "Все специализации",
      availability: "Доступность",
      all: "Все",
      availableNow: "Доступен сейчас"
    },
    card: {
      available: "Доступен",
      unavailable: "Недоступен",
      verified: "Подтверждён",
      viewProfile: "Смотреть профиль",
      yearsExp: "лет",
      bookings: "бронирований"
    },
    noResults: {
      title: "Переводчики не найдены",
      description: "Попробуйте изменить фильтры или поисковый запрос"
    },
    cta: {
      title: "Не можете найти подходящего переводчика?",
      description: "Наш AI подберёт идеального переводчика на основе ваших потребностей, языка и медицинской специализации.",
      button: "Получить AI-подбор переводчика"
    },
    languages: {
      en: "Английский",
      ko: "Корейский",
      "zh-CN": "Китайский (упрощённый)",
      "zh-TW": "Китайский (традиционный)",
      ja: "Японский",
      th: "Тайский",
      ru: "Русский",
      mn: "Монгольский"
    },
    specialties: {
      "Plastic Surgery": "Пластическая хирургия",
      "Dermatology": "Дерматология",
      "Dental": "Стоматология",
      "Health Checkup": "Медосмотр",
      "Fertility": "Лечение бесплодия",
      "Hair Transplant": "Пересадка волос",
      "Ophthalmology": "Офтальмология"
    },
    detail: {
      home: "Главная",
      interpreters: "Переводчики",
      availableNow: "Доступен сейчас",
      unavailable: "Недоступен сейчас",
      verified: "Подтверждён",
      experience: "лет опыта",
      bookingsCompleted: "бронирований выполнено",
      reviews: "отзывов",
      watchIntro: "Смотреть презентацию",
      about: "О себе",
      services: "Услуги",
      aboutMe: "Обо мне",
      education: "Образование",
      certifications: "Сертификаты",
      languageProficiency: "Владение языками",
      native: "Родной",
      fluent: "Свободный",
      conversational: "Разговорный",
      servicesOffered: "Предлагаемые услуги",
      excellentService: "Отличный сервис",
      ratingDescription: "Высоко оценён пациентами за профессионализм, точность и заботу о пациентах.",
      bookNow: "Забронировать",
      save: "Сохранить",
      share: "Поделиться",
      sendMessage: "Отправить сообщение",
      bookYourInterpreter: "Забронировать переводчика",
      readyToAssist: "Готов помочь",
      professionalInterpretation: "Профессиональный перевод для вашего медицинского путешествия в Корею.",
      freeCancellation: "Бесплатная отмена",
      response24h: "Ответ в течение 24ч",
      whyChooseMe: "Почему выбрать меня?",
      verifiedProfessional: "Проверенный специалист",
      multiLingualExpert: "Эксперт по языкам",
      medicalCertified: "Медицинский сертификат",
      flexibleSchedule: "Гибкий график"
    }
  }
};

// Update each language file
const locales = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

locales.forEach(locale => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update the interpreters section
    content.interpreters = interpretersTranslations[locale];

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${locale}.json`);
  } catch (err) {
    console.error(`❌ Error updating ${locale}.json:`, err.message);
  }
});

console.log('\n✅ All translation files updated!');
