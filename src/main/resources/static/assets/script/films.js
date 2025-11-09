/* ============================== CONFIG ============================== */
const API_KEY          = "abedd43cf8d6083e8a33eafb9cc8b3f4";
const TMDB_BASE        = "https://api.themoviedb.org/3";
const IMG_BASE         = "https://image.tmdb.org/t/p";

/* ========================== Filtres & pagination ========================== */
let selectedGenreFilm = "";
let selectedAnneeFilm = "";
let currentPageFilm   = 1;
let totalPagesFilm    = null;
const PAGE_SIZE_TMDB  = 20;
let lastPageCountFilm = 0;
let sortOrderFilm     = "pop";
let lastFilmsPage     = [];

/* ===================== Mode client (tri global local) ===================== */
const MAX_PAGES_TO_LOAD = 5;
let clientPaging = false;
let cacheFilms   = [];

/* ============================== UTILITAIRES =============================== */
/****
 * Construit une URL TMDB avec la clé & la langue FR
 * @param {string} path - Chemin d'endpoint (ex: /discover/movie)
 * @param {object} [params={}] - Paramètres query additionnels
 * @returns {string} URL complète prête pour fetch
 ****/
function tmdbUrl(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: "fr-FR", ...params });
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
  if (!m || m <= 0) return "";
  const h = Math.floor(m / 60), min = m % 60;
  return h ? `${h}h${String(min).padStart(2,"0")}` : `${min}m`;
}

/****
 * Normalise une certification en badge d’âge (ex: "PG-13" -> "13+")
 * @param {string} cert - Certification brute
 * @returns {string} Badge (Tous, 10+, 12+, 16+, 18+, NR, etc.)
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
 * Récupère la certification FR/US depuis les détails d’un film
 * (utilise release_dates -> results)
 * @param {object} details - Détails TMDB avec release_dates
 * @returns {string} Certification brute ou ""
 ****/
function pickCertification(details) {
  const arr = details?.release_dates?.results || [];
  const take = (cc) => arr.find(r=>r.iso_3166_1===cc)?.release_dates?.find(d=>d.certification?.trim())?.certification;
  return take("FR") || take("US") || "";
}

/****
 * Choisit la meilleure image selon l’orientation (poster/backdrop)
 * @param {object} item - Élément TMDB (poster_path/backdrop_path)
 * @param {'portrait'|'landscape'} layout - Orientation voulue
 * @returns {string} URL d’image ou ""
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

/* ---------- Détection & choix du meilleur titre à afficher ---------- */
const JAPANESE_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/****
 * Sélectionne le meilleur titre (FR > EN > fallback, EN si fallback JP)
 * @param {object} details - Détails TMDB avec translations
 * @param {'movie'|'tv'} type - Type de contenu
 * @param {string} [fallback=""] - Titre de secours
 * @returns {string} Titre affichable
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
 * Extrait l’année depuis les détails (sortie/première diffusion)
 * @param {'movie'|'tv'} type - Type de contenu
 * @param {object} details - Détails TMDB
 * @returns {string} Année (YYYY) ou ""
 ****/
function extractYearFromDetails(type, details){
  const dateStr = type === "movie"
    ? (details?.release_date || details?.primary_release_date || "")
    : (details?.first_air_date || details?.air_date || "");
  return dateStr ? dateStr.slice(0,4) : "";
}

/* =============================== TMDB (DATA) ============================== */
const DATE_FROM = "1970-01-01";
const DATE_TO   = "2010-12-31";

const apiUrlBaseFilms =
  `${TMDB_BASE}/discover/movie?api_key=${API_KEY}` +
  `&with_genres=16&primary_release_date.gte=${DATE_FROM}&primary_release_date.lte=${DATE_TO}` +
  `&language=fr-FR&include_adult=false`;

/****
 * Transforme un intervalle "YYYY,YYYY" en bornes de dates complètes
 * @param {string} rangeStr - Exemple: "1970,2010"
 * @returns {{gte:string,lte:string}|null} Bornes ou null si invalide
 ****/
function toDateRangeFromYears(rangeStr) {
  if (!rangeStr) return null;
  const [startYear, endYear] = rangeStr.split(",").map(s => s.trim());
  if (!startYear || !endYear) return null;
  return { gte: `${startYear}-01-01`, lte: `${endYear}-12-31` };
}

/****
 * Map TMDB results -> objets film pour l’UI
 * @param {object[]} results - data.results
 * @returns {object[]} Films normalisés (title, year, affiche, popularity, tmdbId)
 ****/
function mapFilms(results = []) {
  return results.map(film => ({
    title: film.title,
    year: film.release_date ? film.release_date.split("-")[0] : "Année inconnue",
    affiche: film.poster_path
      ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible",
    popularity: film.popularity ?? 0,
    tmdbId: film.id
  }));
}

/****
 * Récupère les détails d’un film (append: release_dates, translations)
 * @param {number} id - TMDB movie id
 * @returns {Promise<object|null>} Détails ou null si erreur
 ****/
async function getMovieDetails(id) {
  try { return await api(`/movie/${id}`, { append_to_response: "release_dates,translations" }); }
  catch { return null; }
}

/* ========================== Fetch côté serveur =========================== */
/****
 * Fetch des films côté serveur (tri/popularité côté API)
 * Applique les filtres (genre, années) et met à jour la pagination
 * @param {number} [page=1] - Page TMDB à charger
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
    const range = toDateRangeFromYears(selectedAnneeFilm);
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
      console.error("Erreur lors de la récupération des films:", error);
      const containerFilms = document.getElementById("films");
      if (containerFilms) containerFilms.innerHTML = "<p>Erreur lors de la récupération des films.</p>";
    });
}

/****
 * Version brute: renvoie directement data.results (pour le mode client)
 * @param {number} [page=1]
 * @returns {Promise<object[]>} Tableau de résultats TMDB (ou [])
 ****/
function fetchFilmsRaw(page = 1) {
  let apiUrl = `${apiUrlBaseFilms}&page=${page}`;

  if (selectedGenreFilm)  apiUrl += `&with_genres=16,${selectedGenreFilm}`;

  if (selectedAnneeFilm) {
    const range = toDateRangeFromYears(selectedAnneeFilm);
    if (range) {
      apiUrl += `&primary_release_date.gte=${range.gte}&primary_release_date.lte=${range.lte}`;
    }
  }

  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur TMDB"); return r.json(); })
    .then(d => d.results || [])
    .catch(e => { console.error(e); return []; });
}

/* ===== Mode client : charger plusieurs pages, trier FR, paginer localement ==== */
/****
 * Charge plusieurs pages côté client, trie A→Z/Z→A en FR, initialise la pagination locale
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
 * Rend une page côté client (sans refetch), en conservant le tri appliqué
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

/* =============================== DISPLAY =============================== */
const HISTORY_KEY = "vod_history";

/****
 * Ajoute un élément dans l’historique (localStorage) en tête (max 30)
 * @param {object} item - { id, type, title, ... }
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

/****
 * Affiche la grille de films (enrichit titres/années) + bind clic historique
 * @param {object[]} films - Liste de films normalisés (mapFilms)
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
      const age   = certToBadge(pickCertification(d));
      const duration = minutesToText(d?.runtime);
      const genres = (d?.genres || []).map(g => g.name).slice(0,3).join(" • ");

      const poster_path   = d?.poster_path || "";
      const backdrop_path = d?.backdrop_path || "";

      const payload = {
        id, type: "movie",
        title, poster_path, backdrop_path,
        age, duration, year, genres
      };

      if (typeof pushHistory === "function") pushHistory(payload);
      else pushHistoryLocal(payload);

      if (typeof refreshHistoryCarousel === "function") {
        refreshHistoryCarousel();
      }
    });
    containerFilms.__historyBound = true;
  }
}

/* ============================ Pagination UI ============================ */
/****
 * Met à jour l’UI de pagination (mode serveur)
 ****/
function updatePaginationServer() {
  const lblPage = document.getElementById("current-page-films");
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
 * Met à jour l’UI de pagination (mode client)
 ****/
function updatePaginationClient() {
  const lblPage = document.getElementById("current-page-films");
  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");

  setPageLabelFilms();
  if (btnPrev) btnPrev.disabled = currentPageFilm <= 1;
  if (btnNext) btnNext.disabled = currentPageFilm >= totalPagesFilm;
}

/* =================== Rechargement après changement de filtre =================== */
/****
 * (Re)charge les films après modification d’un filtre
 * Bascule en tri client pour A→Z/Z→A, sinon serveur (popularité)
 ****/
function refetchAfterFilterChange() {
  currentPageFilm   = 1;
  totalPagesFilm    = null;
  lastPageCountFilm = 0;
  cacheFilms        = [];

  if (sortOrderFilm === "az" || sortOrderFilm === "za") {
    clientPaging = true;
    fetchAllThenSortAZZA().then(renderActiveFilters);
  } else {
    clientPaging = false;
    fetchFilms(currentPageFilm).then(renderActiveFilters);
  }
}

/* --------------------- helpers affichage libellés --------------------- */
/****
 * Libellé de tri courant
 * @returns {string}
 ****/
function getOrderLabel() {
  if (sortOrderFilm === "az") return "Ordre : A → Z";
  if (sortOrderFilm === "za") return "Ordre : Z → A";
  return "Popularité";
}

/****
 * Libellé du genre sélectionné
 * @returns {string}
 ****/
function getGenreLabel() {
  const sel = document.getElementById("filter-genre");
  if (!sel || !selectedGenreFilm) return "";
  const opt = [...sel.options].find(o => o.value === String(selectedGenreFilm));
  return opt ? `Genre : ${opt.textContent.trim()}` : "Genre";
}

/****
 * Libellé de l’intervalle d’années sélectionné
 * @returns {string}
 ****/
function getAnneeLabel() {
  const sel = document.getElementById("filter-annees");
  if (!sel || !selectedAnneeFilm) return "";
  const opt = [...sel.options].find(o => o.value === String(selectedAnneeFilm));
  return opt ? `Années : ${opt.textContent.trim()}` : "Années";
}

/****
 * Met à jour le label "Page X / Y"
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
 * Échappe les caractères HTML pour du texte injecté
 * @param {string} [s=""]
 * @returns {string}
 ****/
function escapeHtml(s="") {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* -------------------------- rendu de l’historique -------------------------- */
/****
 * Rend les chips de filtres actifs (genre/années/ordre)
 ****/
function renderActiveFilters() {
  const wrap = document.getElementById("active-filters");
  if (!wrap) return;
  wrap.innerHTML = "";

  const chips = [];

  if (selectedGenreFilm)  chips.push({ key: "genre",  label: getGenreLabel() });
  if (selectedAnneeFilm)  chips.push({ key: "annees", label: getAnneeLabel() });
  if (sortOrderFilm === "az" || sortOrderFilm === "za") {
    chips.push({ key: "order",  label: getOrderLabel() });
  }

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

/* --- retirer un filtre en cliquant sur la “x” --- */
document.addEventListener("click", (e) => {
  const chip = e.target.closest("#active-filters .chip");
  if (!chip) return;
  const key = chip.getAttribute("data-key");

  if (key === "genre") {
    selectedGenreFilm = "";
    const sel = document.getElementById("filter-genre");
    if (sel) sel.value = "";
  } else if (key === "annees") {
    selectedAnneeFilm = "";
    const sel = document.getElementById("filter-annees");
    if (sel) sel.value = "";
  } else if (key === "order") {
    sortOrderFilm = "pop";
    const selOrder = document.getElementById("filter-order");
    if (selOrder) selOrder.value = "pop";
    clientPaging = false;
  }

  refetchAfterFilterChange();
  renderActiveFilters();
});

/* --- bouton Réinitialiser --- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#filters-reset");
  if (!btn) return;

  selectedGenreFilm = "";
  selectedAnneeFilm = "";
  sortOrderFilm     = "pop";
  clientPaging      = false;

  const selG = document.getElementById("filter-genre");
  const selA = document.getElementById("filter-annees");
  const selO = document.getElementById("filter-order");
  if (selG) selG.value = "";
  if (selA) selA.value = "";
  if (selO) selO.value = "pop";

  currentPageFilm   = 1;
  totalPagesFilm    = null;
  lastPageCountFilm = 0;
  cacheFilms        = [];
  fetchFilms(currentPageFilm);

  renderActiveFilters();
});

/* ======================= INIT DOM + Listeners ======================= */
/****
 * Point d’entrée: branche les filtres, le tri, la pagination, et charge la liste
 ****/
document.addEventListener("DOMContentLoaded", () => {
  const btnFilterAll    = document.getElementById("filter-all");
  const selFilterGenre  = document.getElementById("filter-genre");
  const selFilterAnnees = document.getElementById("filter-annees");

  btnFilterAll?.addEventListener("click", (e) => {
    e.preventDefault();
    selectedGenreFilm = "";
    selectedAnneeFilm = "";
    refetchAfterFilterChange();
  });

  selFilterGenre?.addEventListener("change", (event) => {
    selectedGenreFilm = event.target.value || "";
    refetchAfterFilterChange();
  });

  selFilterAnnees?.addEventListener("change", (event) => {
    selectedAnneeFilm = event.target.value || "";
    refetchAfterFilterChange();
  });

  const selOrder = document.getElementById("filter-order");
  if (selOrder) selOrder.value = sortOrderFilm;

  selOrder?.addEventListener("change", async (e) => {
    const value = e.target.value;
    sortOrderFilm    = value;
    currentPageFilm  = 1;
    totalPagesFilm   = null;
    lastPageCountFilm= 0;
    cacheFilms       = [];

    if (value === "az" || value === "za") {
      clientPaging = true;
      await fetchAllThenSortAZZA();
    } else {
      clientPaging = false;
      await fetchFilms(currentPageFilm);
    }
    renderActiveFilters();
  });

  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");

  btnPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPaging) {
      if (currentPageFilm > 1) {
        currentPageFilm--;
        renderClientPage();
      }
    } else {
      if (currentPageFilm > 1) {
        fetchFilms(currentPageFilm - 1);
      }
    }
  });

  btnNext?.addEventListener("click", (e) => {
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
      if (canGoNext) {
        fetchFilms(currentPageFilm + 1);
      }
    }
  });

  fetchFilms(currentPageFilm);
});

