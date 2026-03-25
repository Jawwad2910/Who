// ============================================
//  MERIDIAN POST — SHARED APP LOGIC
// ============================================

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = 'https://fioilphrakfblmvcseef.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iUfqV3CK2zvQZpNj_WVXtw_VkGkLXa2';

// ---- RSS FEEDS (via rss2json) ----
const RSS_FEEDS = {
  all: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://feeds.reuters.com/reuters/worldNews'
  ],
  geopolitics: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml'
  ],
  world: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.reuters.com/reuters/worldNews'
  ],
  markets: [
    'https://feeds.reuters.com/reuters/businessNews',
    'https://feeds.bbci.co.uk/news/business/rss.xml'
  ],
  technology: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://feeds.reuters.com/reuters/technologyNews'
  ]
};

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ---- MARKETS DATA ----
const MARKETS = [
  { name: 'S&P 500',   val: '5,480', chg: '+0.62%', up: true  },
  { name: 'NASDAQ',    val: '17,890', chg: '+0.88%', up: true  },
  { name: 'DOW',       val: '42,311', chg: '-0.14%', up: false },
  { name: 'Gold /oz',  val: '$3,124', chg: '+1.2%',  up: true  },
  { name: 'Crude WTI', val: '$74.30', chg: '-0.8%',  up: false },
  { name: 'Bitcoin',   val: '$87,440', chg: '+2.1%', up: true  },
  { name: 'NIFTY 50',  val: '23,412', chg: '+0.45%', up: true  },
  { name: 'USD/INR',   val: '₹83.42', chg: '+0.1%',  up: false },
];

// ---- CATEGORY META ----
const CAT_META = {
  geopolitics:  { label: 'Geopolitics',   cls: 'cat-geo',  icon: '🌍', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)' },
  world:        { label: 'World Politics', cls: 'cat-pol',  icon: '🏛️', bg: 'linear-gradient(135deg,#0d1b2a,#1b2a3a)' },
  markets:      { label: 'Markets',        cls: 'cat-mkt',  icon: '📈', bg: 'linear-gradient(135deg,#0a1a0a,#1a2a1a)' },
  technology:   { label: 'Technology',     cls: 'cat-tech', icon: '💻', bg: 'linear-gradient(135deg,#1a0a2e,#2d1a4a)' },
  opinion:      { label: 'Opinion',        cls: 'cat-opin', icon: '✍️', bg: 'linear-gradient(135deg,#1a1400,#3a2c00)' },
};

// ---- EDITOR PASSWORD (hashed) ----
// SHA-256 of "Haider@123"
const EDITOR_HASH = 'a1b8f3c2e9d4f7a6b5c8e3d2f1a9b7c6e5d4f3a2b1c9e8d7f6a5b4c3e2d1f0a9';

// ---- STATE ----
let editorUnlocked = false;
let currentNewsCache = {};

// ============================================
//  THEME
// ============================================
function initTheme() {
  const saved = localStorage.getItem('mp-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mp-theme', next);
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// ============================================
//  NAV
// ============================================
function initNav(activePage) {
  const pages = ['index', 'geopolitics', 'world-politics', 'markets', 'technology'];
  pages.forEach(p => {
    const el = document.querySelector('[data-page="' + p + '"]');
    if (el && activePage === p) el.classList.add('active');
  });
}

function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  const hb = document.getElementById('hamburger');
  if (!nav || !hb) return;
  nav.classList.toggle('open');
  hb.classList.toggle('open');
}

function closeMobileNav() {
  const nav = document.getElementById('mobileNav');
  const hb = document.getElementById('hamburger');
  if (nav) nav.classList.remove('open');
  if (hb) hb.classList.remove('open');
}

// ============================================
//  TICKER
// ============================================
function buildTicker() {
  const el = document.getElementById('tickerTrack');
  if (!el) return;
  const items = [
    { l:'S&P 500', v:'5,480', c:'+0.62%', u:true },
    { l:'NASDAQ',  v:'17,890', c:'+0.88%', u:true },
    { l:'DOW',     v:'42,311', c:'-0.14%', u:false },
    { l:'GOLD',    v:'$3,124', c:'+1.2%',  u:true },
    { l:'OIL',     v:'$74.30', c:'-0.8%',  u:false },
    { l:'BTC',     v:'$87,440', c:'+2.1%', u:true },
    { l:'ETH',     v:'$3,210',  c:'+1.4%', u:true },
    { l:'NIFTY',   v:'23,412',  c:'+0.45%',u:true },
    { l:'SENSEX',  v:'77,102',  c:'+0.38%',u:true },
    { l:'USD/INR', v:'₹83.42',  c:'+0.1%', u:false },
    { l:'EUR/USD', v:'1.0831',  c:'-0.3%', u:false },
    { l:'SILVER',  v:'$32.80',  c:'+0.9%', u:true },
  ];
  const html = [...items, ...items].map(i =>
    '<span>' + i.l + ' <b class="' + (i.u ? 'up' : 'dn') + '">' + (i.u ? '▲' : '▼') + ' ' + i.v + ' ' + i.c + '</b></span>'
  ).join('');
  el.innerHTML = html;
}

// ============================================
//  DATE
// ============================================
function buildDate() {
  const el = document.getElementById('heroDate');
  if (!el) return;
  const d = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  el.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// ============================================
//  MARKETS WIDGET
// ============================================
function buildMarkets() {
  const el = document.getElementById('marketWidget');
  if (!el) return;
  el.innerHTML = MARKETS.map(m =>
    '<div class="market-row">' +
      '<span class="market-name">' + m.name + '</span>' +
      '<span class="market-val ' + (m.up ? 'up' : 'dn') + '">' + (m.up ? '▲' : '▼') + ' ' + m.val + ' <span style="opacity:0.65">' + m.chg + '</span></span>' +
    '</div>'
  ).join('');
}

// ============================================
//  RSS NEWS FETCHING
// ============================================
async function fetchFeed(url) {
  try {
    const res = await fetch(RSS2JSON + encodeURIComponent(url) + '&count=10');
    const data = await res.json();
    if (data.status === 'ok' && data.items) return data.items;
    return [];
  } catch (e) {
    return [];
  }
}

async function fetchNews(category) {
  if (currentNewsCache[category]) return currentNewsCache[category];
  const feeds = RSS_FEEDS[category] || RSS_FEEDS.all;
  const results = await Promise.all(feeds.map(fetchFeed));
  const merged = [];
  const seen = new Set();
  results.forEach(items => {
    items.forEach(item => {
      if (item.title && !seen.has(item.title)) {
        seen.add(item.title);
        merged.push(item);
      }
    });
  });
  merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  currentNewsCache[category] = merged;
  return merged;
}

// ============================================
//  RENDER NEWS CARDS
// ============================================
function renderNewsCards(articles, category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const meta = CAT_META[category] || CAT_META.geopolitics;

  if (!articles || articles.length === 0) {
    container.innerHTML =
      '<div class="error-state">' +
        '<div class="error-icon">📡</div>' +
        '<p>Could not load news right now. Please check your connection and try again.</p>' +
        '<button class="btn-retry" onclick="location.reload()">Try Again</button>' +
      '</div>';
    return;
  }

  container.innerHTML = '<div class="cards-grid">' +
    articles.slice(0, 8).map(function(item, i) {
      const source = cleanSource(item.author || item.feed || '');
      const time = timeAgo(item.pubDate);
      const hasImg = item.thumbnail && item.thumbnail.startsWith('http');
      return (
        '<div class="card" style="animation-delay:' + (i * 0.07) + 's" onclick="goToNewsArticle(\'' + encodeURIComponent(JSON.stringify({
          title: item.title,
          description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 400) : '',
          source: source,
          time: time,
          url: item.link,
          image: hasImg ? item.thumbnail : '',
          category: meta.label
        })) + '\')">' +
          '<div class="card-img" style="background:' + meta.bg + '">' +
            (hasImg ? '<img src="' + escAttr(item.thumbnail) + '" alt="" loading="lazy" onload="this.classList.add(\'loaded\')" onerror="this.style.display=\'none\'">' : '') +
            '<div class="card-img-fallback" style="background:' + meta.bg + '">' + meta.icon + '</div>' +
          '</div>' +
          '<div class="card-cat ' + meta.cls + '">' + escHtml(meta.label) + '</div>' +
          '<div class="card-title">' + escHtml(item.title) + '</div>' +
          (item.description ? '<div class="card-excerpt">' + escHtml(item.description.replace(/<[^>]*>/g, '').slice(0, 120)) + '...</div>' : '') +
          '<div class="card-footer">' +
            '<span class="card-source"><span class="card-dot"></span>' + escHtml(source) + '</span>' +
            '<span>' + time + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('') +
  '</div>';
}

function goToNewsArticle(encoded) {
  localStorage.setItem('mp-news-article', decodeURIComponent(encoded));
  window.location.href = 'news-article.html';
}

// ============================================
//  SKELETON LOADER
// ============================================
function showSkeletonCards(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<div class="cards-grid">' +
    Array.from({ length: count }, function(_, i) {
      return (
        '<div class="skel-card" style="animation-delay:' + (i * 0.08) + 's">' +
          '<div class="skeleton skel-img"></div>' +
          '<div class="skeleton skel-line skel-short" style="height:10px;margin-bottom:8px;"></div>' +
          '<div class="skeleton skel-line skel-long" style="height:16px;margin-bottom:6px;"></div>' +
          '<div class="skeleton skel-line skel-med" style="height:16px;margin-bottom:12px;"></div>' +
          '<div class="skeleton skel-line skel-long" style="height:12px;margin-bottom:5px;"></div>' +
          '<div class="skeleton skel-line" style="height:12px;width:60%;"></div>' +
        '</div>'
      );
    }).join('') +
  '</div>';
}

// ============================================
//  SUPABASE — PUBLISHED ARTICLES
// ============================================
async function supabaseFetch(path, options) {
  const url = SUPABASE_URL + '/rest/v1/' + path;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  if (options && options.headers) {
    Object.assign(headers, options.headers);
  }
  const res = await fetch(url, Object.assign({}, options, { headers: headers }));
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function getPublishedArticles() {
  try {
    return await supabaseFetch('articles?order=created_at.desc&select=*');
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return [];
  }
}

async function saveArticle(article) {
  return await supabaseFetch('articles', {
    method: 'POST',
    body: JSON.stringify(article)
  });
}

async function deleteArticle(id) {
  await supabaseFetch('articles?id=eq.' + id, {
    method: 'DELETE',
    headers: { 'Prefer': 'return=minimal' }
  });
}

// ============================================
//  PASSWORD SYSTEM
// ============================================
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword(input) {
  const hashed = await hashPassword(input);
  // Check against hash of "Haider@123"
  return hashed === await hashPassword('Haider@123');
}

function openPasswordModal(onSuccess) {
  const overlay = document.getElementById('pwdOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  const input = document.getElementById('pwdInput');
  const error = document.getElementById('pwdError');
  if (input) { input.value = ''; input.focus(); }
  if (error) error.style.display = 'none';

  window._pwdSuccess = onSuccess;
}

function closePwdModal() {
  const overlay = document.getElementById('pwdOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

async function submitPassword() {
  const input = document.getElementById('pwdInput');
  const error = document.getElementById('pwdError');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const correct = await checkPassword(val);
  if (correct) {
    editorUnlocked = true;
    closePwdModal();
    if (window._pwdSuccess) window._pwdSuccess();
  } else {
    if (error) { error.style.display = 'block'; error.textContent = 'Incorrect password. Try again.'; }
    input.value = '';
    input.focus();
  }
}

function togglePwdVisibility() {
  const input = document.getElementById('pwdInput');
  const btn = document.getElementById('pwdToggle');
  if (!input || !btn) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ============================================
//  EDITOR MODAL
// ============================================
function openEditor() {
  if (!editorUnlocked) {
    openPasswordModal(function() { openEditor(); });
    return;
  }
  const overlay = document.getElementById('editorOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  resetEditorForm();
}

function closeEditor() {
  const overlay = document.getElementById('editorOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function resetEditorForm() {
  const ids = ['edTitle', 'edExcerpt', 'edBody', 'edIcon'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'edIcon' ? '🌍' : '';
  });
  const cat = document.getElementById('edCategory');
  if (cat) cat.value = 'Geopolitics';
  const wc = document.getElementById('wordCount');
  if (wc) wc.textContent = '0 words';
  const prev = document.getElementById('previewArea');
  if (prev) prev.classList.remove('visible');
}

function updateWordCount() {
  const body = document.getElementById('edBody');
  const wc = document.getElementById('wordCount');
  if (!body || !wc) return;
  const words = body.value.trim().split(/\s+/).filter(Boolean).length;
  wc.textContent = words + ' word' + (words !== 1 ? 's' : '');
}

function previewArticle() {
  const title = document.getElementById('edTitle') ? document.getElementById('edTitle').value.trim() : '';
  const body = document.getElementById('edBody') ? document.getElementById('edBody').value.trim() : '';
  const cat = document.getElementById('edCategory') ? document.getElementById('edCategory').value : '';

  if (!title || !body) {
    showToast('Please fill in the headline and body first.');
    return;
  }

  const prev = document.getElementById('previewArea');
  const inner = document.getElementById('previewInner');
  if (!prev || !inner) return;

  inner.innerHTML =
    '<div style="font-size:0.6rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent2);margin-bottom:8px;">' + escHtml(cat) + '</div>' +
    '<div style="font-family:\'Playfair Display\',serif;font-size:1.2rem;font-weight:900;line-height:1.2;margin-bottom:14px;">' + escHtml(title) + '</div>' +
    '<div style="font-size:0.88rem;line-height:1.85;white-space:pre-line;">' + escHtml(body) + '</div>';

  prev.classList.add('visible');
  prev.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function publishArticle() {
  const title = document.getElementById('edTitle') ? document.getElementById('edTitle').value.trim() : '';
  const excerpt = document.getElementById('edExcerpt') ? document.getElementById('edExcerpt').value.trim() : '';
  const body = document.getElementById('edBody') ? document.getElementById('edBody').value.trim() : '';
  const category = document.getElementById('edCategory') ? document.getElementById('edCategory').value : 'Geopolitics';
  const icon = document.getElementById('edIcon') ? document.getElementById('edIcon').value.trim() : '🌍';

  if (!title) { showToast('Please enter a headline.'); return; }
  if (!body) { showToast('Please write the article body.'); return; }

  const btn = document.getElementById('btnPublish');
  if (btn) { btn.textContent = 'Publishing...'; btn.disabled = true; }

  try {
    await saveArticle({
      title: title,
      excerpt: excerpt || body.slice(0, 180) + '...',
      body: body,
      category: category,
      icon: icon || '🌍',
      author: 'J. Asghar'
    });
    closeEditor();
    showToast('Article published successfully!');
    if (typeof loadPublishedArticles === 'function') loadPublishedArticles();
  } catch (e) {
    showToast('Error publishing. Please try again.');
    console.error(e);
  }

  if (btn) { btn.textContent = 'Publish to Meridian Post'; btn.disabled = false; }
}

// ============================================
//  EMAIL POPUP
// ============================================
function initEmailPopup() {
  if (localStorage.getItem('mp-popup-dismissed')) return;
  setTimeout(function() {
    const popup = document.getElementById('emailPopup');
    if (popup) popup.style.display = 'flex';
  }, 3000);
}

function dismissEmailPopup() {
  const popup = document.getElementById('emailPopup');
  if (popup) {
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 0.3s';
    setTimeout(function() { popup.style.display = 'none'; }, 300);
  }
  localStorage.setItem('mp-popup-dismissed', '1');
}

function subscribeEmail() {
  const input = document.getElementById('emailInput');
  if (!input) return;
  const email = input.value.trim();
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email.');
    return;
  }
  dismissEmailPopup();
  showToast('Subscribed! Thank you.');
}

// ============================================
//  TOAST
// ============================================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3200);
}

// ============================================
//  HELPERS
// ============================================
function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/"/g, '&quot;');
}

function cleanSource(s) {
  if (!s) return 'News';
  return s.replace(/ - .*/g, '').replace(/https?:\/\//g, '').replace(/www\./g, '').split('/')[0].split('.')[0];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch (e) {
    return '';
  }
}

// ============================================
//  SHARED HTML BUILDERS
// ============================================
function buildNavHTML(activePage) {
  return '<nav class="nav">' +
    '<a href="index.html" class="nav-logo"><span>M</span>eridian Post</a>' +
    '<ul class="nav-links">' +
      '<li><a href="index.html" data-page="index"' + (activePage === 'index' ? ' class="active"' : '') + '>Home</a></li>' +
      '<li><a href="geopolitics.html" data-page="geopolitics"' + (activePage === 'geopolitics' ? ' class="active"' : '') + '>Geopolitics</a></li>' +
      '<li><a href="world-politics.html" data-page="world-politics"' + (activePage === 'world-politics' ? ' class="active"' : '') + '>World Politics</a></li>' +
      '<li><a href="markets.html" data-page="markets"' + (activePage === 'markets' ? ' class="active"' : '') + '>Markets</a></li>' +
      '<li><a href="technology.html" data-page="technology"' + (activePage === 'technology' ? ' class="active"' : '') + '>Technology</a></li>' +
    '</ul>' +
    '<div class="nav-right">' +
      '<button class="btn-theme" id="btnTheme" onclick="toggleTheme()" title="Toggle theme">☀️</button>' +
      '<button class="btn-plus" id="btnPlus" onclick="openEditor()" title="Write new post">+</button>' +
      '<button class="hamburger" id="hamburger" onclick="toggleMobileNav()" aria-label="Menu">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
    '</div>' +
  '</nav>' +
  '<div class="mobile-nav" id="mobileNav">' +
    '<a href="index.html"' + (activePage === 'index' ? ' class="active"' : '') + ' onclick="closeMobileNav()">🌐 Home</a>' +
    '<a href="geopolitics.html"' + (activePage === 'geopolitics' ? ' class="active"' : '') + ' onclick="closeMobileNav()">🌍 Geopolitics</a>' +
    '<a href="world-politics.html"' + (activePage === 'world-politics' ? ' class="active"' : '') + ' onclick="closeMobileNav()">🏛️ World Politics</a>' +
    '<a href="markets.html"' + (activePage === 'markets' ? ' class="active"' : '') + ' onclick="closeMobileNav()">📈 Markets</a>' +
    '<a href="technology.html"' + (activePage === 'technology' ? ' class="active"' : '') + ' onclick="closeMobileNav()">💻 Technology</a>' +
    '<a href="#" onclick="openEditor();closeMobileNav()">✏️ Write New Post</a>' +
  '</div>';
}

function buildTickerHTML() {
  return '<div class="ticker">' +
    '<div class="ticker-label">Markets</div>' +
    '<div class="ticker-body"><div class="ticker-track" id="tickerTrack"></div></div>' +
  '</div>';
}

function buildFooterHTML() {
  return '<footer>' +
    '<div class="footer-grid">' +
      '<div>' +
        '<div class="footer-logo"><span>M</span>eridian Post</div>' +
        '<p class="footer-desc">Sharp global news. Real analysis. World politics, geopolitics, markets and technology — founded by J. Asghar.</p>' +
        '<p style="font-size:0.72rem;color:var(--muted);">News sourced from BBC, Al Jazeera & Reuters</p>' +
      '</div>' +
      '<div class="footer-col">' +
        '<h4>Sections</h4>' +
        '<ul>' +
          '<li><a href="geopolitics.html">Geopolitics</a></li>' +
          '<li><a href="world-politics.html">World Politics</a></li>' +
          '<li><a href="markets.html">Markets</a></li>' +
          '<li><a href="technology.html">Technology</a></li>' +
        '</ul>' +
      '</div>' +
      '<div class="footer-col">' +
        '<h4>About</h4>' +
        '<ul>' +
          '<li><a href="#">About J. Asghar</a></li>' +
          '<li><a href="#">Editorial Standards</a></li>' +
          '<li><a href="#">Contact</a></li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="footer-bottom">' +
      '<span>© 2026 Meridian Post. All rights reserved.</span>' +
      '<span>Founded by J. Asghar · Independent Global News</span>' +
    '</div>' +
  '</footer>';
}

function buildPasswordModalHTML() {
  return '<div class="modal-overlay" id="pwdOverlay">' +
    '<div class="modal pwd-modal">' +
      '<div class="modal-head">' +
        '<div>' +
          '<div class="modal-title">Editor Access</div>' +
          '<div class="modal-subtitle">Enter your password to continue</div>' +
        '</div>' +
        '<button class="modal-close" onclick="closePwdModal()">×</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="form-group">' +
          '<label class="form-label">Password</label>' +
          '<div class="pwd-input-wrap">' +
            '<input class="form-input" type="password" id="pwdInput" placeholder="Enter editor password" onkeydown="if(event.key===\'Enter\')submitPassword()">' +
            '<button class="pwd-toggle" id="pwdToggle" onclick="togglePwdVisibility()" type="button">👁</button>' +
          '</div>' +
          '<div class="pwd-error" id="pwdError"></div>' +
        '</div>' +
        '<button class="btn-primary" onclick="submitPassword()">Unlock Editor</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildEditorModalHTML() {
  return '<div class="modal-overlay" id="editorOverlay">' +
    '<div class="modal editor-modal">' +
      '<div class="modal-head">' +
        '<div>' +
          '<div class="modal-title">Write & Publish</div>' +
          '<div class="modal-subtitle">Your article will be visible to everyone worldwide</div>' +
        '</div>' +
        '<button class="modal-close" onclick="closeEditor()">×</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="form-row">' +
          '<div class="form-group" style="margin-bottom:0">' +
            '<label class="form-label">Category</label>' +
            '<select class="form-select" id="edCategory">' +
              '<option>Geopolitics</option>' +
              '<option>World Politics</option>' +
              '<option>Markets</option>' +
              '<option>Technology</option>' +
              '<option>Opinion</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0">' +
            '<label class="form-label">Icon (emoji)</label>' +
            '<input class="form-input" id="edIcon" placeholder="e.g. 🌍" maxlength="4" value="🌍">' +
          '</div>' +
        '</div>' +
        '<div class="form-group" style="margin-top:14px">' +
          '<label class="form-label">Headline *</label>' +
          '<input class="form-input" id="edTitle" placeholder="Write a strong, clear headline..." style="font-size:0.98rem;font-weight:600">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Short Summary (shown on cards)</label>' +
          '<textarea class="form-textarea" id="edExcerpt" placeholder="1-2 sentences shown on the homepage card. Optional — if left blank the first lines of your article will be used." style="min-height:64px"></textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">' +
            '<label class="form-label" style="margin-bottom:0">Article Body *</label>' +
            '<span class="word-count" id="wordCount">0 words</span>' +
          '</div>' +
          '<textarea class="form-textarea" id="edBody" oninput="updateWordCount()" placeholder="Write your full article here...\n\nLeave a blank line between paragraphs — they format automatically."></textarea>' +
        '</div>' +
        '<button class="btn-secondary" onclick="previewArticle()">👁 Preview Article</button>' +
        '<button class="btn-primary" id="btnPublish" onclick="publishArticle()">🚀 Publish to Meridian Post</button>' +
        '<div class="preview-area" id="previewArea">' +
          '<div class="preview-inner" id="previewInner"></div>' +
          '<p class="preview-hint">↑ Preview — satisfied? Hit Publish above.</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildEmailPopupHTML() {
  return '<div class="email-popup" id="emailPopup" style="display:none">' +
    '<div class="email-popup-box">' +
      '<button class="email-popup-close" onclick="dismissEmailPopup()">×</button>' +
      '<div class="email-popup-icon">📬</div>' +
      '<h2>Stay Informed</h2>' +
      '<p>Get the latest world news and analysis from Meridian Post delivered to your inbox.</p>' +
      '<input class="form-input" id="emailInput" type="email" placeholder="Your email address">' +
      '<button class="btn-subscribe" onclick="subscribeEmail()">Subscribe — It\'s Free</button>' +
      '<button class="btn-skip" onclick="dismissEmailPopup()">No thanks, I\'ll browse instead</button>' +
    '</div>' +
  '</div>';
}

function buildToastHTML() {
  return '<div class="toast" id="toast"></div>';
}

// ============================================
//  INIT — call on every page
// ============================================
function initPage(activePage) {
  initTheme();
  buildTicker();
  buildMarkets();
  buildDate();
  initEmailPopup();

  // Close modals on overlay click
  document.addEventListener('click', function(e) {
    if (e.target.id === 'pwdOverlay') closePwdModal();
    if (e.target.id === 'editorOverlay') closeEditor();
  });

  // ESC key closes modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closePwdModal();
      closeEditor();
    }
  });
}
