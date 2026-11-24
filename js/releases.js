/* Update history, newest first. Every release adds an entry at the top:
   v     — bug fixes bump the last digit, new features the middle one
   date  — the release day in Malaysia (UTC+8)
   at    — when it went live, in UTC (date -u +%Y-%m-%dT%H:%M:00Z); shown in the phone's time zone
   notes — what changed, for users, in every language (zh = 简体, zht = 繁體) */

export const RELEASES = [
  {
    v: '1.8.4', date: '2026-11-24', at: '2026-11-24T00:19:00Z',
    notes: {
      en: [
        'All 18,672 article titles are now in English and Malay (up from 15,386).',
      ],
      zht: [
        '全部 18,672 個文章標題都已有英文和馬來文（原本 15,386 個）。',
      ],
      zh: [
        '全部 18,672 个文章标题都已有英文和马来文（原本 15,386 个）。',
      ],
      ms: [
        'Kesemua 18,672 tajuk artikel kini dalam bahasa Inggeris dan Melayu (daripada 15,386).',
      ],
    },
  },
  {
    v: '1.8.3', date: '2026-11-24', at: '2026-11-24T00:05:00Z',
    notes: {
      en: [
        'More article titles in English and Malay: 15,386 are now translated (up from 9,850).',
      ],
      zht: [
        '更多文章標題已翻成英文和馬來文：目前完成 15,386 個（原本 9,850 個）。',
      ],
      zh: [
        '更多文章标题已翻成英文和马来文：目前完成 15,386 个（原本 9,850 个）。',
      ],
      ms: [
        'Lebih banyak tajuk artikel dalam bahasa Inggeris dan Melayu: 15,386 kini sudah diterjemah (daripada 9,850).',
      ],
    },
  },
  {
    v: '1.8.2', date: '2026-11-24', at: '2026-11-23T23:29:00Z',
    notes: {
      en: [
        'More article titles in English and Malay: 9,850 are now translated (up from 2,950).',
      ],
      zht: [
        '更多文章標題已翻成英文和馬來文：目前完成 9,850 個（原本 2,950 個）。',
      ],
      zh: [
        '更多文章标题已翻成英文和马来文：目前完成 9,850 个（原本 2,950 个）。',
      ],
      ms: [
        'Lebih banyak tajuk artikel dalam bahasa Inggeris dan Melayu: 9,850 kini sudah diterjemah (daripada 2,950).',
      ],
    },
  },
  {
    v: '1.8.1', date: '2026-11-23', at: '2026-11-23T04:34:00Z',
    notes: {
      en: [
        'More article titles in English and Malay: 2,950 are now translated (up from 550).',
      ],
      zht: [
        '更多文章標題已翻成英文和馬來文：目前完成 2,950 個（原本 550 個）。',
      ],
      zh: [
        '更多文章标题已翻成英文和马来文：目前完成 2,950 个（原本 550 个）。',
      ],
      ms: [
        'Lebih banyak tajuk artikel dalam bahasa Inggeris dan Melayu: 2,950 kini sudah diterjemah (daripada 550).',
      ],
    },
  },
  {
    v: '1.8.0', date: '2026-11-23', at: '2026-11-23T04:10:00Z',
    notes: {
      en: [
        'Article titles are being translated into English and Malay, hall by hall; the first 550 are in, more come with each update. English search also finds translated titles.',
      ],
      zht: [
        '文章標題正逐館翻成英文和馬來文，第一批 550 個已完成，之後每次更新會再增加。英文搜尋也能找到已翻譯的標題。',
      ],
      zh: [
        '文章标题正逐馆翻成英文和马来文，第一批 550 个已完成，之后每次更新会再增加。英文搜索也能找到已翻译的标题。',
      ],
      ms: [
        'Tajuk artikel sedang diterjemah ke bahasa Inggeris dan Melayu, dewan demi dewan; 550 yang pertama sudah siap, lebih banyak akan menyusul dalam setiap kemas kini. Carian bahasa Inggeris juga menemui tajuk yang diterjemah.',
      ],
    },
  },
  {
    v: '1.7.0', date: '2026-11-23', at: '2026-11-23T04:05:00Z',
    notes: {
      en: [
        'In English and Malay, all 3,884 section titles of the halls are now in your language. Article titles and text are still in Chinese, as MOA publishes them.',
      ],
      zht: [
        '英文和馬來文介面下，各主題館的 3,884 個單元名稱都已翻成該語言。文章標題和內文仍是農業部發布的中文。',
      ],
      zh: [
        '英文和马来文界面下，各主题馆的 3,884 个单元名称都已翻成该语言。文章标题和内文仍是农业部发布的中文。',
      ],
      ms: [
        'Dalam bahasa Inggeris dan Melayu, kesemua 3,884 tajuk bahagian dewan kini dalam bahasa anda. Tajuk dan teks artikel masih dalam bahasa Cina seperti yang diterbitkan oleh MOA.',
      ],
    },
  },
  {
    v: '1.6.1', date: '2026-11-23', at: '2026-11-23T03:42:00Z',
    notes: {
      en: [
        'The app now shows one language at a time: hall names no longer carry a second name in another language, and the launch screen shows only the name in your language.',
      ],
      zht: [
        '應用程式一次只顯示一種語言：主題館名稱不再附上另一種語言的名稱，啟動畫面也只顯示你選的語言。',
      ],
      zh: [
        '应用程序一次只显示一种语言：主题馆名称不再附上另一种语言的名称，启动画面也只显示你选的语言。',
      ],
      ms: [
        'Aplikasi kini memaparkan satu bahasa pada satu masa: nama dewan tidak lagi disertai nama dalam bahasa lain, dan skrin pelancaran hanya menunjukkan nama dalam bahasa anda.',
      ],
    },
  },
  {
    v: '1.6.0', date: '2026-11-23', at: '2026-11-23T00:18:00Z',
    notes: {
      en: [
        'A launch screen with the app icon and name, in your language and your light or dark look, shows until the first page is ready.',
        'On iPhone and iPad, the app added to the Home Screen now opens on that launch screen instead of a blank white one.',
      ],
      zht: [
        '新增啟動畫面：顯示應用程式圖示和名稱，配合你選的語言和淺色／深色外觀，直到第一頁準備好。',
        '在 iPhone、iPad 主畫面打開時，會先看到啟動畫面，不再是一片空白。',
      ],
      zh: [
        '新增启动画面：显示应用程序图标和名称，配合你选的语言和浅色／深色外观，直到第一页准备好。',
        '在 iPhone、iPad 主屏幕打开时，会先看到启动画面，不再是一片空白。',
      ],
      ms: [
        'Skrin pelancaran dengan ikon dan nama aplikasi, dalam bahasa dan rupa terang atau gelap pilihan anda, dipaparkan sehingga halaman pertama sedia.',
        'Di iPhone dan iPad, aplikasi pada Skrin Utama kini dibuka dengan skrin pelancaran itu dan bukan skrin putih kosong.',
      ],
    },
  },
  {
    v: '1.5.2', date: '2026-11-23', at: '2026-11-22T21:21:00Z',
    notes: {
      en: [
        'Fixed: on a first visit over a slow connection, article text and photos could download before the app was ready to keep them, so they were not saved for offline and had to download again.',
        'Fixed: typing in the search box right after opening the app could be interrupted.',
        'The app now uses less memory after opening many halls.',
      ],
      zht: [
        '修正：網路慢時第一次打開，文章和照片可能在應用程式準備好之前就開始下載，結果沒有存下來供離線使用，下次又要重新下載。',
        '修正：剛打開應用程式時在搜尋框打字可能被打斷。',
        '打開很多主題館之後，應用程式佔用的記憶體更少。',
      ],
      zh: [
        '修正：网络慢时第一次打开，文章和照片可能在应用程序准备好之前就开始下载，结果没有存下来供离线使用，下次又要重新下载。',
        '修正：刚打开应用程序时在搜索框打字可能被打断。',
        '打开很多主题馆之后，应用程序占用的内存更少。',
      ],
      ms: [
        'Dibaiki: pada lawatan pertama dengan sambungan perlahan, teks artikel dan foto boleh mula dimuat turun sebelum aplikasi bersedia menyimpannya, jadi ia tidak disimpan untuk luar talian dan perlu dimuat turun semula.',
        'Dibaiki: menaip dalam kotak carian sejurus selepas membuka aplikasi boleh terganggu.',
        'Aplikasi kini menggunakan kurang memori selepas membuka banyak dewan.',
      ],
    },
  },
  {
    v: '1.5.1', date: '2026-11-23', at: '2026-11-22T20:07:00Z',
    notes: {
      en: [
        "Content update from MOA: 4 new articles, 24,742 in all (fetched 2026-11-23).",
        "3 articles MOA no longer lists were removed.",
      ],
      zht: [
        "農業部內容更新：新增 4 篇文章，共 24,742 篇（2026-11-23 擷取）。",
        "移除 3 篇農業部已不再列出的文章。",
      ],
      zh: [
        "农业部内容更新：新增 4 篇文章，共 24,742 篇（2026-11-23 撷取）。",
        "移除 3 篇农业部已不再列出的文章。",
      ],
      ms: [
        "Kemas kini kandungan daripada MOA: 4 artikel baharu, 24,742 kesemuanya (diambil 2026-11-23).",
        "3 artikel yang tidak lagi disenaraikan oleh MOA telah dibuang.",
      ],
    },
  },
  {
    v: '1.5.0', date: '2026-11-22', at: '2026-11-22T13:53:00Z',
    notes: {
      en: [
        'New versions now go in by themselves while you are on the home page. While you are reading, the bar still asks, and the update goes in when you come back to the home page.',
        'Articles now refresh from MOA once a month: new articles and their photos are added, and each update appears in this list.',
      ],
      zht: [
        '停在首頁時，新版本會自動更新；正在讀文章時仍會詢問，回到首頁時再自動更新。',
        '文章每月從農業部自動更新一次：加入新文章和照片，每次更新都會列在這裡。',
      ],
      zh: [
        '停在首页时，新版本会自动更新；正在读文章时仍会询问，回到首页时再自动更新。',
        '文章每月从农业部自动更新一次：加入新文章和照片，每次更新都会列在这里。',
      ],
      ms: [
        'Versi baharu kini dipasang sendiri semasa anda di halaman utama. Semasa membaca, bar masih bertanya, dan kemas kini dipasang apabila anda kembali ke halaman utama.',
        'Artikel kini dikemas kini daripada MOA sebulan sekali: artikel baharu dan fotonya ditambah, dan setiap kemas kini muncul dalam senarai ini.',
      ],
    },
  },
  {
    v: '1.4.0', date: '2026-11-22', at: '2026-11-22T11:04:00Z',
    notes: {
      en: [
        'Search now looks inside the text of all 24,741 articles, offline, and shows where each one mentions your words. Traditional and Simplified Chinese both work; several words must all appear.',
        'The first search of a visit takes a few seconds while the articles are read; after that it is quick.',
      ],
      zht: [
        '搜尋現在會找全部 24,741 篇文章的內容，離線也可以，並顯示文章裡提到的段落。繁體、簡體都能搜；輸入多個詞時要全部出現。',
        '每次打開後第一次搜尋要幾秒鐘讀取文章，之後就很快。',
      ],
      zh: [
        '搜索现在会找全部 24,741 篇文章的内容，离线也可以，并显示文章里提到的段落。繁体、简体都能搜；输入多个词时要全部出现。',
        '每次打开后第一次搜索要几秒钟读取文章，之后就很快。',
      ],
      ms: [
        'Carian kini mencari dalam teks kesemua 24,741 artikel, luar talian, dan menunjukkan di mana setiap artikel menyebut perkataan anda. Cina Tradisional dan Cina Ringkas kedua-duanya boleh; beberapa perkataan mesti semuanya ada.',
        'Carian pertama setiap kali dibuka mengambil beberapa saat untuk membaca artikel; selepas itu ia pantas.',
      ],
    },
  },
  {
    v: '1.3.0', date: '2026-11-22', at: '2026-11-22T10:34:00Z',
    notes: {
      en: [
        'Save articles with ☆, and find them again under "Saved & history" on the home page, with the articles you read recently.',
        'The home page shows the last article you read, so you can carry on.',
        'Text size: A− / A+ on every article, and Small to Extra large in Settings.',
        'Share an article: its link opens straight to that article.',
        'Long sections have their own search box and show 50 items at a time.',
      ],
      zht: [
        '文章可以點 ☆ 收藏，在首頁「收藏與記錄」找回，也能看到最近看過的文章。',
        '首頁顯示上次看到的文章，可以接著讀。',
        '文字大小：每篇文章有 A− / A+，設定裡可選小到特大。',
        '分享文章：對方打開連結就直接到那篇文章。',
        '內容很多的單元有自己的搜尋框，每次顯示 50 項。',
      ],
      zh: [
        '文章可以点 ☆ 收藏，在首页“收藏与记录”找回，也能看到最近看过的文章。',
        '首页显示上次看到的文章，可以接着读。',
        '文字大小：每篇文章有 A− / A+，设置里可选小到特大。',
        '分享文章：对方打开链接就直接到那篇文章。',
        '内容很多的单元有自己的搜索框，每次显示 50 项。',
      ],
      ms: [
        'Simpan artikel dengan ☆, dan cari semula di bawah "Simpanan & sejarah" di halaman utama, bersama artikel yang baru dibaca.',
        'Halaman utama menunjukkan artikel terakhir yang anda baca, supaya boleh sambung.',
        'Saiz teks: A− / A+ pada setiap artikel, dan Kecil hingga Sangat besar dalam Tetapan.',
        'Kongsi artikel: pautannya terus membuka artikel itu.',
        'Bahagian yang panjang ada kotak carian sendiri dan menunjukkan 50 item setiap kali.',
      ],
    },
  },
  {
    v: '1.2.0', date: '2026-11-22', at: '2026-11-22T03:17:00Z',
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
        'The full text of 24,741 MOA articles is now inside the app and reads offline (in Chinese; Simplified Chinese is converted on the phone).',
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
        'English, Traditional Chinese, Simplified Chinese and Malay; 8 appearances; works offline; QR code to share.',
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
        'Bahasa Inggeris, Cina Tradisional, Cina Ringkas dan Bahasa Melayu; 8 penampilan; berfungsi luar talian; kod QR untuk berkongsi.',
      ],
    },
  },
];

export const VERSION = RELEASES[0].v;
