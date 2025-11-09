/* ============================== CONFIG ============================== */
const API_KEY   = 'abedd43cf8d6083e8a33eafb9cc8b3f4';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p';

/* ============================ UTILITAIRES =========================== */
/****
 * Construit une URL TMDB avec la clé & la langue FR
 * @param {string} path - Chemin d'endpoint (ex: /discover/movie)
 * @param {object} [params={}] - Paramètres query additionnels
 * @returns {string} URL complète prête pour fetch
 ****/
function tmdbUrl(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: 'fr-FR', ...params });
  return `${TMDB_BASE}${path}?${p.toString()}`;
}

/****
 * Appelle l’API TMDB et renvoie le JSON
 * @param {string} path - Endpoint TMDB (ex: /search/tv)
 * @param {object} params - Paramètres query passés à tmdbUrl
 * @throws Error si la réponse HTTP n’est pas OK
 * @returns {Promise<object>} Données JSON
 ****/
async function api(path, params) {
  const res = await fetch(tmdbUrl(path, params));
  if (!res.ok) throw new Error(`TMDB ${res.status} @ ${path}`);
  return res.json();
}

/****
 * Convertit des minutes en texte lisible (ex: 95 -> "1h35")
 * @param {number} m - Durée en minutes
 * @returns {string} "XhYY", "Zm" ou '' si invalide
 ****/
function minutesToText(m) {
  if (!m || m <= 0) return '';
  const h = Math.floor(m / 60), min = m % 60;
  return h ? `${h}h${String(min).padStart(2,'0')}` : `${min}m`;
}

/****
 * Normalise une certification en badge d’âge (ex: "PG-13" -> "13+")
 * @param {string} cert - Certification brute
 * @returns {string} Badge (Tous, 10+, 12+, 16+, 18+, NR, etc.)
 ****/
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

/****
 * Récupère la certification FR/US depuis les détails TMDB
 * @param {'movie'|'tv'} type - Type de contenu
 * @param {object} details - Détails TMDB (avec append)
 * @returns {string} Certification brute ou ''
 ****/
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

/****
 * Choisit la meilleure image selon l’orientation (poster/backdrop)
 * @param {object} item - Élément TMDB (poster_path/backdrop_path)
 * @param {'portrait'|'landscape'} layout - Orientation voulue
 * @returns {string} URL d’image ou ''
 ****/
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

/****
 * Sélectionne le meilleur titre (FR > EN > fallback, EN si fallback JP)
 * @param {object} details - Détails TMDB avec translations
 * @param {'movie'|'tv'} type - Type de contenu
 * @param {string} [fallback=''] - Titre de secours
 * @returns {string} Titre affichable
 ****/
function pickDisplayTitle(details, type, fallback='') {
  const translations = details?.translations?.translations || [];
  const fr = translations.find(t => t.iso_639_1 === 'fr');
  const en = translations.find(t => t.iso_639_1 === 'en');
  const frTitle = type === 'movie' ? fr?.data?.title : fr?.data?.name;
  const enTitle = type === 'movie' ? en?.data?.title : en?.data?.name;
  if (frTitle && frTitle.trim()) return frTitle.trim();
  const base = (fallback || '').trim();
  if (JAPANESE_RE.test(base) && enTitle && enTitle.trim()) return enTitle.trim();
  return base;
}


/* ============================ HISTORIQUE =========================== */
const HISTORY_KEY = 'vod_history';

/****
 * Convertit un path TMDB en URL absolue (ou renvoie tel quel si déjà URL)
 * @param {string} p - Chemin d’image ou URL complète
 * @param {string} [size='w500'] - Taille TMDB (ex: w500)
 * @returns {string} URL image ou ''
 ****/
function ensureTMDBUrl(p, size = 'w500') {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return `${IMG_BASE}/${size}${p}`;
}

/****
 * Lit l’historique depuis localStorage
 * @returns {object[]} Liste d’items (ou [])
 ****/
function getHistory(){
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

/****
 * Sauvegarde la liste dans localStorage (catch silencieux)
 * @param {object[]} list - Items à persister
 ****/
function saveHistory(list){
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }
  catch(e){ console.warn('localStorage indisponible:', e); }
}

/****
 * Pousse/replace un item en tête de l’historique (max 30)
 * @param {object} item - Élément { id, type, title, ... }
 * @sideEffect Met à jour localStorage
 ****/
function pushHistory(item){
  const list = getHistory();
  const idx = list.findIndex(x => x.id === item.id && x.type === item.type);
  if (idx !== -1) list.splice(idx,1);
  list.unshift({ ...item, ts: Date.now() });
  if (list.length > 30) list.length = 30;
  saveHistory(list);
}

/****
 * Reconstruit le carrousel d’historique (si présent dans le DOM)
 * @sideEffect Écrit dans le DOM et attache le carrousel
 ****/
async function refreshHistoryCarousel(){
  const root = document.querySelector('[data-carousel][data-source="history"]');
  if (!root) return;
  const layout = root.getAttribute('data-layout') || 'landscape';
  const track  = root.querySelector('[data-track]');
  const list   = getHistory();
  let histHtml = '';
  if (!list.length) {
    histHtml = `<div style="padding:20px;color:#cbd5e1">Aucun élément dans l’historique. Cliquez sur ▶️ sur une carte pour l’ajouter.</div>`;
  } else {
    histHtml = list.slice(0, 20).map((h, i) => {
      const img = (layout === 'portrait')
        ? ensureTMDBUrl(h.poster_path || h.backdrop_path, 'w500')
        : ensureTMDBUrl(h.backdrop_path || h.poster_path, 'w780');
      return cardHTML({ title: h.title || '', rank: i+1, img, age: h.age || 'NR', duration: h.duration || '', genres: h.genres || '', link: '' }, layout);
    }).join('');
  }
  track.innerHTML = histHtml;
  attachCarousel(root);
}


/* ============================ CARROUSEL UI ============================ */
/****
 * Active le carrousel (navigation, drag, responsive)
 * @param {HTMLElement} root - Élément racine [data-carousel]
 * @sideEffect Ajoute des listeners & met à jour les transforms
 ****/
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


/* ======================= CARD HTML (custom) ======================= */
/****
 * Génére le HTML d’une carte de contenu
 * @param {object} props - title, rank, img, age, duration, year, genres, link
 * @param {'portrait'|'landscape'} layout - Orientation
 * @returns {string} HTML prêt à injecter
 ****/
function cardHTML({ title, rank, img, age, duration, year, genres, link }, layout) {
  const portrait = layout === 'portrait' ? 'portrait' : '';
  const bg = img ? `style="background-image:url('${img}')"` : `style="background-image:linear-gradient(135deg,#555,#333)"`;
  const linkAttr = link ? ` data-link="${link}"` : '';
  return `
    <article class="card ${portrait}"${linkAttr}>
      <span class="badge-rank">${rank}</span>
      <div class="thumb" ${bg}></div>
      <div class="gradient"></div>
      <div class="play">
        <button aria-label="Lire" class="js-play"${linkAttr}>
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7-11-7z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <div class="meta">
        <span class="title">${title || ''}</span>
        <span class="year">${year || ''}</span> <!-- 👈 ajout ici -->
        <span class="badge-age">${age || 'NR'}</span>
        <span class="duration">${duration || ''}</span>
        <div class="genres">${genres || ''}</div>
      </div>
    </article>`;
}


/* ============== TOPIC: TOTALLY SPIES — MIX ANIMÉ TV + FILMS ============== */
const TS_CFG = {
  step: { landscape: 3, portrait: 5 },
  dates: { from: '1970-01-01', to: '2010-12-31' },
  total: 10
};

/* Seeds prioritaires — ordre EXACT conservé */
const PRIORITY_SEEDS = [
  { q: 'Totally Spies! The Movie',         type: 'movie' },
  { q: 'Martin Mystery',                   type: 'tv'    },
  { q: "Cat's Eye",                        type: 'tv'    },
  { q: 'Kim Possible',                     type: 'tv'    },
  { q: 'Team Galaxy',                      type: 'tv'    },
  { q: 'Galaxie Académie',                 type: 'tv'    },
  { q: 'W.I.T.C.H.',                       type: 'tv'    },
  { q: 'Detective Conan',                  type: 'tv'    },
  { q: 'Les Super Nanas',                  type: 'tv'    },
  { q: 'Detective Conan: Le Gratte-Ciel infernal', type: 'movie' },
  { q: 'fantomette',                        type: 'tv'    },
];

/* Mots-clés similaires pour compléter (si besoin) */
const TS_SPY_KEYWORDS = [
  'spy','espionage','secret agent','covert','undercover',
  'teen','high school','girl','female protagonist',
  'crime-fighting','team','action comedy',
  'detective','investigation','secret organization',
  'thief','thieves','heist','vigilante','martial arts'
];

/****
 * Indique si un item (liste) est animé via ses genre_ids
 * @param {object} item - Élément de liste TMDB
 * @returns {boolean}
 ****/
function ts_isAnimatedFromListItem(item){ return Array.isArray(item?.genre_ids) && item.genre_ids.includes(16); }

/****
 * Indique si des détails TMDB sont "animation" via leurs genres
 * @param {object} details - Détails TMDB
 * @returns {boolean}
 ****/
function ts_isAnimatedFromDetails(details){
  const names = (details?.genres || []).map(g => (g.name || '').toLowerCase());
  return names.includes('animation') || names.includes('animé') || names.includes('animación');
}

/****
 * Concatène des ids de mots-clés pour la query (OR)
 * @param {number[]} ids
 * @returns {string} "id1|id2|..."
 ****/
function ts_keywordsOr(ids){ return (ids && ids.length) ? ids.join('|') : ''; }

/****
 * Récupère les IDs TMDB des mots-clés fournis
 * @param {string[]} queries - Mots-clés à rechercher
 * @returns {Promise<number[]>} Liste d’IDs uniques
 ****/
async function ts_searchKeywordIds(queries){
  const ids = [];
  for (const q of queries) {
    try {
      const r = await api('/search/keyword', { query: q });
      const top = (r.results || [])[0];
      if (top?.id) ids.push(top.id);
    } catch {}
  }
  return [...new Set(ids)];
}

/****
 * Découvre des séries animées entre deux dates (avec filtres mots-clés)
 * @param {string} from - Date min YYYY-MM-DD
 * @param {string} to   - Date max YYYY-MM-DD
 * @param {number} [limit=80] - Taille max du pool
 * @returns {Promise<object[]>} Résultats TV normalisés
 ****/
async function discoverTv(from, to, limit = 80){
  const kwIds = await ts_searchKeywordIds(TS_SPY_KEYWORDS);
  const params = {
    with_genres: '16',
    sort_by: 'popularity.desc',
    'first_air_date.gte': from, 'first_air_date.lte': to,
    include_null_first_air_dates: 'false',
    with_keywords: ts_keywordsOr(kwIds) || undefined
  };
  const pages = [1,2,3];
  const bags = await Promise.all(pages.map(p => api('/discover/tv', { ...params, page: p }).catch(()=>({results:[]}))));
  const all  = bags.flatMap(b => b.results || []);
  const tv   = all.filter(ts_isAnimatedFromListItem).map(x => ({ ...x, __type: 'tv' }));
  const seen = new Set();
  return tv.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true))).slice(0, limit);
}

/****
 * Découvre des films animés entre deux dates (avec filtres mots-clés)
 * @param {string} from - Date min YYYY-MM-DD
 * @param {string} to   - Date max YYYY-MM-DD
 * @param {number} [limit=60] - Taille max du pool
 * @returns {Promise<object[]>} Résultats Movie normalisés
 ****/
async function discoverMovies(from, to, limit = 60){
  const kwIds = await ts_searchKeywordIds(TS_SPY_KEYWORDS);
  const params = {
    with_genres: '16',
    include_adult: 'false',
    sort_by: 'popularity.desc',
    'primary_release_date.gte': from, 'primary_release_date.lte': to,
    with_keywords: ts_keywordsOr(kwIds) || undefined
  };
  const pages = [1,2];
  const bags = await Promise.all(pages.map(p => api('/discover/movie', { ...params, page: p }).catch(()=>({results:[]}))));
  const all  = bags.flatMap(b => b.results || []);
  const mv   = all.filter(ts_isAnimatedFromListItem).map(x => ({ ...x, __type: 'movie' }));
  const seen = new Set();
  return mv.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true))).slice(0, limit);
}

/****
 * Récupère les détails d’un film/série (append: dates/certifs + translations)
 * @param {'movie'|'tv'} type
 * @param {number} id
 * @returns {Promise<object|null>}
 ****/
async function getDetails(type, id){
  const append = type === 'movie' ? 'release_dates,translations' : 'content_ratings,translations';
  try { return await api(`/${type}/${id}`, { append_to_response: append }); }
  catch { return null; }
}

/****
 * Supprime les doublons (clé: __type:id) en conservant l’ordre
 * @param {object[]} items
 * @returns {object[]} items uniques
 ****/
function uniqByTypeId(items){
  const seen = new Set();
  return items.filter(it => {
    const key = `${it.__type}:${it.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/****
 * Recherche un seed précis (TV/Movie) borné par dates
 * @param {{q:string,type:'tv'|'movie'}} seed
 * @param {string} from
 * @param {string} to
 * @returns {Promise<object|null>} Premier hit ou null
 ****/
async function searchSeed(seed, from, to){
  try {
    if (seed.type === 'tv') {
      const s = await api('/search/tv', { query: seed.q, include_adult: 'false', page: 1 });
      const hit = (s.results || []).find(r => {
        const d = (r.first_air_date || '').slice(0,10);
        return d && d >= from && d <= to;
      });
      return hit ? { ...hit, __type: 'tv' } : null;
    } else if (seed.type === 'movie') {
      const s = await api('/search/movie', { query: seed.q, include_adult: 'false', page: 1 });
      const hit = (s.results || []).find(r => {
        const d = (r.release_date || '').slice(0,10);
        return d && d >= from && d <= to;
      });
      return hit ? { ...hit, __type: 'movie' } : null;
    } else {
      return (await searchSeed({ ...seed, type:'tv' }, from, to)) ||
             (await searchSeed({ ...seed, type:'movie' }, from, to));
    }
  } catch { return null; }
}

/****
 * Construit le carrousel “Totally Spies” mixte (TV + Films)
 * @param {HTMLElement} root - Racine [data-carousel][data-topic="totally-spies"]
 * @sideEffect Met en place le DOM et les handlers ▶️ + historique
 ****/
async function buildSpiesSuggestionsMixedCarousel(root){
  const layout = (root.getAttribute('data-layout') || 'landscape').toLowerCase();
  const track  = root.querySelector('[data-track]');
  if (!track) return;

  // per-page/step
  if (layout === 'landscape') {
    root.setAttribute('data-perpage', String(TS_CFG.step.landscape));
    root.setAttribute('data-step',    String(TS_CFG.step.landscape));
  } else if (layout === 'portrait') {
    root.setAttribute('data-perpage', String(TS_CFG.step.portrait));
    root.setAttribute('data-step',    String(TS_CFG.step.portrait));
  }

  const { from, to } = TS_CFG.dates;

  // 1) Seeds (ordre exact)
  const seedHits = [];
  for (let i = 0; i < PRIORITY_SEEDS.length; i++) {
    const s = PRIORITY_SEEDS[i];
    const hit = await searchSeed(s, from, to);
    if (hit) seedHits.push({ ...hit, __seedIndex: i });
  }

  // 2) Compléments (discover)
  const [tvPool, moviePool] = await Promise.all([ discoverTv(from, to, 80), discoverMovies(from, to, 60) ]);

  // 3) Pool global (unicité)
  let pool = uniqByTypeId([...seedHits, ...tvPool, ...moviePool]);

  // 4) Détails + filtres (animation + bornes)
  const chosen = pool.slice(0, TS_CFG.total);
  const details = await Promise.all(chosen.map(it => getDetails(it.__type, it.id)));

  const filtered = [];
  for (let i = 0; i < chosen.length; i++) {
    const it = chosen[i], d = details[i];
    if (!d) continue;
    if (!ts_isAnimatedFromDetails(d)) continue;
    const dateStr = it.__type === 'tv'
      ? (d.first_air_date || d.air_date || '')
      : (d.release_date || d.primary_release_date || '');
    if (dateStr && (dateStr < from || dateStr > to)) continue;
    filtered.push({ it, d });
  }

  // backfill si < total
  let idx = TS_CFG.total;
  while (filtered.length < TS_CFG.total && idx < pool.length) {
    const it = pool[idx++];
    const d = await getDetails(it.__type, it.id);
    if (!d || !ts_isAnimatedFromDetails(d)) continue;
    const dateStr = it.__type === 'tv' ? (d.first_air_date || d.air_date || '') : (d.release_date || '');
    if (dateStr && (dateStr < from || dateStr > to)) continue;
    filtered.push({ it, d });
  }

  if (!filtered.length) {
    track.innerHTML = `<div style="padding:16px;color:#cbd5e1">Aucune suggestion trouvée.</div>`;
    attachCarousel(root); return;
  }

  // 5) Tri final — seeds d'abord dans l’ordre EXACT
  const seedIndexMap = new Map(seedHits.map(x => [`${x.__type}:${x.id}`, x.__seedIndex]));
  filtered.sort((a, b) => {
    const ka = `${a.it.__type}:${a.it.id}`;
    const kb = `${b.it.__type}:${b.it.id}`;
    const aIsSeed = seedIndexMap.has(ka);
    const bIsSeed = seedIndexMap.has(kb);
    if (aIsSeed && bIsSeed) return seedIndexMap.get(ka) - seedIndexMap.get(kb);
    if (aIsSeed) return -1;
    if (bIsSeed) return 1;
    return (b.it.popularity || 0) - (a.it.popularity || 0);
  });

  // 6) Rendu (limite 10)
  const out = filtered.slice(0, TS_CFG.total);
  track.innerHTML = out.map(({ it, d }, i) => {
    const age = certToBadge(pickCertification(d, it.__type)) || 'NR';
    const duration = it.__type === 'movie'
      ? minutesToText(d?.runtime)
      : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '');
    const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ') || 'Animation';
    const img = imageUrl(it, layout);
    const baseTitle = d?.title || d?.name || it.title || it.name || '';
    const title = pickDisplayTitle(d, it.__type, baseTitle);
    const dateStr = it.__type === 'tv' ? (d.first_air_date || d.air_date || '') : (d.release_date || d.primary_release_date || '');
    const year = dateStr ? dateStr.slice(0, 4) : '';

    return cardHTML({ title, rank: i+1, img, age, duration, year, genres, link: '' }, layout);
  }).join('');

  // 7) Bouton ▶️ → Historique
  const buttons = track.querySelectorAll('.js-play');
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const { it, d } = out[i];
      const age = certToBadge(pickCertification(d, it.__type)) || 'NR';
      const duration = it.__type === 'movie'
        ? minutesToText(d?.runtime)
        : (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '');
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ');
      pushHistory({
        id: it.id,
        type: it.__type,
        title: d?.title || d?.name || it.title || it.name || '',
        poster_path: it.poster_path || d?.poster_path || '',
        backdrop_path: it.backdrop_path || d?.backdrop_path || '',
        age, duration, genres
      });
      refreshHistoryCarousel();
    });
  });

  attachCarousel(root);
}


/* ============================== START =============================== */
/****
 * Point d’entrée: prépare le carrousel “Totally Spies” + historique
 * @sideEffect Lit/écrit le DOM, affiche des warnings si file://
 ****/
document.addEventListener('DOMContentLoaded', async () => {
  if (location.protocol === 'file:') console.warn('TMDB nécessite un serveur HTTP (ex: npx serve).');
  const spiesCarousels = document.querySelectorAll('[data-carousel][data-topic="totally-spies"]');
  for (const root of spiesCarousels) {
    try { await buildSpiesSuggestionsMixedCarousel(root); }
    catch (e) { console.warn('Erreur suggestions (mix):', e); }
  }
  refreshHistoryCarousel();
});
