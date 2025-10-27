const API_KEY = "abedd43cf8d6083e8a33eafb9cc8b3f4";

// ==========================
// Variables filtres & pagination (serveur)
// ==========================
let selectedGenreFilm = "";    // Genre secondaire sélectionné
let selectedAnneeFilm = "";    // Plage d'années sélectionnée ("1970,2010")
let currentPageFilm   = 1;     // Page actuelle (affichée)
let totalPagesFilm    = null;  // Nombre total de pages (serveur) inconnu
const PAGE_SIZE_TMDB  = 20;    // Taille page standard TMDB
let lastPageCountFilm = 0;     // Nombre de films de la dernière page
let sortOrderFilm     = "pop"; // 'pop' | 'az' | 'za' | 'client'
let lastFilmsPage     = [];    // dernière liste affichée (pour re-render rapide)

// ==========================
// Variables du mode client (tri global local)
// ==========================
const MAX_PAGES_TO_LOAD = 5;
let clientPaging = false;
let cacheFilms   = [];

// ==========================
// API base
// ==========================
const apiUrlBaseFilms = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=16&primary_release_date.gte=1970-01-01&primary_release_date.lte=2010-12-31&language=fr-FR&include_adult=false`;

// ==========================
// Helpers
// ==========================
const TMDB_BASE_FILM = 'https://api.themoviedb.org/3';
const JAPANESE_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

function scrollToTopSmooth() {
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  catch { window.scrollTo(0, 0); }
}

function tmdbUrlFilm(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: 'fr-FR', ...params });
  return `${TMDB_BASE_FILM}${path}?${p.toString()}`;
}

async function apiFilm(path, params) {
  const res = await fetch(tmdbUrlFilm(path, params));
  if (!res.ok) throw new Error(`TMDB ${res.status} @ ${path}`);
  return res.json();
}

function pickDisplayTitleFromDetails(details, fallback='') {
  const translations = details?.translations?.translations || [];
  const fr = translations.find(t => t.iso_639_1 === 'fr');
  const en = translations.find(t => t.iso_639_1 === 'en');
  const frTitle = fr?.data?.title;
  const enTitle = en?.data?.title;

  if (frTitle && frTitle.trim()) return frTitle.trim();
  const base = (fallback || '').trim();
  if (JAPANESE_RE.test(base) && enTitle && enTitle.trim()) return enTitle.trim();
  return base;
}

async function fetchBestTitleForMovie(movieId, fallback='') {
  try {
    const d = await apiFilm(`/movie/${movieId}`, { append_to_response: 'translations' });
    return pickDisplayTitleFromDetails(d, fallback);
  } catch {
    return fallback || '';
  }
}

async function enrichTitles(films = []) {
  const out = await Promise.all(films.map(async f => {
    if (JAPANESE_RE.test(f.title || '')) {
      const best = await fetchBestTitleForMovie(f.tmdbId, f.title);
      return { ...f, title: best };
    }
    return f;
  }));
  return out;
}

function toDateRangeFromYears(rangeStr) {
  if (!rangeStr) return null;
  const [startYear, endYear] = rangeStr.split(",").map(s => s.trim());
  if (!startYear || !endYear) return null;
  return { gte: `${startYear}-01-01`, lte: `${endYear}-12-31` };
}

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

// ==========================
// Fetch côté serveur
// ==========================
function fetchFilms(page = 1) {
  let apiUrl = `${apiUrlBaseFilms}&page=${page}`;
  if (sortOrderFilm === "az")  apiUrl += `&sort_by=original_title.asc`;
  if (sortOrderFilm === "za")  apiUrl += `&sort_by=original_title.desc`;
  if (selectedGenreFilm) apiUrl += `&with_genres=16,${selectedGenreFilm}`;
  if (selectedAnneeFilm) {
    const range = toDateRangeFromYears(selectedAnneeFilm);
    if (range) apiUrl += `&primary_release_date.gte=${range.gte}&primary_release_date.lte=${range.lte}`;
  }

  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur lors de la récupération"); return r.json(); })
    .then(async data => {
      totalPagesFilm    = data.total_pages ?? null;
      currentPageFilm   = page;
      lastPageCountFilm = (data.results || []).length;
      const filmsList = mapFilms(data.results || []);
      const withTitles = await enrichTitles(filmsList);
      displayFilms(withTitles);
      scrollToTopSmooth();
      updatePaginationServer();
    })
    .catch(e => {
      console.error("Erreur films:", e);
      const c = document.getElementById("films");
      if (c) c.innerHTML = "<p>Erreur lors de la récupération des films.</p>";
    });
}

function fetchFilmsRaw(page = 1) {
  let apiUrl = `${apiUrlBaseFilms}&page=${page}`;
  if (selectedGenreFilm) apiUrl += `&with_genres=16,${selectedGenreFilm}`;
  if (selectedAnneeFilm) {
    const range = toDateRangeFromYears(selectedAnneeFilm);
    if (range) apiUrl += `&primary_release_date.gte=${range.gte}&primary_release_date.lte=${range.lte}`;
  }
  return fetch(apiUrl).then(r => r.json()).then(d => d.results || []).catch(() => []);
}

// ==========================
// Mode client : tri local
// ==========================
async function fetchAllThenSortAZZA() {
  clientPaging = true;
  cacheFilms = [];
  for (let p = 1; p <= MAX_PAGES_TO_LOAD; p++) {
    const batch = await fetchFilmsRaw(p);
    cacheFilms.push(...mapFilms(batch));
    if (batch.length < PAGE_SIZE_TMDB) break;
  }
  cacheFilms = await enrichTitles(cacheFilms);
  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheFilms.sort((a, b) => sortOrderFilm === "za"
    ? collator.compare(b.title || "", a.title || "")
    : collator.compare(a.title || "", b.title || ""));
  totalPagesFilm = Math.max(1, Math.ceil(cacheFilms.length / PAGE_SIZE_TMDB));
  currentPageFilm = 1;
  renderClientPage();
}

function renderClientPage() {
  const start = (currentPageFilm - 1) * PAGE_SIZE_TMDB;
  const pageItems = cacheFilms.slice(start, start + PAGE_SIZE_TMDB);
  const prevSort = sortOrderFilm;
  sortOrderFilm = "client";
  displayFilms(pageItems);
  sortOrderFilm = prevSort;
  updatePaginationClient();
  scrollToTopSmooth();
}

// ==========================
// Display
// ==========================
function displayFilms(films) {
  const c = document.getElementById("films");
  if (!c) return;
  lastFilmsPage = films.slice();
  let sorted = lastFilmsPage.slice();
  if (sortOrderFilm === "az" || sortOrderFilm === "za") {
    const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
    sorted.sort((a, b) => {
      const res = collator.compare(a.title || "", b.title || "");
      return sortOrderFilm === "za" ? -res : res;
    });
  } else if (sortOrderFilm !== "client") {
    sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
  c.innerHTML = "";
  sorted.forEach(film => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${film.affiche}" alt="${film.title}">
      <div>
        <p>${film.title ?? ""}</p>
        <p>${film.year ?? ""}</p>
      </div>
    `;
    c.appendChild(card);
  });
}

// ==========================
// Pagination UI
// ==========================
function updatePaginationServer() {
  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");
  setPageLabelFilms();
  if (btnPrev) btnPrev.disabled = currentPageFilm <= 1;
  if (btnNext) btnNext.disabled = (typeof totalPagesFilm === "number")
    ? (currentPageFilm >= totalPagesFilm)
    : (lastPageCountFilm < PAGE_SIZE_TMDB);
}

function updatePaginationClient() {
  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");
  setPageLabelFilms();
  if (btnPrev) btnPrev.disabled = currentPageFilm <= 1;
  if (btnNext) btnNext.disabled = currentPageFilm >= totalPagesFilm;
}

function setPageLabelFilms() {
  const lbl = document.getElementById("current-page-films");
  if (!lbl) return;
  if (typeof totalPagesFilm === "number" && totalPagesFilm > 0) {
    lbl.textContent = `Page ${currentPageFilm} / ${totalPagesFilm}`;
  } else {
    lbl.textContent = `Page ${currentPageFilm}`;
  }
}

// ==========================
// Réinitialisation & Events
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const selOrder = document.getElementById('filter-order');
  if (selOrder) selOrder.value = sortOrderFilm;

  selOrder?.addEventListener('change', async (e) => {
    const value = e.target.value;
    sortOrderFilm = value;
    currentPageFilm = 1; totalPagesFilm = null; lastPageCountFilm = 0; cacheFilms = [];
    if (value === 'az' || value === 'za') {
      clientPaging = true; await fetchAllThenSortAZZA();
    } else {
      clientPaging = false; await fetchFilms(currentPageFilm);
    }
  });

  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");

  btnPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPaging) {
      if (currentPageFilm > 1) { currentPageFilm--; renderClientPage(); }
    } else if (currentPageFilm > 1) fetchFilms(currentPageFilm - 1);
  });

  btnNext?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPaging) {
      if (currentPageFilm < totalPagesFilm) { currentPageFilm++; renderClientPage(); }
    } else {
      if (!totalPagesFilm || currentPageFilm < totalPagesFilm) fetchFilms(currentPageFilm + 1);
    }
  });

  fetchFilms(currentPageFilm);
});
