// ===============================
// Grande barre de recherche avec TMDB + Résultats + Filtres
// ===============================

/* =========== Clé TMDB ======= */
const API_KEY = 'abedd43cf8d6083e8a33eafb9cc8b3f4';

/* ========================= Références DOM (grande barre & résultats) ========================= */
const form               = document.getElementById('searchForm');
const largeSearchBox     = document.getElementById('large-search-box');
const largeSearchButton  = document.getElementById('large-search-button');
const results            = document.getElementById('results');

/* =============================== Filtres (page résultats) =============================== */
const filterAllButton       = document.getElementById('filter-all');
const filterAnimationButton = document.getElementById('filter-animation');
const filterMoviesButton    = document.getElementById('filter-movies');

/* ======================================== État ======================================== */
let _imageBaseUrl, _imageSizes;
let filterType = 'all';

/* =============================== Utils URL & text =============================== */
/****
 * Lit un paramètre de la query string de l’URL courante.
 * @param {string} name - Nom du paramètre
 * @returns {string|null} Valeur ou null si absent
 ****/
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/****
 * Met à jour les query params (query, filter) puis navigue vers la nouvelle URL.
 * @param {string} [query] - Terme de recherche
 * @param {string} [filter] - Filtre actif ('all' | 'movies' | 'animation')
 * @returns {void}
 ****/
function setQueryParamsAndGo(query, filter) {
  const url = new URL(window.location.href);
  if (query !== undefined && query !== null) {
    const q = String(query).trim();
    if (q) url.searchParams.set('query', q);
    else url.searchParams.delete('query');
  }
  if (filter) url.searchParams.set('filter', filter);
  window.location.href = url.toString();
}
window.setQueryParamsAndGo = setQueryParamsAndGo;

/****
 * Met la première lettre d’une chaîne en majuscule.
 * @param {string} str
 * @returns {string}
 ****/
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* =============================== TMDB helpers =============================== */
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p';

/****
 * Construit une URL TMDB avec clé API et langue FR.
 * @param {string} path
 * @param {object} [params={}]
 * @returns {string}
 ****/
function tmdbUrl(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: 'fr-FR', ...params });
  return `${TMDB_BASE}${path}?${p.toString()}`;
}

/****
 * Effectue un appel fetch vers TMDB et renvoie le JSON.
 * @param {string} path
 * @param {object} params
 * @throws {Error} Si HTTP != 2xx
 * @returns {Promise<object>}
 ****/
async function api(path, params) {
  const res = await fetch(tmdbUrl(path, params));
  if (!res.ok) throw new Error(`TMDB ${res.status} @ ${path}`);
  return res.json();
}

/****
 * Convertit des minutes en texte (ex: 95 -> "1h35").
 * @param {number} m
 * @returns {string}
 ****/
function minutesToText(m) {
  if (!m || m <= 0) return '';
  const h = Math.floor(m / 60), min = m % 60;
  return h ? `${h}h${String(min).padStart(2,'0')}` : `${min}m`;
}

/****
 * Convertit une certification en badge d’âge.
 * @param {string} cert
 * @returns {string}
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
 * Récupère la certification FR/US à partir des détails.
 * @param {object} details
 * @param {'movie'|'tv'} type
 * @returns {string}
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

/* ---------- Détection & choix du meilleur titre à afficher ---------- */
const JAPANESE_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/****
 * Choisit le meilleur titre (FR > EN > fallback, EN si fallback en japonais).
 * @param {object} details
 * @param {'movie'|'tv'} type
 * @param {string} [fallback='']
 * @returns {string}
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

/****
 * Extrait l’année (YYYY) depuis les détails (film/série).
 * @param {'movie'|'tv'} type
 * @param {object} details
 * @returns {string}
 ****/
function extractYearFromDetails(type, details){
  const dateStr = type === 'movie'
    ? (details?.release_date || details?.primary_release_date || '')
    : (details?.first_air_date || details?.air_date || '');
  return dateStr ? dateStr.slice(0,4) : '';
}

/****
 * Détails film (inclut release_dates, translations).
 * @param {number} id
 * @returns {Promise<object|null>}
 ****/
async function getMovieDetails(id){
  try { return await api(`/movie/${id}`, { append_to_response: 'release_dates,translations' }); }
  catch { return null; }
}

/****
 * Détails série (inclut content_ratings, translations).
 * @param {number} id
 * @returns {Promise<object|null>}
 ****/
async function getTvDetails(id){
  try { return await api(`/tv/${id}`, { append_to_response: 'content_ratings,translations' }); }
  catch { return null; }
}

/* =============================== Historique (fallback) =============================== */
const HISTORY_KEY = 'vod_history';

/****
 * Ajoute un élément à l’historique dans localStorage (max 30).
 * @param {object} item
 * @returns {void}
 ****/
function pushHistoryLocal(item){
  try{
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const idx = list.findIndex(x => x.id === item.id && x.type === item.type);
    if (idx !== -1) list.splice(idx,1);
    list.unshift({ ...item, ts: Date.now() });
    if (list.length > 30) list.length = 30;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }catch(e){ console.warn('localStorage indisponible:', e); }
}

/* =============================== Config images TMDB =============================== */
fetch(`https://api.themoviedb.org/3/configuration?api_key=${API_KEY}`)
  .then(r => r.json())
  .then(data => {
    _imageBaseUrl = data?.images?.base_url || 'https://image.tmdb.org/t/p/';
    _imageSizes = data?.images?.poster_sizes || ['w342'];
  })
  .catch(err => console.error('Erreur config TMDB :', err));

/* =============================== Recherche combinée (films + séries) =============================== */
const MAX_RENDER = 20;

/****
 * Recherche films + séries (filtre animation 1970–2010), enrichit via détails, rend et branche l’historique.
 * @param {string} query
 * @returns {Promise<void>}
 ****/
async function search(query) {
  if (!query || !results) return;
  results.innerHTML = '';

  const moviesUrl = tmdbUrl('/search/movie', { query, include_adult:'false' });
  const tvUrl     = tmdbUrl('/search/tv',    { query, include_adult:'false' });

  try {
    const [moviesData, tvData] = await Promise.all([
      fetch(moviesUrl).then(r=>r.json()),
      fetch(tvUrl).then(r=>r.json())
    ]);

    const movies = Array.isArray(moviesData?.results) ? moviesData.results : [];
    const shows  = Array.isArray(tvData?.results)     ? tvData.results     : [];

    const filteredMovies = movies
      .filter(m => (m?.genre_ids || []).includes(16))
      .filter(m => {
        const y = m?.release_date ? new Date(m.release_date).getFullYear() : NaN;
        return y >= 1970 && y <= 2010;
      })
      .slice(0, MAX_RENDER);

    const filteredShows = shows
      .filter(s => (s?.genre_ids || []).includes(16))
      .filter(s => {
        const y = s?.first_air_date ? new Date(s.first_air_date).getFullYear() : NaN;
        return y >= 1970 && y <= 2010;
      })
      .slice(0, MAX_RENDER);

    const [movieDetails, tvDetails] = await Promise.all([
      Promise.all(filteredMovies.map(m => getMovieDetails(m.id))),
      Promise.all(filteredShows.map(s => getTvDetails(s.id)))
    ]);

    const enrichedMovies = filteredMovies.map((m, i) => {
      const d = movieDetails[i];
      const baseTitle = m.title || '';
      const title = pickDisplayTitle(d, 'movie', baseTitle);
      const year  = extractYearFromDetails('movie', d) || (m.release_date?.slice(0,4) || '');
      const poster = m?.poster_path ? getMoviePoster(m.poster_path) : 'https://via.placeholder.com/200x300?text=No+Image';
      const age = certToBadge(pickCertification(d,'movie'));
      const duration = minutesToText(d?.runtime);
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ');
      return { type: 'movie', id: m.id, title, year, poster, age, duration, genres, _details: d };
    });

    const enrichedShows = filteredShows.map((s, i) => {
      const d = tvDetails[i];
      const baseTitle = s.name || '';
      const title = pickDisplayTitle(d, 'tv', baseTitle);
      const year  = extractYearFromDetails('tv', d) || (s.first_air_date?.slice(0,4) || '');
      const poster = s?.poster_path ? getMoviePoster(s.poster_path) : 'https://via.placeholder.com/200x300?text=No+Image';
      const age = certToBadge(pickCertification(d,'tv'));
      const duration = d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : '';
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(' • ');
      return { type: 'tv', id: s.id, title, year, poster, age, duration, genres, _details: d };
    });

    if (filterType === 'all') {
      const total = enrichedMovies.length + enrichedShows.length;
      const niceQuery = capitalizeFirst(query);
      results.innerHTML = buildResultsHeader(niceQuery, total);
      results.innerHTML += enrichedMovies.map(buildCardElement).join('');
      results.innerHTML += enrichedShows.map(buildCardElement).join('');
    } else if (filterType === 'movies') {
      results.innerHTML = buildResultsHeader('Films', enrichedMovies.length);
      results.innerHTML += enrichedMovies.map(buildCardElement).join('');
    } else if (filterType === 'animation') {
      results.innerHTML = buildResultsHeader('Animation', enrichedShows.length);
      results.innerHTML += enrichedShows.map(buildCardElement).join('');
    }

    if (!results.__historyBound) {
      results.addEventListener('click', (e) => {
        const card = e.target.closest('.card[data-type][data-id]');
        if (!card) return;
        const type = card.dataset.type;
        const id   = Number(card.dataset.id || 0);
        if (!id || !type) return;

        const list = [...enrichedMovies, ...enrichedShows];
        const item = list.find(x => x.id === id && x.type === type);
        if (!item) return;

        const payload = {
          id: item.id,
          type: item.type,
          title: item.title || '',
          poster_path: item._details?.poster_path || '',
          backdrop_path: item._details?.backdrop_path || '',
          age: item.age || 'NR',
          duration: item.duration || '',
          year: item.year || '',
          genres: item.genres || ''
        };

        if (typeof pushHistory === 'function') pushHistory(payload);
        else pushHistoryLocal(payload);

        if (typeof refreshHistoryCarousel === 'function') refreshHistoryCarousel();
      });
      results.__historyBound = true;
    }

  } catch (err) {
    console.error('Erreur recherche combinée :', err);
    results.innerHTML = `<div class="results-header"><h2>Erreur lors de la recherche.</h2></div>`;
  }
}

/* =============================== Templates (cartes résultats) =============================== */
/****
 * Construit l’en-tête de résultats.
 * @param {string} typeOrQuery
 * @param {number} count
 * @returns {string}
 ****/
function buildResultsHeader(typeOrQuery, count) {
  return `<div class="results-header"><h2>${count} résultats pour "${typeOrQuery}"</h2></div>`;
}

/****
 * Construit le HTML d’une carte résultat.
 * @param {object} item - {type, id, title, year, poster, age, duration, genres}
 * @returns {string}
 ****/
function buildCardElement(item) {
  return `
    <div class="card" data-type="${item.type}" data-id="${item.id}">
      <img src="${item.poster}" alt="${item.title || (item.type==='movie' ? 'Film' : 'Série')}">
      <div>
        <p>${item.title || 'Titre inconnu'}</p>
        <p>${item.year || 'Année inconnue'}</p>
      </div>
    </div>`;
}

/****
 * Compose l’URL d’un poster TMDB à partir de la configuration.
 * @param {string} imagePath
 * @returns {string}
 ****/
function getMoviePoster(imagePath) {
  const base = _imageBaseUrl || `${IMG_BASE}/`;
  const size = _imageSizes?.[2] || _imageSizes?.[0] || 'w342';
  return `${base}${size}${imagePath}`;
}

/* =============================== Chargement initial (URL → recherche) =============================== */
/****
 * Lit la query et le filtre depuis l’URL, lance la recherche et hydrate l’input.
 * @returns {void}
 ****/
function loadResults() {
  const queryFromUrl = getQueryParam('query');
  const filterFromUrl = getQueryParam('filter');
  filterType = filterFromUrl || 'all';
  if (queryFromUrl) {
    search(queryFromUrl);
    if (largeSearchBox) largeSearchBox.value = queryFromUrl;
  }
}
window.addEventListener('load', loadResults);

/* =============================== Filtres (indépendants) =============================== */
/****
 * Applique un filtre, lit la query active et rafraîchit la page avec les params.
 * @param {'all'|'movies'|'animation'} newFilterType
 * @returns {void}
 ****/
function applyFilter(newFilterType) {
  filterType = newFilterType;
  const q =
    (document.getElementById('large-search-box')?.value ||
     getQueryParam('query') ||
     '').trim();
  if (q) {
    setQueryParamsAndGo(q, filterType);
  } else {
    setQueryParamsAndGo('', filterType);
  }
}

filterAllButton?.addEventListener('click', () => applyFilter('all'));
filterAnimationButton?.addEventListener('click', () => applyFilter('animation'));
filterMoviesButton?.addEventListener('click', () => applyFilter('movies'));

/* =============================== Listeners grande barre =============================== */
document.addEventListener('DOMContentLoaded', () => {
  if (largeSearchBox) {
    largeSearchBox.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const q = largeSearchBox.value.trim();
        if (q) setQueryParamsAndGo(q, 'all');
      }
    });
  }
  if (largeSearchButton && largeSearchBox) {
    largeSearchButton.addEventListener('click', () => {
      const q = largeSearchBox.value.trim();
      if (q) setQueryParamsAndGo(q, 'all');
    });
  }
  if (form && largeSearchBox) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = largeSearchBox.value.trim();
      if (q) setQueryParamsAndGo(q, 'all');
    });
  }
});

/* =============================== Événement “search:submit” (petite barre) =============================== */
document.addEventListener('search:submit', (e) => {
  const q = (e.detail?.query || '').trim();
  if (q) setQueryParamsAndGo(q, 'all');
});

