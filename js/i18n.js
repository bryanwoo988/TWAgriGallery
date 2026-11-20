/* Interface text in the four languages. Hall content lives in data/halls.json. */

export const LANG_NAMES = { en: 'English', zht: '繁體中文', zhs: '简体中文', ms: 'Bahasa Melayu' };

export const STRINGS = {
  appName: { en: 'Taiwan Agri Gallery', zht: '臺灣農業主題館', zhs: '台湾农业主题馆', ms: 'Galeri Pertanian Taiwan' },
  tagline: {
    en: '157 theme halls from Taiwan\'s Ministry of Agriculture',
    zht: '農業部農業知識入口網 157 個主題館',
    zhs: '农业部农业知识入口网 157 个主题馆',
    ms: '157 dewan tema daripada Kementerian Pertanian Taiwan',
  },
  search: { en: 'Search halls', zht: '搜尋主題館', zhs: '搜索主题馆', ms: 'Cari dewan' },
  clear: { en: 'Clear', zht: '清除', zhs: '清除', ms: 'Kosongkan' },
  all: { en: 'All', zht: '全部', zhs: '全部', ms: 'Semua' },
  results: { en: '{n} halls', zht: '{n} 個主題館', zhs: '{n} 个主题馆', ms: '{n} dewan' },
  none: {
    en: 'No hall matches “{q}”.', zht: '沒有符合「{q}」的主題館。', zhs: '没有符合“{q}”的主题馆。', ms: 'Tiada dewan sepadan dengan “{q}”.',
  },
  back: { en: 'Back', zht: '返回', zhs: '返回', ms: 'Kembali' },
  settings: { en: 'Settings', zht: '設定', zhs: '设置', ms: 'Tetapan' },
  overview: { en: 'Overview', zht: '概說', zhs: '概说', ms: 'Gambaran' },
  summaryNote: {
    en: 'Short summary translated from the MOA overview.',
    zht: '', zhs: '',
    ms: 'Ringkasan pendek diterjemah daripada gambaran MOA.',
  },
  openHall: { en: 'Open the full hall on MOA', zht: '前往農業部主題館', zhs: '前往农业部主题馆', ms: 'Buka dewan penuh di MOA' },
  sections: { en: 'Sections', zht: '網站單元', zhs: '网站单元', ms: 'Bahagian' },
  sectionsNote: {
    en: 'Each section opens on the MOA site, in Traditional Chinese.',
    zht: '每個單元都會開啟農業部網站。',
    zhs: '每个单元都会打开农业部网站（繁体中文）。',
    ms: 'Setiap bahagian dibuka di laman MOA, dalam bahasa Cina Tradisional.',
  },
  maintainer: { en: 'Maintained by', zht: '維護單位', zhs: '维护单位', ms: 'Diselenggara oleh' },
  language: { en: 'Language', zht: '語言', zhs: '语言', ms: 'Bahasa' },
  appearance: { en: 'Appearance', zht: '外觀', zhs: '外观', ms: 'Penampilan' },
  mode: { en: 'Mode', zht: '模式', zhs: '模式', ms: 'Mod' },
  auto: { en: 'Auto', zht: '自動', zhs: '自动', ms: 'Auto' },
  light: { en: 'Light', zht: '淺色', zhs: '浅色', ms: 'Cerah' },
  dark: { en: 'Dark', zht: '深色', zhs: '深色', ms: 'Gelap' },
  lightLooks: { en: 'Light looks', zht: '淺色外觀', zhs: '浅色外观', ms: 'Rupa cerah' },
  darkLooks: { en: 'Dark looks', zht: '深色外觀', zhs: '深色外观', ms: 'Rupa gelap' },
  autoNote: {
    en: 'Auto follows your phone: the light look when the phone is in light mode, the dark look when it is in dark mode.',
    zht: '自動模式跟隨手機：手機為淺色模式時用淺色外觀，深色模式時用深色外觀。',
    zhs: '自动模式跟随手机：手机为浅色模式时用浅色外观，深色模式时用深色外观。',
    ms: 'Auto mengikut telefon anda: rupa cerah ketika telefon dalam mod cerah, rupa gelap ketika dalam mod gelap.',
  },
  classic: { en: 'Classic', zht: '經典', zhs: '经典', ms: 'Klasik' },
  paper: { en: 'Paper', zht: '紙張', zhs: '纸张', ms: 'Kertas' },
  mint: { en: 'Mint', zht: '薄荷', zhs: '薄荷', ms: 'Pudina' },
  lavender: { en: 'Lavender', zht: '薰衣草', zhs: '薰衣草', ms: 'Lavender' },
  midnight: { en: 'Midnight', zht: '午夜', zhs: '午夜', ms: 'Tengah malam' },
  oled: { en: 'OLED black', zht: 'OLED 純黑', zhs: 'OLED 纯黑', ms: 'Hitam OLED' },
  slate: { en: 'Slate', zht: '石板', zhs: '石板', ms: 'Batu loh' },
  grape: { en: 'Grape', zht: '葡萄', zhs: '葡萄', ms: 'Anggur' },
  share: { en: 'Share this app', zht: '分享 App', zhs: '分享 App', ms: 'Kongsi aplikasi ini' },
  shareNote: {
    en: 'Scan the code to open the app on another phone.',
    zht: '掃描二維碼，在另一支手機開啟。',
    zhs: '扫描二维码，在另一部手机打开。',
    ms: 'Imbas kod untuk membuka aplikasi di telefon lain.',
  },
  shareButton: { en: 'Share app link', zht: '分享 App 連結', zhs: '分享 App 链接', ms: 'Kongsi pautan aplikasi' },
  copyLink: { en: 'Copy link', zht: '複製連結', zhs: '复制链接', ms: 'Salin pautan' },
  copied: { en: 'Copied', zht: '已複製', zhs: '已复制', ms: 'Disalin' },
  about: { en: 'About', zht: '關於', zhs: '关于', ms: 'Perihal' },
  version: { en: 'Version', zht: '版本', zhs: '版本', ms: 'Versi' },
  history: { en: 'Update history', zht: '更新記錄', zhs: '更新记录', ms: 'Sejarah kemas kini' },
  dataDate: { en: 'Hall list fetched', zht: '主題館資料擷取日期', zhs: '主题馆资料撷取日期', ms: 'Senarai dewan diambil' },
  source: { en: 'Source', zht: '資料來源', zhs: '资料来源', ms: 'Sumber' },
  credit: {
    en: 'Text and images: Ministry of Agriculture, Taiwan, Agricultural Knowledge Portal. Used with permission. Hall pages and sections link to the original site.',
    zht: '文字與圖片：農業部農業知識入口網，經授權使用。主題館與各單元皆連結至原網站。',
    zhs: '文字与图片：农业部农业知识入口网，经授权使用。主题馆与各单元皆链接至原网站。',
    ms: 'Teks dan imej: Kementerian Pertanian Taiwan, Portal Pengetahuan Pertanian. Digunakan dengan kebenaran. Halaman dewan dan bahagian dipaut ke laman asal.',
  },
  offline: {
    en: 'Works offline once opened. Links to MOA need a connection.',
    zht: '開啟過一次後可離線使用；連到農業部網站需要網路。',
    zhs: '打开过一次后可离线使用；链接到农业部网站需要网络。',
    ms: 'Berfungsi luar talian selepas dibuka. Pautan ke MOA memerlukan sambungan.',
  },
};

export function t(key, vars = null, lang = 'en') {
  const row = STRINGS[key];
  if (!row) return key;
  let s = row[lang] ?? row.en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
