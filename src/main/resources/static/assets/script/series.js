/* ============================== CONFIG GLOBALE ============================== */
const API_KEY   = "abedd43cf8d6083e8a33eafb9cc8b3f4";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE  = "https://image.tmdb.org/t/p";

/* === Fenêtres temporelles par défaut === */
const DATE_FROM_MOVIE = "1970-01-01";
const DATE_TO_MOVIE   = "2010-12-31";
const DATE_FROM_TV    = "1970-01-01";
const DATE_TO_TV      = "2010-12-31";

/* ============================== UTILITAIRES =============================== */
/****
 * Construit une URL TMDB avec la clé API et la langue FR.
 * @param {string} path
 * @param {object} [params={}]
 * @returns {string}
 ****/
function tmdbUrl(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: "fr-FR", ...params });
  return `${TMDB_BASE}${path}?${p.toString()}`;
}

/****
 * Effectue un appel TMDB et renvoie le JSON, lève si non-2xx.
 * @param {string} path
 * @param {object} params
 * @returns {Promise<object>}
 ****/
async function api(path, params) {
  const res = await fetch(tmdbUrl(path, params));
  if (!res.ok) throw new Error(`TMDB ${res.status} @ ${path}`);
  return res.json();
}

/****
 * Convertit des minutes en texte (95 -> "1h35").
 * @param {number} m
 * @returns {string}
 ****/
function minutesToText(m) {
  if (!m || m <= 0) return "";
  const h = Math.floor(m / 60), min = m % 60;
  return h ? `${h}h${String(min).padStart(2,"0")}` : `${min}m`;
}

/* ----- Certifications (âge) ----- */
/****
 * Normalise une certification en badge d’âge.
 * @param {string} cert
 * @returns {string}
 ****/
function certToBadge(cert) {
  const c = (cert || "").toUpperCase().trim();
  if (!c) return "NR";
  if (["U","TOUS PUBLICS","G","TP"].includes(c)) return "Tous";
  if (["10","-10"].includes(c)) return "10+";
  if (["12","-12","PG-12"].includes(c)) return "12+";
  if (["13","PG-13"].includes(c)) return "13+";
  if (["14","-14","TV-14"].includes(c)) return "14+";
  if (["16","-16","R","TV-MA"].includes(c)) return "16+";
  if (["18","-18","NC-17"].includes(c)) return "18+";
  return c;
}

/****
 * Extrait la certification FR/US depuis les détails.
 * @param {object} details
 * @param {'movie'|'tv'} type
 * @returns {string}
 ****/
function pickCertification(details, type) {
  if (!details) return "";
  if (type === "movie") {
    const arr = details.release_dates?.results || [];
    const take = (cc) => arr.find(r=>r.iso_3166_1===cc)?.release_dates?.find(d=>d.certification?.trim())?.certification;
    return take("FR") || take("US") || "";
  } else {
    const arr = details.content_ratings?.results || [];
    const take = (cc) => arr.find(r=>r.iso_3166_1===cc)?.rating;
    return take("FR") || take("US") || "";
  }
}

/* ----- Choix du meilleur titre d’affichage ----- */
const JAPANESE_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/****
 * Choisit le meilleur titre (FR > EN > fallback, EN si fallback japonais).
 * @param {object} details
 * @param {'movie'|'tv'} type
 * @param {string} [fallback=""]
 * @returns {string}
 ****/
function pickDisplayTitle(details, type, fallback="") {
  const translations = details?.translations?.translations || [];
  const fr = translations.find(t => t.iso_639_1 === "fr");
  const en = translations.find(t => t.iso_639_1 === "en");
  const frTitle = type === "movie" ? fr?.data?.title : fr?.data?.name;
  const enTitle = type === "movie" ? en?.data?.title : en?.data?.name;

  if (frTitle && frTitle.trim()) return frTitle.trim();

  const base = (fallback || "").trim();
  if (JAPANESE_RE.test(base) && enTitle && enTitle.trim()) return enTitle.trim();

  return base;
}

/****
 * Extrait l’année (YYYY) depuis les détails.
 * @param {'movie'|'tv'} type
 * @param {object} details
 * @returns {string}
 ****/
function extractYearFromDetails(type, details){
  const dateStr = type === "movie"
    ? (details?.release_date || details?.primary_release_date || "")
    : (details?.first_air_date || details?.air_date || "");
  return dateStr ? dateStr.slice(0,4) : "";
}

/* ----- Images utiles (selon layout) ----- */
/****
 * Retourne l’URL d’image (poster/backdrop) selon l’orientation.
 * @param {object} item
 * @param {'portrait'|'landscape'} layout
 * @returns {string}
 ****/
function imageUrl(item, layout) {
  if (layout === "portrait") {
    const p = item.poster_path || item.backdrop_path;
    return p ? `${IMG_BASE}/w500${p}` : "";
  } else {
    const b = item.backdrop_path || item.poster_path;
    return b ? `${IMG_BASE}/w780${b}` : "";
  }
}

/* ----- Historique (fallback si fonctions globales absentes) ----- */
const HISTORY_KEY = "vod_history";

/****
 * Ajoute un élément à l’historique (localStorage), limite 30 éléments.
 * @param {object} item
 * @returns {void}
 ****/
function pushHistoryLocal(item){
  try{
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const idx = list.findIndex(x => x.id === item.id && x.type === item.type);
    if (idx !== -1) list.splice(idx,1);
    list.unshift({ ...item, ts: Date.now() });
    if (list.length > 30) list.length = 30;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }catch(e){ console.warn("localStorage indisponible:", e); }
}

/* ============================== FILMS ============================== */
/* ---- Etat films ---- */
let selectedGenreFilm = "";
let selectedAnneeFilm = "";
let currentPageFilm   = 1;
let totalPagesFilm    = null;
const PAGE_SIZE_TMDB  = 20;
let lastPageCountFilm = 0;
let sortOrderFilm     = "pop";
let lastFilmsPage     = [];
const MAX_PAGES_TO_LOAD = 5;
let clientPaging = false;
let cacheFilms   = [];

/* ---- Endpoints films ---- */
const apiUrlBaseFilms =
  `${TMDB_BASE}/discover/movie?api_key=${API_KEY}` +
  `&with_genres=16&primary_release_date.gte=${DATE_FROM_MOVIE}&primary_release_date.lte=${DATE_TO_MOVIE}` +
  `&language=fr-FR&include_adult=false`;

/****
 * Convertit "YYYY,YYYY" en bornes de dates complètes pour films.
 * @param {string} rangeStr
 * @returns {{gte:string,lte:string}|null}
 ****/
function toDateRangeFromYearsMovies(rangeStr) {
  if (!rangeStr) return null;
  const [startYear, endYear] = rangeStr.split(",").map(s => s.trim());
  if (!startYear || !endYear) return null;
  return { gte: `${startYear}-01-01`, lte: `${endYear}-12-31` };
}

/****
 * Normalise les résultats TMDB film pour l’UI.
 * @param {object[]} results
 * @returns {object[]}
 ****/
function mapFilms(results = []) {
  return results.map(film => ({
    title: film.title,
    year: film.release_date ? film.release_date.split("-")[0] : "Année inconnue",
    affiche: film.poster_path
      ? `${IMG_BASE}/w500${film.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible",
    popularity: film.popularity ?? 0,
    tmdbId: film.id
  }));
}

/****
 * Détails film (append release_dates, translations).
 * @param {number} id
 * @returns {Promise<object|null>}
 ****/
async function getMovieDetails(id) {
  try { return await api(`/movie/${id}`, { append_to_response: "release_dates,translations" }); }
  catch { return null; }
}

/* ---- Fetch films ---- */
/****
 * Charge une page de films en appliquant les filtres et met à jour l’UI.
 * @param {number} [page=1]
 * @returns {Promise<void>}
 ****/
function fetchFilms(page = 1) {
  let apiUrl = `${apiUrlBaseFilms}&page=${page}`;

  if (sortOrderFilm === "az")  apiUrl += `&sort_by=original_title.asc`;
  if (sortOrderFilm === "za")  apiUrl += `&sort_by=original_title.desc`;

  if (selectedGenreFilm) {
    apiUrl += `&with_genres=16,${selectedGenreFilm}`;
  }
  if (selectedAnneeFilm) {
    const range = toDateRangeFromYearsMovies(selectedAnneeFilm);
    if (range) {
      apiUrl += `&primary_release_date.gte=${range.gte}&primary_release_date.lte=${range.lte}`;
    }
  }

  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error("Erreur lors de la récupération des données");
      return response.json();
    })
    .then(async data => {
      totalPagesFilm    = (typeof data.total_pages === "number") ? data.total_pages : null;
      currentPageFilm   = page;
      lastPageCountFilm = Array.isArray(data.results) ? data.results.length : 0;

      const filmsList = mapFilms(data.results || []);
      await displayFilms(filmsList);
      updatePaginationServer();
    })
    .catch(error => {
      console.error("Erreur films:", error);
      const containerFilms = document.getElementById("films");
      if (containerFilms) containerFilms.innerHTML = "<p>Erreur lors de la récupération des films.</p>";
    });
}

/****
 * Version brute (results seulement) pour le mode client.
 * @param {number} [page=1]
 * @returns {Promise<object[]>}
 ****/
function fetchFilmsRaw(page = 1) {
  let apiUrl = `${apiUrlBaseFilms}&page=${page}`;
  if (selectedGenreFilm)  apiUrl += `&with_genres=16,${selectedGenreFilm}`;
  if (selectedAnneeFilm) {
    const range = toDateRangeFromYearsMovies(selectedAnneeFilm);
    if (range) {
      apiUrl += `&primary_release_date.gte=${range.gte}&primary_release_date.lte=${range.lte}`;
    }
  }
  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur TMDB (films)"); return r.json(); })
    .then(d => d.results || [])
    .catch(e => { console.error(e); return []; });
}

/****
 * Charge plusieurs pages, trie FR A→Z/Z→A côté client et initialise la pagination.
 * @returns {Promise<void>}
 ****/
async function fetchAllThenSortAZZA() {
  clientPaging = true;
  cacheFilms = [];
  for (let p = 1; p <= MAX_PAGES_TO_LOAD; p++) {
    const batch = await fetchFilmsRaw(p);
    cacheFilms.push(...mapFilms(batch));
    if (batch.length < PAGE_SIZE_TMDB) break;
  }
  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheFilms.sort((a, b) => {
    if (sortOrderFilm === "za") return collator.compare(b.title || "", a.title || "");
    return collator.compare(a.title || "", b.title || "");
  });
  totalPagesFilm  = Math.max(1, Math.ceil(cacheFilms.length / PAGE_SIZE_TMDB));
  currentPageFilm = 1;
  renderClientPage();
}

/****
 * Rend une page locale (mode client) sans refetch et met à jour la pagination.
 * @returns {Promise<void>}
 ****/
async function renderClientPage() {
  const start = (currentPageFilm - 1) * PAGE_SIZE_TMDB;
  const pageItems = cacheFilms.slice(start, start + PAGE_SIZE_TMDB);
  const prevSort = sortOrderFilm;
  sortOrderFilm = "client";
  await displayFilms(pageItems);
  sortOrderFilm = prevSort;
  updatePaginationClient();
}

/* ---- Display films + click -> historique ---- */
/****
 * Affiche la grille films (enrichit titre/année) et branche l’ajout à l’historique.
 * @param {object[]} films
 * @returns {Promise<void>}
 ****/
async function displayFilms(films) {
  const containerFilms = document.getElementById("films");
  if (!containerFilms) return;

  lastFilmsPage = (films || []).slice();

  const detailsList = await Promise.all(
    lastFilmsPage.map(f => getMovieDetails(f.tmdbId).catch(() => null))
  );

  const enriched = lastFilmsPage.map((film, i) => {
    const d = detailsList[i];
    const base = film.title || "";
    const title = pickDisplayTitle(d, "movie", base);
    const year  = (d?.release_date || "").slice(0,4) || film.year || "";
    return { ...film, title, year, _details: d };
  });

  let sorted = enriched.slice();
  if (sortOrderFilm === "client") {
  } else if (sortOrderFilm === "az" || sortOrderFilm === "za") {
    const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
    sorted.sort((a, b) => {
      const res = collator.compare(a.title || "", b.title || "");
      return sortOrderFilm === "za" ? -res : res;
    });
  } else {
    sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  containerFilms.innerHTML = "";
  sorted.forEach(film => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.id = String(film.tmdbId || "");
    card.innerHTML = `
      <img src="${film.affiche}" alt="${film.title}">
      <div>
        <p>${film.title ?? ""}</p>
        <p>${film.year ?? ""}</p>
      </div>
    `;
    containerFilms.appendChild(card);
  });

  if (!containerFilms.__historyBound) {
    containerFilms.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const id = Number(card.dataset.id || 0);
      if (!id) return;

      const item = enriched.find(f => f.tmdbId === id) || lastFilmsPage.find(f => f.tmdbId === id);
      const d  = item?._details || await getMovieDetails(id).catch(()=>null);

      const title = pickDisplayTitle(d, "movie", item?.title || "");
      const year  = (d?.release_date || "").slice(0,4) || item?.year || "";
      const age   = certToBadge(pickCertification(d, "movie"));
      const duration = minutesToText(d?.runtime);
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(" • ");
      const poster_path   = d?.poster_path || "";
      const backdrop_path = d?.backdrop_path || "";

      const payload = { id, type: "movie", title, poster_path, backdrop_path, age, duration, year, genres };

      if (typeof pushHistory === "function") pushHistory(payload);
      else pushHistoryLocal(payload);

      if (typeof refreshHistoryCarousel === "function") refreshHistoryCarousel();
    });
    containerFilms.__historyBound = true;
  }
}

/* ---- UI Films ---- */
/****
 * Met à jour la pagination (mode serveur).
 ****/
function updatePaginationServer() {
  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");

  setPageLabelFilms();
  if (btnPrev) btnPrev.disabled = currentPageFilm <= 1;

  const noNext = (typeof totalPagesFilm === "number")
    ? (currentPageFilm >= totalPagesFilm)
    : (lastPageCountFilm < PAGE_SIZE_TMDB);

  if (btnNext) btnNext.disabled = !!noNext;
}

/****
 * Met à jour la pagination (mode client).
 ****/
function updatePaginationClient() {
  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");

  setPageLabelFilms();
  if (btnPrev) btnPrev.disabled = currentPageFilm <= 1;
  if (btnNext) btnNext.disabled = currentPageFilm >= totalPagesFilm;
}

/****
 * Met le label "Page X / Y".
 ****/
function setPageLabelFilms() {
  const lbl = document.getElementById("current-page-films");
  if (!lbl) return;
  if (typeof totalPagesFilm === "number" && totalPagesFilm > 0) {
    lbl.textContent = `Page ${currentPageFilm} / ${totalPagesFilm}`;
    lbl.setAttribute("aria-label", `Page ${currentPageFilm} sur ${totalPagesFilm}`);
  } else {
    lbl.textContent = `Page ${currentPageFilm}`;
    lbl.setAttribute("aria-label", `Page ${currentPageFilm}`);
  }
}

/****
 * Libellés de filtres films.
 ****/
function getOrderLabelFilms() { if (sortOrderFilm === "az") return "Ordre : A → Z"; if (sortOrderFilm === "za") return "Ordre : Z → A"; return "Popularité"; }
function getGenreLabelFilms() {
  const sel = document.getElementById("filter-genre");
  if (!sel || !selectedGenreFilm) return "";
  const opt = [...sel.options].find(o => o.value === String(selectedGenreFilm));
  return opt ? `Genre : ${opt.textContent.trim()}` : "Genre";
}
function getAnneeLabelFilms() {
  const sel = document.getElementById("filter-annees");
  if (!sel || !selectedAnneeFilm) return "";
  const opt = [...sel.options].find(o => o.value === String(selectedAnneeFilm));
  return opt ? `Années : ${opt.textContent.trim()}` : "Années";
}

/****
 * Échappe du HTML pour affichage.
 * @param {string} [s=""]
 * @returns {string}
 ****/
function escapeHtml(s="") {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/****
 * Rend les chips de filtres actifs (films).
 ****/
function renderActiveFiltersFilms() {
  const wrap = document.getElementById("active-filters-films");
  if (!wrap) return;
  wrap.innerHTML = "";

  const chips = [];
  if (selectedGenreFilm)  chips.push({ key: "genre",  label: getGenreLabelFilms() });
  if (selectedAnneeFilm)  chips.push({ key: "annees", label: getAnneeLabelFilms() });
  if (sortOrderFilm === "az" || sortOrderFilm === "za") chips.push({ key: "order",  label: getOrderLabelFilms() });
  if (chips.length === 0) return;

  for (const c of chips) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("data-key", c.key);
    btn.setAttribute("aria-label", `Supprimer le filtre ${c.label}`);
    btn.innerHTML = `${escapeHtml(c.label)} <span class="x" aria-hidden="true">×</span>`;
    wrap.appendChild(btn);
  }
}

/* ============================== SÉRIES ============================== */
/* ---- Etat séries ---- */
let selectedGenreSeries   = "";
let selectedAnneeSeries   = "";
let currentPageSeries     = 1;
let totalPagesSeries      = null;
const PAGE_SIZE_TMDB_S    = 20;
let lastPageCountSeries   = 0;
let sortOrderSeries       = "pop";
let lastSeriesPage        = [];
const MAX_PAGES_TO_LOAD_S = 5;
let clientPagingSeries    = false;
let cacheSeries           = [];

/* ---- Endpoints séries ---- */
const apiUrlBaseSeries =
  `${TMDB_BASE}/discover/tv?api_key=${API_KEY}` +
  `&with_genres=16&first_air_date.gte=${DATE_FROM_TV}&first_air_date.lte=${DATE_TO_TV}` +
  `&include_null_first_air_dates=false&language=fr-FR`;

/****
 * Convertit un intervalle "YYYY,YYYY" ou dates complètes en bornes TV.
 * @param {string} rangeStr
 * @returns {{gte:string,lte:string}|null}
 ****/
function toDateRangeFromYearsTV(rangeStr) {
  if (!rangeStr) return null;
  const [a, b] = rangeStr.split(",").map(s => s.trim());
  if (!a || !b) return null;
  const isFull = a.includes("-") && b.includes("-");
  return isFull ? { gte: a, lte: b } : { gte: `${a}-01-01`, lte: `${b}-12-31` };
}

/****
 * Normalise les résultats TMDB série pour l’UI.
 * @param {object[]} results
 * @returns {object[]}
 ****/
function mapSeries(results = []) {
  return results.map(serie => ({
    title: serie.name,
    year: serie.first_air_date ? serie.first_air_date.split("-")[0] : "Année inconnue",
    affiche: serie.poster_path
      ? `${IMG_BASE}/w500${serie.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible",
    popularity: serie.popularity ?? 0,
    tmdbId: serie.id
  }));
}

/****
 * Détails série (append content_ratings, translations).
 * @param {number} id
 * @returns {Promise<object|null>}
 ****/
async function getTvDetails(id) {
  try { return await api(`/tv/${id}`, { append_to_response: "content_ratings,translations" }); }
  catch { return null; }
}

/* ---- Fetch séries ---- */
/****
 * Charge une page de séries en appliquant les filtres et met à jour l’UI.
 * @param {number} [page=1]
 * @returns {Promise<void>}
 ****/
function fetchSeries(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;

  if (sortOrderSeries === "az") apiUrl += `&sort_by=original_name.asc`;
  if (sortOrderSeries === "za") apiUrl += `&sort_by=original_name.desc`;

  if (selectedGenreSeries) {
    apiUrl += `&with_genres=16,${selectedGenreSeries}`;
  }
  if (selectedAnneeSeries) {
    const range = toDateRangeFromYearsTV(selectedAnneeSeries);
    if (range) {
      apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
    }
  }

  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error("Erreur lors de la récupération des séries");
      return response.json();
    })
    .then(async data => {
      totalPagesSeries    = (typeof data.total_pages === "number") ? data.total_pages : null;
      currentPageSeries   = page;
      lastPageCountSeries = Array.isArray(data.results) ? data.results.length : 0;

      const seriesList = mapSeries(data.results || []);
      await displaySeries(seriesList);
      updatePaginationServerSeries();
    })
    .catch(error => {
      console.error("Erreur séries:", error);
      const container = document.getElementById("series");
      if (container) container.innerHTML = "<p>Erreur lors de la récupération des séries.</p>";
    });
}

/****
 * Version brute (results seulement) pour le mode client séries.
 * @param {number} [page=1]
 * @returns {Promise<object[]>}
 ****/
function fetchSeriesRaw(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;
  if (selectedGenreSeries) apiUrl += `&with_genres=16,${selectedGenreSeries}`;
  if (selectedAnneeSeries) {
    const range = toDateRangeFromYearsTV(selectedAnneeSeries);
    if (range) {
      apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
    }
  }
  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur TMDB raw séries"); return r.json(); })
    .then(d => d.results || [])
    .catch(e => { console.error(e); return []; });
}

/****
 * Charge plusieurs pages séries, trie FR A→Z/Z→A côté client et initialise la pagination.
 * @returns {Promise<void>}
 ****/
async function fetchAllThenSortSeries() {
  clientPagingSeries = true;
  cacheSeries = [];
  for (let p = 1; p <= MAX_PAGES_TO_LOAD_S; p++) {
    const batch = await fetchSeriesRaw(p);
    cacheSeries.push(...mapSeries(batch));
    if (batch.length < PAGE_SIZE_TMDB_S) break;
  }
  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheSeries.sort((a, b) => {
    if (sortOrderSeries === "za") return collator.compare(b.title || "", a.title || "");
    return collator.compare(a.title || "", b.title || "");
  });
  totalPagesSeries  = Math.max(1, Math.ceil(cacheSeries.length / PAGE_SIZE_TMDB_S));
  currentPageSeries = 1;
  renderClientPageSeries();
}

/****
 * Rend une page locale séries (mode client) et met à jour la pagination.
 * @returns {void}
 ****/
function renderClientPageSeries() {
  const start = (currentPageSeries - 1) * PAGE_SIZE_TMDB_S;
  const pageItems = cacheSeries.slice(start, start + PAGE_SIZE_TMDB_S);
  const prevSort = sortOrderSeries;
  sortOrderSeries = "client";
  displaySeries(pageItems);
  sortOrderSeries = prevSort;
  updatePaginationClientSeries();
}

/* ---- Display séries + click -> historique ---- */
/****
 * Affiche la grille séries (enrichit titre/année) et branche l’historique.
 * @param {object[]} series
 * @returns {Promise<void>}
 ****/
async function displaySeries(series) {
  const container = document.getElementById("series");
  if (!container) return;

  lastSeriesPage = (series || []).slice();

  const detailsList = await Promise.all(
    lastSeriesPage.map(s => getTvDetails(s.tmdbId).catch(() => null))
  );

  const enriched = lastSeriesPage.map((s, i) => {
    const d = detailsList[i];
    const base = s.title || "";
    const title = pickDisplayTitle(d, "tv", base);
    const year  = extractYearFromDetails("tv", d) || s.year || "";
    return { ...s, title, year, _details: d };
  });

  let sorted = enriched.slice();
  if (sortOrderSeries === "client") {
  } else if (sortOrderSeries === "az" || sortOrderSeries === "za") {
    const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
    sorted.sort((a, b) => {
      const res = collator.compare(a.title || "", b.title || "");
      return sortOrderSeries === "za" ? -res : res;
    });
  } else {
    sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  container.innerHTML = "";
  sorted.forEach(s => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.id = String(s.tmdbId || "");
    card.innerHTML = `
      <img src="${s.affiche}" alt="${s.title}">
      <div>
        <p>${s.title ?? ""}</p>
        <p>${s.year ?? ""}</p>
      </div>
    `;
    container.appendChild(card);
  });

  if (!container.__historyBound) {
    container.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const id = Number(card.dataset.id || 0);
      if (!id) return;

      const item = enriched.find(s => s.tmdbId === id) || lastSeriesPage.find(s => s.tmdbId === id);
      const d  = item?._details || await getTvDetails(id).catch(()=>null);

      const title = pickDisplayTitle(d, "tv", item?.title || "");
      const year  = extractYearFromDetails("tv", d) || item?.year || "";
      const age   = certToBadge(pickCertification(d, "tv"));
      const duration = (d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : "");
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(" • ");
      const poster_path   = d?.poster_path || "";
      const backdrop_path = d?.backdrop_path || "";

      const payload = { id, type: "tv", title, poster_path, backdrop_path, age, duration, year, genres };

      if (typeof pushHistory === "function") pushHistory(payload);
      else pushHistoryLocal(payload);

      if (typeof refreshHistoryCarousel === "function") refreshHistoryCarousel();
    });
    container.__historyBound = true;
  }
}

/* ---- UI Séries ---- */
/****
 * Met à jour la pagination (mode serveur) pour séries.
 ****/
function updatePaginationServerSeries() {
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  setPageLabelSeries();
  if (btnPrev) btnPrev.disabled = currentPageSeries <= 1;

  const noNext = (typeof totalPagesSeries === "number")
    ? (currentPageSeries >= totalPagesSeries)
    : (lastPageCountSeries < PAGE_SIZE_TMDB_S);

  if (btnNext) btnNext.disabled = !!noNext;
}

/****
 * Met à jour la pagination (mode client) pour séries.
 ****/
function updatePaginationClientSeries() {
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  setPageLabelSeries();
  if (btnPrev) btnPrev.disabled = currentPageSeries <= 1;
  if (btnNext) btnNext.disabled = currentPageSeries >= totalPagesSeries;
}

/****
 * Met le label "Page X / Y" séries.
 ****/
function setPageLabelSeries() {
  const lbl = document.getElementById("current-page");
  if (!lbl) return;
  if (typeof totalPagesSeries === "number" && totalPagesSeries > 0) {
    lbl.textContent = `Page ${currentPageSeries} / ${totalPagesSeries}`;
    lbl.setAttribute("aria-label", `Page ${currentPageSeries} sur ${totalPagesSeries}`);
  } else {
    lbl.textContent = `Page ${currentPageSeries}`;
    lbl.setAttribute("aria-label", `Page ${currentPageSeries}`);
  }
}

/****
 * Libellés de filtres séries.
 ****/
function getOrderLabelSeries() { if (sortOrderSeries === "az") return "Ordre : A → Z"; if (sortOrderSeries === "za") return "Ordre : Z → A"; return "Popularité"; }
function getGenreLabelSeries() {
  const sel = document.getElementById("filter-genre");
  if (!sel || !selectedGenreSeries) return "";
  const opt = [...sel.options].find(o => o.value === String(selectedGenreSeries));
  return opt ? `Genre : ${opt.textContent.trim()}` : "Genre";
}
function getAnneeLabelSeries() {
  const sel = document.getElementById("filter-annees");
  if (!sel || !selectedAnneeSeries) return "";
  const opt = [...sel.options].find(o => o.value === String(selectedAnneeSeries));
  return opt ? `Années : ${opt.textContent.trim()}` : "Années";
}

/****
 * Échappe du HTML pour affichage (séries).
 * @param {string} [s=""]
 * @returns {string}
 ****/
function escapeHtmlSeries(s="") {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/****
 * Rend les chips de filtres actifs (séries).
 ****/
function renderActiveFiltersSeries() {
  const wrap = document.getElementById("active-filters-series");
  if (!wrap) return;
  wrap.innerHTML = "";

  const chips = [];
  if (selectedGenreSeries)  chips.push({ key: "genre",  label: getGenreLabelSeries() });
  if (selectedAnneeSeries)  chips.push({ key: "annees", label: getAnneeLabelSeries() });
  if (sortOrderSeries === "az" || sortOrderSeries === "za") chips.push({ key: "order",  label: getOrderLabelSeries() });
  if (chips.length === 0) return;

  for (const c of chips) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("data-key", c.key);
    btn.setAttribute("aria-label", `Supprimer le filtre ${c.label}`);
    btn.innerHTML = `${escapeHtmlSeries(c.label)} <span class="x" aria-hidden="true">×</span>`;
    wrap.appendChild(btn);
  }
}

/* ======================= INIT DOM + Listeners GLOBAUX ======================= */
/****
 * Branche tous les listeners Films/Séries et lance les chargements initiaux.
 ****/
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- FILMS ---------- */
  const btnFilterAllFilms    = document.getElementById("filter-all-films");
  const selFilterGenreFilms  = document.getElementById("filter-genre-films") || document.getElementById("filter-genre");
  const selFilterAnneesFilms = document.getElementById("filter-annees-films") || document.getElementById("filter-annees");
  const selOrderFilms        = document.getElementById("filter-order-films") || document.getElementById("filter-order");

  btnFilterAllFilms?.addEventListener("click", (e) => {
    e.preventDefault();
    selectedGenreFilm = "";
    selectedAnneeFilm = "";
    currentPageFilm   = 1;
    totalPagesFilm    = null;
    lastPageCountFilm = 0;
    cacheFilms        = [];
    if (selFilterGenreFilms)  selFilterGenreFilms.value = "";
    if (selFilterAnneesFilms) selFilterAnneesFilms.value = "";
    if (selOrderFilms)        selOrderFilms.value = "pop";
    fetchFilms(currentPageFilm);
    renderActiveFiltersFilms();
  });

  selFilterGenreFilms?.addEventListener("change", (event) => {
    selectedGenreFilm = event.target.value || "";
    currentPageFilm   = 1;
    totalPagesFilm    = null;
    if (sortOrderFilm === "az" || sortOrderFilm === "za") {
      clientPaging = true;
      fetchAllThenSortAZZA().then(renderActiveFiltersFilms);
    } else {
      clientPaging = false;
      fetchFilms(currentPageFilm).then(renderActiveFiltersFilms);
    }
  });

  selFilterAnneesFilms?.addEventListener("change", (event) => {
    selectedAnneeFilm = event.target.value || "";
    currentPageFilm   = 1;
    totalPagesFilm    = null;
    if (sortOrderFilm === "az" || sortOrderFilm === "za") {
      clientPaging = true;
      fetchAllThenSortAZZA().then(renderActiveFiltersFilms);
    } else {
      clientPaging = false;
      fetchFilms(currentPageFilm).then(renderActiveFiltersFilms);
    }
  });

  if (selOrderFilms) selOrderFilms.value = sortOrderFilm;
  selOrderFilms?.addEventListener("change", async (e) => {
    const value = e.target.value;
    sortOrderFilm     = value;
    currentPageFilm   = 1;
    totalPagesFilm    = null;
    lastPageCountFilm = 0;
    cacheFilms        = [];

    if (value === "az" || value === "za") {
      clientPaging = true;
      await fetchAllThenSortAZZA();
    } else {
      clientPaging = false;
      await fetchFilms(currentPageFilm);
    }
    renderActiveFiltersFilms();
  });

  const btnPrevFilms = document.getElementById("prev-page-films");
  const btnNextFilms = document.getElementById("next-page-films");
  btnPrevFilms?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPaging) {
      if (currentPageFilm > 1) {
        currentPageFilm--;
        renderClientPage();
      }
    } else {
      if (currentPageFilm > 1) fetchFilms(currentPageFilm - 1);
    }
  });
  btnNextFilms?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPaging) {
      if (currentPageFilm < totalPagesFilm) {
        currentPageFilm++;
        renderClientPage();
      }
    } else {
      const canGoNext = (typeof totalPagesFilm === "number")
        ? (currentPageFilm < totalPagesFilm)
        : true;
      if (canGoNext) fetchFilms(currentPageFilm + 1);
    }
  });

/* === Séries : filtres, tri et pagination === */
  const selFilterGenreTV  = document.getElementById("filter-genre-series")  || document.getElementById("filter-genre");
  const selFilterAnneesTV = document.getElementById("filter-annees-series") || document.getElementById("filter-annees");
  const selOrderTV        = document.getElementById("filter-order-series")  || document.getElementById("filter-order");

  selFilterGenreTV?.addEventListener("change", (event) => {
    selectedGenreSeries = event.target.value || "";
    refetchAfterFilterChangeSeries();
  });
  selFilterAnneesTV?.addEventListener("change", (event) => {
    selectedAnneeSeries = event.target.value || "";
    refetchAfterFilterChangeSeries();
  });

  if (selOrderTV) selOrderTV.value = sortOrderSeries;
  selOrderTV?.addEventListener("change", async (e) => {
    const value = e.target.value;
    sortOrderSeries     = value;
    currentPageSeries   = 1;
    totalPagesSeries    = null;
    lastPageCountSeries = 0;
    cacheSeries         = [];

    if (value === "az" || value === "za") {
      clientPagingSeries = true;
      await fetchAllThenSortSeries();
    } else {
      clientPagingSeries = false;
      await fetchSeries(currentPageSeries);
    }
    renderActiveFiltersSeries();
  });

  const btnPrevTV = document.getElementById("prev-page");
  const btnNextTV = document.getElementById("next-page");
  btnPrevTV?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries > 1) {
        currentPageSeries--;
        renderClientPageSeries();
      }
    } else {
      if (currentPageSeries > 1) fetchSeries(currentPageSeries - 1);
    }
  });
  btnNextTV?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries < totalPagesSeries) {
        currentPageSeries++;
        renderClientPageSeries();
      }
    } else {
      const canGoNext = (typeof totalPagesSeries === "number")
        ? (currentPageSeries < totalPagesSeries)
        : true;
      if (canGoNext) fetchSeries(currentPageSeries + 1);
    }
  });

  /* =========== LANCEMENTS ============ */
  fetchFilms(currentPageFilm);
  fetchSeries(currentPageSeries);
});

/* ===================== Rechargements (helpers séries) ===================== */
/****
 * Recharge les séries après changement de filtre/tri, en basculant entre tri client/serveur.
 * @returns {void}
 ****/
function refetchAfterFilterChangeSeries() {
  currentPageSeries   = 1;
  totalPagesSeries    = null;
  lastPageCountSeries = 0;
  cacheSeries         = [];

  if (sortOrderSeries === "az" || sortOrderSeries === "za") {
    clientPagingSeries = true;
    fetchAllThenSortSeries().then(renderActiveFiltersSeries);
  } else {
    clientPagingSeries = false;
    fetchSeries(currentPageSeries).then(renderActiveFiltersSeries);
  }
}
