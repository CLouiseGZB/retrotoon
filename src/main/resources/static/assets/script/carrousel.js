/* ============================== CONFIG ============================== */
const API_KEY   = 'abedd43cf8d6083e8a33eafb9cc8b3f4';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p';

/* ============================ UTILITAIRES =========================== */
function tmdbUrl(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: 'fr-FR', ...params });
  return `${TMDB_BASE}${path}?${p.toString()}`;
}
async function api(path, params) {
  const res = await fetch(tmdbUrl(path, params));
  if (!res.ok) throw new Error(`TMDB ${res.status} @ ${path}`);
  return res.json();
}
function minutesToText(m) {
  if (!m || m <= 0) return '';
  const h = Math.floor(m / 60), min = m % 60;
  return h ? `${h}h${String(min).padStart(2,'0')}` : `${min}m`;
}
function certToBadge(cert) {
  const c = (cert || '').toUpperCase().trim();
  if (!c) return 'NR';
  if (['U','TOUS PUBLICS','G','TP'].includes(c)) return 'Tous';
  if (['10','-10'].includes(c)) return '10+';
  if (['12','-12','PG-12'].includes(c)) return '12+';
  if (['13','PG-13'].includes(c)) return '13+';
  if (['14','-14','TV-14'].includes(c)) return '14+';
  if (['16','-16','R','TV-MA'].includes(c)) return '16+';
  if (['18','-18','NC-17'].includes(c)) return '18+';
  return c;
}
function pickCertification(details, type) {
  if (!details) return '';
  if (type === 'movie') {
    const arr = details.release_dates?.results || [];
    const take = (cc) => arr.find(r=>r.iso_3166_1===cc)?.release_dates?.find(d=>d.certification?.trim())?.certification;
    return take('FR') || take('US') || '';
  } else {
    const arr = details.content_ratings?.results || [];
    const take = (cc) => arr.find(r=>r.iso_3166_1===cc)?.rating;
    return take('FR') || take('US') || '';
  }
}
function imageUrl(item, layout) {
  if (layout === 'portrait') {
    const p = item.poster_path || item.backdrop_path;
    return p ? `${IMG_BASE}/w500${p}` : '';
  } else {
    const b = item.backdrop_path || item.poster_path;
    return b ? `${IMG_BASE}/w780${b}` : '';
  }
}

/* ---------- Détection & choix du meilleur titre à afficher ---------- */
const JAPANESE_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

function pickDisplayTitle(details, type, fallback='') {
  // 1) Essayer une traduction FR fournie par TMDB
  const translations = details?.translations?.translations || [];
  const fr = translations.find(t => t.iso_639_1 === 'fr');
  const en = translations.find(t => t.iso_639_1 === 'en');
  const frTitle = type === 'movie' ? fr?.data?.title : fr?.data?.name;
  const enTitle = type === 'movie' ? en?.data?.title : en?.data?.name;

  if (frTitle && frTitle.trim()) return frTitle.trim();

  // 2) Sinon, si le fallback est en japonais, préférer EN si dispo
  const base = (fallback || '').trim();
  if (JAPANESE_RE.test(base) && enTitle && enTitle.trim()) return enTitle.trim();

  // 3) Sinon, garder fallback (déjà localisé via language=fr-FR si dispo)
  return base;
}

// 👇 A coller sous pickDisplayTitle(...)
function extractYearFromDetails(type, details){
  const dateStr = type === 'movie'
    ? (details?.release_date || details?.primary_release_date || '')
    : (details?.first_air_date || details?.air_date || '');
  return dateStr ? dateStr.slice(0,4) : '';
}


/* ============================ TMDB (DATA) =========================== */
const DATE_FROM = '1980-01-01';
const DATE_TO   = '2010-12-31';

async function getList(type, genreId = '16', limit = 10) {
  const baseParams = {
    with_genres: String(genreId || '16'),
    include_adult: 'false',
    sort_by: 'popularity.desc',
    page: 1
  };
  const dateParams = (type === 'movie')
    ? { 'primary_release_date.gte': DATE_FROM, 'primary_release_date.lte': DATE_TO }
    : { 'first_air_date.gte': DATE_FROM,       'first_air_date.lte': DATE_TO };

  const data = await api(`/discover/${type}`, { ...baseParams, ...dateParams });
  return (data.results || []).slice(0, limit);
}

async function getDetails(type, id) {
  // ➜ On ajoute "translations" pour récupérer les titres FR/EN
  const append = type === 'movie'
    ? 'release_dates,translations'
    : 'content_ratings,translations';
  try { return await api(`/${type}/${id}`, { append_to_response: append }); }
  catch { return null; }
}

async function searchTv(query){
  const data = await api('/search/tv', { query, include_adult:'false', page:1 });
  return (data.results || [])[0] || null;
}

/* ============================ TEMPLATES ============================= */
// avant
// function cardHTML({ title, rank, img, age, duration, genres, link }, layout) {

// après
function cardHTML({ title, rank, img, age, duration, year, genres, link }, layout) {
  const portrait = layout === 'portrait' ? 'portrait' : '';
  const bg = img ? `style="background-image:url('${img}')"` : `style="background-image:linear-gradient(135deg,#555,#333)"`;
  const linkAttr = link ? ` data-link="${link}"` : '';
  return `
    <article class="card ${portrait}"${linkAttr}>
      <span class="badge-rank">${rank ?? ''}</span>
      <div class="thumb" ${bg}></div>
      <div class="gradient"></div>
      <div class="play">
        <button aria-label="Lire" class="js-play"${linkAttr}>
          <svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7-11-7z" fill="currentColor"/></svg>
        </button>
      </div>
      <div class="meta">
        <span class="title">${title || ''}</span>
        <span class="year">${year || ''}</span> <!-- 👈 nouveau -->
        <span class="badge-age">${age || 'NR'}</span>
        <span class="duration">${duration || ''}</span>
        <div class="genres">${genres || ''}</div>
      </div>
    </article>`;
}


/* ====================== HISTORIQUE (localStorage) ======================= */
const HISTORY_KEY = 'vod_history';

function ensureTMDBUrl(p, size = 'w500') {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return `${IMG_BASE}/${size}${p}`;
}
function getHistory(){
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(list){
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }
  catch(e){ console.warn('localStorage indisponible:', e); }
}
function pushHistory(item){
  const list = getHistory();
  const idx = list.findIndex(x => x.id === item.id && x.type === item.type);
  if (idx !== -1) list.splice(idx,1);
  list.unshift({ ...item, ts: Date.now() });
  if (list.length > 30) list.length = 30;
  saveHistory(list);
}
function histImageUrl(h, layout){
  if (layout === 'portrait') {
    return ensureTMDBUrl(h.poster_path || h.backdrop_path, 'w500');
  } else {
    return ensureTMDBUrl(h.backdrop_path || h.poster_path, 'w780');
  }
}

/* ============================ CARROUSEL UI ============================ */
function attachCarousel(root){
  const track    = root.querySelector('[data-track]');
  const viewport = root.querySelector('.viewport') || root;
  const prevBtn  = root.querySelector('[data-prev]');
  const nextBtn  = root.querySelector('[data-next]');
  if (!track) return;

  let index = 0, dragging = false, startX = 0, startIndex = 0, delta = 0;
  const CLICK_THRESHOLD = 6;
  const layout = (root.getAttribute('data-layout') || 'landscape').toLowerCase();

  const gap = () => parseFloat(getComputedStyle(track).gap) || 0;
  const cardSize = () => {
    const first = track.querySelector('.card');
    if (!first) return 0;
    const r = first.getBoundingClientRect();
    return r.width + gap();
  };
  const count = () => track.children.length;

  // per-page par défaut selon layout + breakpoint
  function defaultPerPage(){
    const w = window.innerWidth || viewport.clientWidth;
    if (layout === 'portrait'){
      if (w <= 480)  return 2;
      if (w <= 768)  return 2;
      if (w <= 1024) return 3;
      return 5;
    } else {
      if (w <= 480)  return 1;   // ✅ mobile: 1 carte
      if (w <= 768)  return 1;   // ✅ mobile: 1 carte
      if (w <= 1024) return 2;   // tablette
      return 3;                  // desktop
    }
  }

  const perPageAttr = () => {
    const v = parseInt(root.getAttribute('data-perpage') || '', 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  const stepAttr = () => {
    const v = parseInt(root.getAttribute('data-step') || '', 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };

  // ⚠️ Clamp des attributs par le “meilleur” perPage du breakpoint
  function effectivePerPage(){
    const attr = perPageAttr();
    const def  = defaultPerPage();
    return attr ? Math.min(attr, def) : def;
  }
  function effectiveStep(){
    const s = stepAttr();
    const v = effectivePerPage();
    return s ? Math.min(s, v) : v;
  }

  function visible(){ return effectivePerPage(); }
  function pageStep(){ return effectiveStep(); }

  const maxIndex = () => Math.max(0, count() - visible());

  function clamp(){
    const m = maxIndex();
    if (index < 0) index = 0;
    if (index > m) index = m;
    return m;
  }

  function render(offset=0, animate=true){
    const cs = cardSize() || 1;
    const x  = -(index * cs + offset);
    track.style.transition = animate ? '' : 'none';
    track.style.transform  = `translate3d(${x}px,0,0)`;
    if (!animate){ track.getBoundingClientRect(); track.style.transition = ''; }
  }

  // Wrap propre: on montre la dernière page avant de boucler
  function next(e){
    e?.preventDefault?.(); e?.stopPropagation?.();
    const m = maxIndex();
    const s = pageStep();
    if (index < m) {
      index = Math.min(index + s, m);
    } else {
      index = 0;
    }
    render(0,true);
  }
  function prev(e){
    e?.preventDefault?.(); e?.stopPropagation?.();
    const m = maxIndex();
    const s = pageStep();
    if (index > 0) {
      index = Math.max(index - s, 0);
    } else {
      const lastPageStart = Math.max(0, Math.floor(m / s) * s);
      index = Math.min(lastPageStart, m);
    }
    render(0,true);
  }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // Drag (sans wrap)
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    startIndex = index;
    delta = 0;
    render(0,false);
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    delta = startX - e.clientX;
    render(delta,false);
  });
  function endDrag(e){
    if (!dragging) return;
    const moved = Math.abs(delta);
    dragging = false;

    if (moved < CLICK_THRESHOLD) {
      const target = e.target.closest('.js-play, .card');
      if (target) {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return;
      }
    }
    const cs = cardSize() || 1;
    const raw = startIndex + (delta / cs);
    const s   = pageStep();
    const snapped = Math.round(raw / s) * s;
    index = Math.min(Math.max(0, snapped), maxIndex());
    render(0,true);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => { clamp(); render(0,true); });
  requestAnimationFrame(() => { clamp(); render(0,true); });
}

/* ======================== BUILD TMDB CARROUSEL ======================= */
async function buildCarousel(root){
  const type     = root.getAttribute('data-type')   || 'movie';
  const layout   = root.getAttribute('data-layout') || 'landscape';
  const genreId  = root.getAttribute('data-genre')  || '16';
  const track    = root.querySelector('[data-track]');

  const list = await getList(type, genreId, 10);
  const details = await Promise.all(list.map(i => getDetails(type, i.id)));

track.innerHTML = list.map((item, i) => {
  const d = details[i];
  const age = certToBadge(pickCertification(d, type));
  const duration = type === 'movie'
    ? minutesToText(d?.runtime)
    : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '');
  const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ') || (type==='tv' ? 'Animation' : '');
  const img = imageUrl(item, layout);

  const baseTitle = d?.title || d?.name || item.title || item.name || '';
  const title = pickDisplayTitle(d, type, baseTitle);

  const year = extractYearFromDetails(type, d);            // 👈 NOUVEAU

  return cardHTML({ title, rank: i+1, img, age, duration, year, genres, link: '' }, layout); // 👈 year ajouté
}).join('');


  const cards = Array.from(track.querySelectorAll('.card'));
function record(i) {
  const d = details[i];
  const age = certToBadge(pickCertification(d, type));
  const duration = type === 'movie'
    ? minutesToText(d?.runtime)
    : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '');
  const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ');
  const year = extractYearFromDetails(type, d);            // 👈 NOUVEAU

  pushHistory({
    id: list[i].id,
    type,
    title: d?.title || d?.name || list[i].title || list[i].name || '',
    poster_path: list[i].poster_path || d?.poster_path || '',
    backdrop_path: list[i].backdrop_path || d?.backdrop_path || '',
    age, duration, year, genres                                // 👈 year stocké
  });
  refreshHistoryCarousel();
}


  track.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const i = cards.indexOf(card);
    if (i < 0) return;

    if (e.target.closest('.js-play')) {
      e.preventDefault(); e.stopPropagation();
      record(i); return;
    }
    record(i);
  });

  attachCarousel(root);
}

/* ==================== BUILD & REFRESH HISTORIQUE ==================== */
async function buildHistoryCarousel(root){
  const layout = root.getAttribute('data-layout') || 'landscape';
  const track  = root.querySelector('[data-track]');
  const list   = getHistory();

  const isClientPage = location.pathname.includes('/html/index-client.html');

  let spiesHtml = '';
  try {
    const spiesSearch = await searchTv('Totally Spies');
    if (spiesSearch) {
      const already = list.some(x => x.type === 'tv' && x.id === spiesSearch.id);
      if (!already) {
        const d = await getDetails('tv', spiesSearch.id);
        const age = certToBadge(pickCertification(d, 'tv'));
        const duration = d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '';
        const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ') || 'Animation';
        const img = imageUrl(spiesSearch, layout);

        const baseTitle = d?.name || spiesSearch.name || '';
        const title = pickDisplayTitle(d, 'tv', baseTitle);

        const year = extractYearFromDetails('tv', d);

        const link = isClientPage ? '../html/fiche-dessin-anime.html' : '';
        spiesHtml = cardHTML({ title, rank: 1, img, age, duration, year, genres, link }, layout);
      }
    }
  } catch (e) {
    console.warn('Injection Totally Spies: échec silencieux', e);
  }

  let histHtml = '';
  if (!list.length && !spiesHtml) {
    histHtml = `<div style="padding:20px;color:#cbd5e1">Aucun élément dans l’historique. Cliquez sur ▶️ sur une carte pour l’ajouter.</div>`;
  } else {
histHtml = list.slice(0, 20).map((h, i) => {
  const img = histImageUrl(h, layout);
  return cardHTML({
    title: h.title || '',
    rank: i+1,
    img,
    age: h.age || 'NR',
    duration: h.duration || '',
    year: h.year || '',                // 👈 NOUVEAU
    genres: h.genres || '',
    link: ''
  }, layout);
}).join('');
  }

  track.innerHTML = spiesHtml + histHtml;

  track.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const link = card.dataset.link || e.target.closest('.js-play')?.dataset.link;
    if (link) { e.preventDefault(); location.href = link; }
  });

  attachCarousel(root);
}

async function refreshHistoryCarousel(){
  const root = document.querySelector('[data-carousel][data-source="history"]');
  if (root) await buildHistoryCarousel(root);
}

/* ======================= MIXTE (Films + Séries) ======================= */
async function getMixedList(genreId = '16', limit = 10) {
  const movieParams = {
    with_genres: String(genreId),
    include_adult: 'false',
    sort_by: 'popularity.desc',
    page: 1,
    'primary_release_date.gte': DATE_FROM,
    'primary_release_date.lte': DATE_TO
  };
  const tvParams = {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: 1,
    'first_air_date.gte': DATE_FROM,
    'first_air_date.lte': DATE_TO
  };

  const [movies, tv] = await Promise.all([
    api('/discover/movie', movieParams),
    api('/discover/tv', tvParams)
  ]);

  const norm = (arr, type) => (arr?.results || [])
    .filter(x => x && (x.poster_path || x.backdrop_path))
    .map(x => ({
      type,
      id: x.id,
      poster_path: x.poster_path,
      backdrop_path: x.backdrop_path,
      popularity: x.popularity || 0
    }));

  return [...norm(movies, 'movie'), ...norm(tv, 'tv')]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

async function buildMixedCarousel(root){
  const layout = root.getAttribute('data-layout') || 'portrait';
  const track  = root.querySelector('[data-track]');

  const items   = await getMixedList('16', 10);
  const details = await Promise.all(items.map(it => getDetails(it.type, it.id)));

  track.innerHTML = items.map((it, i) => {
    const d = details[i];
    const age = certToBadge(pickCertification(d, it.type));
    const duration = it.type === 'movie'
      ? minutesToText(d?.runtime)
      : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '');
    const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ') || 'Animation';
    const img = imageUrl(it, layout);

    const baseTitle = d?.title || d?.name || '';
    const title = pickDisplayTitle(d, it.type, baseTitle);

    return cardHTML({ title, rank: i+1, img, age, duration, genres, link: '' }, layout);
  }).join('');

  const buttons = track.querySelectorAll('.js-play');
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const it = items[i];
      const d  = details[i];
      const age = certToBadge(pickCertification(d, it.type));
      const duration = it.type === 'movie'
        ? minutesToText(d?.runtime)
        : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '');
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ');

      const year = extractYearFromDetails(it.type, d);           // 👈 NOUVEAU
      pushHistory({
        id: it.id,
        type: it.type,
        title: d?.title || d?.name || '',
        poster_path: it.poster_path || d?.poster_path || '',
        backdrop_path: it.backdrop_path || d?.backdrop_path || '',
        age, duration, year, genres                               // 👈 year stocké
      });

      refreshHistoryCarousel();
    });
  });

  attachCarousel(root);
}

/* ============================== START =============================== */
document.addEventListener('DOMContentLoaded', async () => {
  if (location.protocol === 'file:') {
    alert('Ouvre la page via un petit serveur local (ex: `npx serve`) pour que TMDB fonctionne.');
    return;
  }

  // MIXTE
  const mixedRoots = document.querySelectorAll('[data-carousel][data-type="mixed"]');
  for (const root of mixedRoots) {
    await buildMixedCarousel(root);
  }

  // TMDB standards (movie / tv)
  const carousels = document.querySelectorAll('[data-carousel]:not([data-source="history"]):not([data-type="mixed"])');
  for (const root of carousels) {
    await buildCarousel(root);
  }

  // Historique
  refreshHistoryCarousel();
});

