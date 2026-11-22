/* Update history, newest first. Every release adds an entry at the top:
   v     — bug fixes bump the last digit, new features the middle one
   date  — the release day in Malaysia (UTC+8)
   at    — when it went live, in UTC (date -u +%Y-%m-%dT%H:%M:00Z); shown in the phone's time zone
   notes — what changed, for users, in every language (zh = 简体, zht = 繁體) */

export const RELEASES = [
  {
    v: '1.2.0', date: '2026-11-22', at: '2026-11-22T03:05:00Z',
    notes: {
      en: [
        'Fixed: "Update now" kept coming back. Updates now install quickly; article text downloads in the background afterwards.',
        'New: on first visit the app asks whether to download all photos (about 765 MB) for offline reading. Progress shows under the top bar; you can pause and continue in Settings.',
        'Scientific names of plants and animals are now in italics.',
        'Settings → About also shows when the articles and photos were fetched, and how many there are.',
      ],
      zht: [
        '修正：「立即更新」一直重複出現。現在更新很快裝好，文章內容之後在背景下載。',
        '新增：第一次打開時會問要不要下載全部照片（約 765 MB）供離線瀏覽。進度顯示在頂部，可在設定暫停或繼續。',
        '動植物學名改以斜體顯示。',
        '設定→關於新增文章與照片的擷取日期和數量。',
      ],
      zh: [
        '修正：“立即更新”一直重复出现。现在更新很快装好，文章内容之后在后台下载。',
        '新增：第一次打开时会问要不要下载全部照片（约 765 MB）供离线浏览。进度显示在顶部，可在设置暂停或继续。',
        '动植物学名改以斜体显示。',
        '设置→关于新增文章与照片的撷取日期和数量。',
      ],
      ms: [
        'Dibaiki: "Kemas kini" asyik muncul semula. Kemas kini kini dipasang dengan cepat; teks artikel dimuat turun di latar belakang selepas itu.',
        'Baharu: pada lawatan pertama aplikasi bertanya sama ada mahu memuat turun semua foto (kira-kira 765 MB) untuk bacaan luar talian. Kemajuan ditunjukkan di bawah bar atas; boleh dijeda dan disambung dalam Tetapan.',
        'Nama saintifik tumbuhan dan haiwan kini dalam huruf condong.',
        'Tetapan → Perihal kini turut menunjukkan bila artikel dan foto diambil, dan bilangannya.',
      ],
    },
  },
  {
    v: '1.1.0', date: '2026-11-22', at: '2026-11-21T23:54:00Z',
    notes: {
      en: [
        'The full text of 24,741 MOA articles is now inside the app and reads offline (in Chinese; 简体 is converted on the phone).',
        'Search finds article titles as well as halls.',
        'Each hall has a button to save its photos for offline reading. Settings shows how much is stored.',
        'News reprints, outside links and files are listed by title and open on the MOA site.',
      ],
      zht: [
        '農業部 24,741 篇文章全文已收進應用程式，離線也能閱讀。',
        '搜尋可以找文章標題，不只是主題館。',
        '每個主題館都有「下載照片供離線瀏覽」按鈕；設定頁顯示已儲存的容量。',
        '新聞轉載、外部連結和檔案按標題列出，點選後在農業部網站開啟。',
      ],
      zh: [
        '农业部 24,741 篇文章全文已收进应用程序，离线也能阅读（简体由手机自动转换）。',
        '搜索可以找文章标题，不只是主题馆。',
        '每个主题馆都有“下载照片供离线浏览”按钮；设置页显示已保存的容量。',
        '新闻转载、外部链接和文件按标题列出，点选后在农业部网站打开。',
      ],
      ms: [
        'Teks penuh 24,741 artikel MOA kini ada dalam aplikasi dan boleh dibaca luar talian (dalam bahasa Cina).',
        'Carian kini menemui tajuk artikel, bukan hanya dewan.',
        'Setiap dewan ada butang untuk menyimpan gambarnya bagi bacaan luar talian. Tetapan menunjukkan saiz yang disimpan.',
        'Berita cetakan semula, pautan luar dan fail disenaraikan mengikut tajuk dan dibuka di laman MOA.',
      ],
    },
  },
  {
    v: '1.0.0', date: '2026-11-21', at: '2026-11-20T23:45:00Z',
    notes: {
      en: [
        'First release: all 157 theme halls of Taiwan\'s Ministry of Agriculture, in 8 categories.',
        'Each hall has its picture, an overview, its section menu and links to the original MOA pages.',
        'English, 繁體中文, 简体中文 and Bahasa Melayu; 8 appearances; works offline; QR code to share.',
      ],
      zht: [
        '第一版：收錄農業部 157 個主題館，分 8 大類。',
        '每個主題館有圖片、概說、網站單元，並連結到農業部原網頁。',
        '支援英文、繁體中文、簡體中文、馬來文；8 種外觀；可離線使用；以二維碼分享。',
      ],
      zh: [
        '第一版：收录农业部 157 个主题馆，分 8 大类。',
        '每个主题馆有图片、概说、网站单元，并链接到农业部原网页。',
        '支持英文、繁体中文、简体中文、马来文；8 种外观；可离线使用；以二维码分享。',
      ],
      ms: [
        'Keluaran pertama: kesemua 157 dewan tema Kementerian Pertanian Taiwan, dalam 8 kategori.',
        'Setiap dewan ada gambar, gambaran, menu bahagian dan pautan ke halaman asal MOA.',
        'English, 繁體中文, 简体中文 dan Bahasa Melayu; 8 penampilan; berfungsi luar talian; kod QR untuk berkongsi.',
      ],
    },
  },
];

export const VERSION = RELEASES[0].v;
