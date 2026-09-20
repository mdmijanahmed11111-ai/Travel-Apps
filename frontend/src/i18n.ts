// UI translations for GuardTrip.
// Keep keys short and namespaced (screen.key). Fallback = English.

export type LangCode =
  | "en" | "bn" | "hi" | "es" | "fr" | "de" | "pt" | "ar" | "ja" | "zh" | "id" | "ur";

export const SUPPORTED_LANGS: { code: LangCode; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English",    native: "English",    flag: "🇬🇧" },
  { code: "bn", label: "Bengali",    native: "বাংলা",       flag: "🇧🇩" },
  { code: "hi", label: "Hindi",      native: "हिन्दी",       flag: "🇮🇳" },
  { code: "ur", label: "Urdu",       native: "اردو",        flag: "🇵🇰" },
  { code: "ar", label: "Arabic",     native: "العربية",      flag: "🇸🇦" },
  { code: "es", label: "Spanish",    native: "Español",     flag: "🇪🇸" },
  { code: "fr", label: "French",     native: "Français",    flag: "🇫🇷" },
  { code: "de", label: "German",     native: "Deutsch",     flag: "🇩🇪" },
  { code: "pt", label: "Portuguese", native: "Português",   flag: "🇵🇹" },
  { code: "id", label: "Indonesian", native: "Bahasa",      flag: "🇮🇩" },
  { code: "ja", label: "Japanese",   native: "日本語",       flag: "🇯🇵" },
  { code: "zh", label: "Chinese",    native: "中文",        flag: "🇨🇳" },
];

export const RTL_LANGS: LangCode[] = ["ar", "ur"];

type Dict = Record<string, string>;

const en: Dict = {
  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.loading": "Loading…",
  "common.retry": "Retry",
  "common.back": "Back",
  "common.offline": "You are offline",
  "common.online": "Online",

  "safety.eyebrow": "SAFETY RADAR",
  "safety.title": "Live alerts",
  "safety.empty": "No active threats in {city}.",
  "safety.emptySub": "Stay aware. Pull to refresh.",
  "safety.reportFab": "Report incident",
  "safety.locateBtn": "Use my location",
  "safety.locating": "Getting location…",
  "safety.locationRequired": "Enable location to see alerts near you.",

  "offline.title": "Offline Survival Pack",
  "offline.subtitle": "Cache city guide, alerts + emergency phrases for zero-signal use.",
  "offline.downloadBtn": "Download pack",
  "offline.refreshBtn": "Refresh pack",
  "offline.downloading": "Downloading…",
  "offline.downloaded": "Downloaded · {when}",
  "offline.viewPhrases": "View phrases",
  "offline.deletePack": "Delete pack",
  "offline.currentCity": "{city} pack",
  "offline.needCity": "Enable location first — pack is generated for your current city.",
  "offline.usingCache": "You're offline. Showing saved data.",
  "offline.phrasesTitle": "Emergency phrases",
  "offline.tapToCopy": "Tap a phrase to copy",
  "offline.copied": "Copied",

  "report.title": "Report an incident in {city}",
  "report.kind": "Kind",
  "report.incidentTitle": "Title",
  "report.details": "Details",
  "report.submit": "Submit report",
  "report.titlePh": "e.g., Bracelet scam at cathedral",
  "report.detailsPh": "What happened?",

  "profile.membership": "MEMBERSHIP",
  "profile.activeUntil": "Active until {date}",
  "profile.language": "App language",
  "profile.languageSub": "Change the app's display language.",
  "profile.signOut": "Sign out",
  "profile.savedLang": "Language saved",
};

// For non-English, only strings that differ are listed; missing keys fall back to English.
const bn: Dict = {
  "common.close": "বন্ধ", "common.cancel": "বাতিল", "common.loading": "লোড হচ্ছে…",
  "common.retry": "আবার চেষ্টা", "common.back": "পিছনে", "common.offline": "আপনি অফলাইনে",
  "common.online": "অনলাইন",
  "safety.eyebrow": "সেফটি রাডার", "safety.title": "লাইভ অ্যালার্ট",
  "safety.empty": "{city}-এ কোনো সক্রিয় হুমকি নেই।", "safety.emptySub": "সতর্ক থাকুন। রিফ্রেশ করতে টানুন।",
  "safety.reportFab": "রিপোর্ট করুন", "safety.locateBtn": "আমার লোকেশন ব্যবহার করুন",
  "safety.locating": "লোকেশন খোঁজা হচ্ছে…", "safety.locationRequired": "কাছাকাছি অ্যালার্ট দেখতে লোকেশন চালু করুন।",
  "offline.title": "অফলাইন সারভাইভাল প্যাক",
  "offline.subtitle": "সিগন্যাল ছাড়া ব্যবহারের জন্য শহরের গাইড, অ্যালার্ট ও জরুরি বাক্য ক্যাশ করুন।",
  "offline.downloadBtn": "প্যাক ডাউনলোড", "offline.refreshBtn": "প্যাক রিফ্রেশ",
  "offline.downloading": "ডাউনলোড হচ্ছে…", "offline.downloaded": "ডাউনলোড · {when}",
  "offline.viewPhrases": "বাক্য দেখুন", "offline.deletePack": "প্যাক মুছুন",
  "offline.currentCity": "{city} প্যাক",
  "offline.needCity": "প্রথমে লোকেশন চালু করুন — আপনার বর্তমান শহরের জন্য প্যাক তৈরি হবে।",
  "offline.usingCache": "আপনি অফলাইন। সংরক্ষিত ডেটা দেখানো হচ্ছে।",
  "offline.phrasesTitle": "জরুরি বাক্য",
  "offline.tapToCopy": "কপি করতে বাক্য চাপুন", "offline.copied": "কপি হয়েছে",
  "report.title": "{city}-এ ঘটনার রিপোর্ট", "report.kind": "ধরন",
  "report.incidentTitle": "শিরোনাম", "report.details": "বিস্তারিত",
  "report.submit": "জমা দিন", "report.titlePh": "যেমন, ক্যাথেড্রালে ব্রেসলেট স্ক্যাম",
  "report.detailsPh": "কী ঘটেছে?",
  "profile.membership": "সদস্যপদ", "profile.activeUntil": "{date} পর্যন্ত সক্রিয়",
  "profile.language": "অ্যাপের ভাষা",
  "profile.languageSub": "অ্যাপের প্রদর্শনের ভাষা পরিবর্তন করুন।",
  "profile.signOut": "সাইন আউট", "profile.savedLang": "ভাষা সংরক্ষিত",
};

const hi: Dict = {
  "common.close": "बंद", "common.cancel": "रद्द", "common.loading": "लोड हो रहा है…",
  "common.retry": "पुनः प्रयास", "common.back": "पीछे", "common.offline": "आप ऑफ़लाइन हैं",
  "safety.eyebrow": "सेफ्टी रडार", "safety.title": "लाइव अलर्ट",
  "safety.empty": "{city} में कोई सक्रिय खतरा नहीं है।", "safety.emptySub": "सतर्क रहें। रीफ्रेश करने के लिए खींचें।",
  "safety.reportFab": "घटना रिपोर्ट करें", "safety.locateBtn": "मेरा स्थान उपयोग करें",
  "safety.locationRequired": "आस-पास के अलर्ट देखने के लिए स्थान चालू करें।",
  "offline.title": "ऑफ़लाइन सर्वाइवल पैक",
  "offline.subtitle": "बिना सिग्नल के उपयोग के लिए शहर की गाइड, अलर्ट + आपातकालीन वाक्य कैश करें।",
  "offline.downloadBtn": "पैक डाउनलोड", "offline.refreshBtn": "पैक रीफ्रेश",
  "offline.viewPhrases": "वाक्य देखें", "offline.deletePack": "पैक हटाएँ",
  "offline.currentCity": "{city} पैक",
  "offline.needCity": "पहले स्थान चालू करें — पैक आपके वर्तमान शहर के लिए बनेगा।",
  "offline.usingCache": "आप ऑफ़लाइन हैं। सहेजा गया डेटा दिखाया जा रहा है।",
  "offline.phrasesTitle": "आपातकालीन वाक्य",
  "profile.language": "ऐप की भाषा", "profile.signOut": "साइन आउट",
};

const es: Dict = {
  "common.close": "Cerrar", "common.cancel": "Cancelar", "common.loading": "Cargando…",
  "common.back": "Atrás", "common.offline": "Estás sin conexión",
  "safety.eyebrow": "RADAR DE SEGURIDAD", "safety.title": "Alertas en vivo",
  "safety.empty": "Sin amenazas activas en {city}.", "safety.emptySub": "Mantente alerta. Desliza para actualizar.",
  "safety.reportFab": "Reportar incidente", "safety.locateBtn": "Usar mi ubicación",
  "safety.locationRequired": "Activa la ubicación para ver alertas cercanas.",
  "offline.title": "Paquete de supervivencia sin conexión",
  "offline.subtitle": "Guarda guía de ciudad, alertas y frases de emergencia para uso sin señal.",
  "offline.downloadBtn": "Descargar paquete", "offline.refreshBtn": "Actualizar paquete",
  "offline.viewPhrases": "Ver frases", "offline.deletePack": "Eliminar paquete",
  "offline.currentCity": "Paquete de {city}",
  "offline.needCity": "Activa la ubicación primero — el paquete se genera para tu ciudad actual.",
  "offline.usingCache": "Estás sin conexión. Mostrando datos guardados.",
  "offline.phrasesTitle": "Frases de emergencia",
  "profile.language": "Idioma de la app", "profile.signOut": "Cerrar sesión",
};

const fr: Dict = {
  "common.close": "Fermer", "common.cancel": "Annuler", "common.loading": "Chargement…",
  "common.back": "Retour", "common.offline": "Vous êtes hors ligne",
  "safety.eyebrow": "RADAR SÉCURITÉ", "safety.title": "Alertes en direct",
  "safety.empty": "Aucune menace active à {city}.", "safety.emptySub": "Restez vigilant. Tirez pour actualiser.",
  "safety.reportFab": "Signaler un incident", "safety.locateBtn": "Utiliser ma position",
  "safety.locationRequired": "Activez la localisation pour voir les alertes proches.",
  "offline.title": "Pack de survie hors ligne",
  "offline.subtitle": "Sauvegardez guide, alertes et phrases d'urgence pour un usage sans réseau.",
  "offline.downloadBtn": "Télécharger le pack", "offline.refreshBtn": "Actualiser le pack",
  "offline.viewPhrases": "Voir les phrases", "offline.deletePack": "Supprimer le pack",
  "offline.currentCity": "Pack {city}",
  "offline.needCity": "Activez d'abord la localisation — le pack sera généré pour votre ville actuelle.",
  "offline.usingCache": "Vous êtes hors ligne. Données enregistrées affichées.",
  "offline.phrasesTitle": "Phrases d'urgence",
  "profile.language": "Langue de l'app", "profile.signOut": "Se déconnecter",
};

const de: Dict = {
  "common.close": "Schließen", "common.cancel": "Abbrechen", "common.loading": "Laden…",
  "common.back": "Zurück", "common.offline": "Du bist offline",
  "safety.title": "Live-Warnungen",
  "safety.empty": "Keine aktiven Bedrohungen in {city}.",
  "safety.reportFab": "Vorfall melden", "safety.locateBtn": "Meinen Standort verwenden",
  "offline.title": "Offline-Überlebenspaket",
  "offline.subtitle": "Stadtführer, Warnungen und Notfallphrasen für Nutzung ohne Signal cachen.",
  "offline.downloadBtn": "Paket herunterladen", "offline.refreshBtn": "Paket aktualisieren",
  "offline.viewPhrases": "Phrasen ansehen", "offline.deletePack": "Paket löschen",
  "offline.currentCity": "{city}-Paket",
  "offline.phrasesTitle": "Notfallphrasen",
  "profile.language": "App-Sprache", "profile.signOut": "Abmelden",
};

const pt: Dict = {
  "common.close": "Fechar", "common.cancel": "Cancelar", "common.loading": "Carregando…",
  "common.back": "Voltar", "common.offline": "Você está offline",
  "safety.title": "Alertas ao vivo",
  "safety.empty": "Sem ameaças ativas em {city}.",
  "safety.reportFab": "Relatar incidente", "safety.locateBtn": "Usar minha localização",
  "offline.title": "Pacote de sobrevivência offline",
  "offline.subtitle": "Salve guia da cidade, alertas e frases de emergência para uso sem sinal.",
  "offline.downloadBtn": "Baixar pacote", "offline.refreshBtn": "Atualizar pacote",
  "offline.viewPhrases": "Ver frases", "offline.deletePack": "Excluir pacote",
  "offline.currentCity": "Pacote de {city}",
  "offline.phrasesTitle": "Frases de emergência",
  "profile.language": "Idioma do app", "profile.signOut": "Sair",
};

const ar: Dict = {
  "common.close": "إغلاق", "common.cancel": "إلغاء", "common.loading": "جارٍ التحميل…",
  "common.back": "رجوع", "common.offline": "أنت غير متصل",
  "safety.title": "التنبيهات المباشرة",
  "safety.empty": "لا توجد تهديدات نشطة في {city}.",
  "safety.reportFab": "الإبلاغ عن حادث", "safety.locateBtn": "استخدم موقعي",
  "offline.title": "حزمة النجاة دون اتصال",
  "offline.subtitle": "احفظ دليل المدينة والتنبيهات وعبارات الطوارئ للاستخدام دون شبكة.",
  "offline.downloadBtn": "تنزيل الحزمة", "offline.refreshBtn": "تحديث الحزمة",
  "offline.viewPhrases": "عرض العبارات", "offline.deletePack": "حذف الحزمة",
  "offline.currentCity": "حزمة {city}",
  "offline.phrasesTitle": "عبارات الطوارئ",
  "profile.language": "لغة التطبيق", "profile.signOut": "تسجيل الخروج",
};

const ja: Dict = {
  "common.close": "閉じる", "common.cancel": "キャンセル", "common.loading": "読み込み中…",
  "common.back": "戻る", "common.offline": "オフラインです",
  "safety.title": "ライブアラート",
  "safety.empty": "{city} に脅威はありません。",
  "safety.reportFab": "インシデント報告", "safety.locateBtn": "現在地を使用",
  "offline.title": "オフラインサバイバルパック",
  "offline.subtitle": "電波のない場所で使えるように、市街ガイド・アラート・緊急フレーズをキャッシュします。",
  "offline.downloadBtn": "パックをダウンロード", "offline.refreshBtn": "パックを更新",
  "offline.viewPhrases": "フレーズを見る", "offline.deletePack": "パックを削除",
  "offline.currentCity": "{city} パック",
  "offline.phrasesTitle": "緊急フレーズ",
  "profile.language": "アプリの言語", "profile.signOut": "サインアウト",
};

const zh: Dict = {
  "common.close": "关闭", "common.cancel": "取消", "common.loading": "加载中…",
  "common.back": "返回", "common.offline": "您已离线",
  "safety.title": "实时警报",
  "safety.empty": "{city} 无活跃威胁。",
  "safety.reportFab": "上报事件", "safety.locateBtn": "使用我的位置",
  "offline.title": "离线生存包",
  "offline.subtitle": "在无信号时缓存城市指南、警报和紧急短语。",
  "offline.downloadBtn": "下载包", "offline.refreshBtn": "刷新包",
  "offline.viewPhrases": "查看短语", "offline.deletePack": "删除包",
  "offline.currentCity": "{city} 包",
  "offline.phrasesTitle": "紧急短语",
  "profile.language": "应用语言", "profile.signOut": "退出登录",
};

const id: Dict = {
  "common.close": "Tutup", "common.cancel": "Batal", "common.loading": "Memuat…",
  "common.back": "Kembali", "common.offline": "Anda sedang offline",
  "safety.title": "Peringatan langsung",
  "safety.empty": "Tidak ada ancaman aktif di {city}.",
  "safety.reportFab": "Laporkan insiden", "safety.locateBtn": "Gunakan lokasi saya",
  "offline.title": "Paket Survival Offline",
  "offline.subtitle": "Simpan panduan kota, peringatan & frasa darurat untuk penggunaan tanpa sinyal.",
  "offline.downloadBtn": "Unduh paket", "offline.refreshBtn": "Perbarui paket",
  "offline.viewPhrases": "Lihat frasa", "offline.deletePack": "Hapus paket",
  "offline.currentCity": "Paket {city}",
  "offline.phrasesTitle": "Frasa darurat",
  "profile.language": "Bahasa aplikasi", "profile.signOut": "Keluar",
};

const ur: Dict = {
  "common.close": "بند کریں", "common.cancel": "منسوخ", "common.loading": "لوڈ ہو رہا ہے…",
  "common.back": "واپس", "common.offline": "آپ آف لائن ہیں",
  "safety.title": "لائیو الرٹس",
  "safety.empty": "{city} میں کوئی خطرہ نہیں ہے۔",
  "safety.reportFab": "واقعہ رپورٹ کریں", "safety.locateBtn": "میری لوکیشن استعمال کریں",
  "offline.title": "آف لائن سروائیول پیک",
  "offline.subtitle": "بغیر سگنل استعمال کے لیے شہر کی گائیڈ، الرٹس اور ہنگامی جملے محفوظ کریں۔",
  "offline.downloadBtn": "پیک ڈاؤن لوڈ", "offline.refreshBtn": "پیک ریفریش",
  "offline.viewPhrases": "جملے دیکھیں", "offline.deletePack": "پیک حذف کریں",
  "offline.currentCity": "{city} پیک",
  "offline.phrasesTitle": "ہنگامی جملے",
  "profile.language": "ایپ کی زبان", "profile.signOut": "سائن آؤٹ",
};

const dicts: Record<LangCode, Dict> = { en, bn, hi, ur, ar, es, fr, de, pt, id, ja, zh };

export function translate(lang: LangCode, key: string, vars?: Record<string, string | number>): string {
  const value = dicts[lang]?.[key] || en[key] || key;
  if (!vars) return value;
  return Object.keys(vars).reduce(
    (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k])),
    value,
  );
}
