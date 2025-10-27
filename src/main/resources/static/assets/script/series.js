const API_KEY = "abedd43cf8d6083e8a33eafb9cc8b3f4";

// ==========================
// Variables filtres & pagination (serveur)
// ==========================
let selectedGenreSeries = "";
let selectedAnneeSeries = "";
let currentPageSeries   = 1;
let totalPagesSeries    = null;
const PAGE_SIZE_TMDB_S  = 20;
let lastPageCountSeries = 0;
let sortOrderSeries     = "pop"; // 'pop' | 'az' | 'za' | 'client'
let lastSeriesPage      = [];

// ==========================
// Variables du mode client (tri global local)
// ==========================
const MAX_PAGES_TO_LOAD_S = 5;
let clientPagingSeries = false;
let cacheSeries        = [];

// ==========================
// API base (TV)
// ==========================
const apiUrlBaseSeries = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&first_air_date.gte=1970-01-01&first_air_date.lte=2010-12-31&include_null_first_air_dates=false&language=fr-FR`;

// ==========================
// Helpers
// ==========================
const TMDB_BASE_SERIES = 'https://api.themoviedb.org/3';
const JAPANESE_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

function scrollToTopSmooth() {
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  catch { window.scrollTo(0, 0); }
}

function tmdbUrlSeries(path, params = {}) {
  const p = new URLSearchParams({ api_key: API_KEY, language: 'fr-FR', ...params });
  return `${TMDB_BASE_SERIES}${path}?${p.toString()}`;
}

async function apiSeries(path, params) {
  const res = await fetch(tmdbUrlSeries(path, params));
  if (!res.ok) throw new Error(`TMDB ${res.status} @ ${path}`);
  return res.json();
}

function pickDisplayTitleFromDetails(details, fallback='') {
  const translations = details?.translations?.translations || [];
  const fr = translations.find(t => t.iso_639_1 === 'fr');
  const en = translations.find(t => t.iso_639_1 === 'en');
  const frTitle = fr?.data?.name;
  const enTitle = en?.data?.name;

  if (frTitle && frTitle.trim()) return frTitle.trim();
  const base = (fallback || '').trim();
  if (JAPANESE_RE.test(base) && enTitle && enTitle.trim()) return enTitle.trim();
  return base;
}

async function fetchBestTitleForSeries(serieId, fallback='') {
  try {
    const d = await apiSeries(`/tv/${serieId}`, { append_to_response: 'translations' });
    return pickDisplayTitleFromDetails(d, fallback);
  } catch {
    return fallback || '';
  }
}

async function enrichTitlesSeries(series = []) {
  const out = await Promise.all(series.map(async s => {
    if (JAPANESE_RE.test(s.title || '')) {
      const best = await fetchBestTitleForSeries(s.tmdbId, s.title);
      return { ...s, title: best };
    }
    return s;
  }));
  return out;
}

function toDateRangeFromYears(rangeStr) {
  if (!rangeStr) return null;
  const [a, b] = rangeStr.split(",").map(s => s.trim());
  if (!a || !b) return null;
  const isFull = a.includes("-") && b.includes("-");
  return isFull ? { gte: a, lte: b } : { gte: `${a}-01-01`, lte: `${b}-12-31` };
}

function mapSeries(results = []) {
  return results.map(serie => ({
    title: serie.name,
    year: serie.first_air_date ? serie.first_air_date.split("-")[0] : "Année inconnue",
    affiche: serie.poster_path
      ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible",
    popularity: serie.popularity ?? 0,
    tmdbId: serie.id
  }));
}

// ==========================
// Fetch côté serveur
// ==========================
function fetchSeries(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;
  if (sortOrderSeries === "az") apiUrl += `&sort_by=original_name.asc`;
  if (sortOrderSeries === "za") apiUrl += `&sort_by=original_name.desc`;
  if (selectedGenreSeries) apiUrl += `&with_genres=16,${selectedGenreSeries}`;
  if (selectedAnneeSeries) {
    const range = toDateRangeFromYears(selectedAnneeSeries);
    if (range) apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
  }

  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur TMDB séries"); return r.json(); })
    .then(async data => {
      totalPagesSeries    = data.total_pages ?? null;
      currentPageSeries   = page;
      lastPageCountSeries = (data.results || []).length;
      const seriesList = mapSeries(data.results || []);
      const withTitles = await enrichTitlesSeries(seriesList);
      displaySeries(withTitles);
      scrollToTopSmooth();
      updatePaginationServerSeries();
    })
    .catch(e => {
      console.error("Erreur séries:", e);
      const container = document.getElementById("series");
      if (container) container.innerHTML = "<p>Erreur lors de la récupération des séries.</p>";
    });
}

function fetchSeriesRaw(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;
  if (selectedGenreSeries) apiUrl += `&with_genres=16,${selectedGenreSeries}`;
  if (selectedAnneeSeries) {
    const range = toDateRangeFromYears(selectedAnneeSeries);
    if (range) apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
  }
  return fetch(apiUrl).then(r => r.json()).then(d => d.results || []).catch(() => []);
}

// ==========================
// Mode client
// ==========================
async function fetchAllThenSortSeries() {
  clientPagingSeries = true;
  cacheSeries = [];
  for (let p = 1; p <= MAX_PAGES_TO_LOAD_S; p++) {
    const batch = await fetchSeriesRaw(p);
    cacheSeries.push(...mapSeries(batch));
    if (batch.length < PAGE_SIZE_TMDB_S) break;
  }
  cacheSeries = await enrichTitlesSeries(cacheSeries);
  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheSeries.sort((a, b) => sortOrderSeries === "za"
    ? collator.compare(b.title || "", a.title || "")
    : collator.compare(a.title || "", b.title || ""));
  totalPagesSeries  = Math.max(1, Math.ceil(cacheSeries.length / PAGE_SIZE_TMDB_S));
  currentPageSeries = 1;
  renderClientPageSeries();
}

function renderClientPageSeries() {
  const start = (currentPageSeries - 1) * PAGE_SIZE_TMDB_S;
  const pageItems = cacheSeries.slice(start, start + PAGE_SIZE_TMDB_S);
  const prevSort = sortOrderSeries;
  sortOrderSeries = "client";
  displaySeries(pageItems);
  sortOrderSeries = prevSort;
  updatePaginationClientSeries();
  scrollToTopSmooth();
}

// ==========================
// Display
// ==========================
function displaySeries(series) {
  const container = document.getElementById("series");
  if (!container) return;
  lastSeriesPage = series.slice();
  let sorted = lastSeriesPage.slice();
  if (sortOrderSeries === "az" || sortOrderSeries === "za") {
    const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
    sorted.sort((a, b) => {
      const res = collator.compare(a.title || "", b.title || "");
      return sortOrderSeries === "za" ? -res : res;
    });
  } else if (sortOrderSeries !== "client") {
    sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
  container.innerHTML = "";
  sorted.forEach(s => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${s.affiche}" alt="${s.title}">
      <div>
        <p>${s.title ?? ""}</p>
        <p>${s.year ?? ""}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================
// Pagination UI
// ==========================
function updatePaginationServerSeries() {
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");
  setPageLabelSeries();
  if (btnPrev) btnPrev.disabled = currentPageSeries <= 1;
  if (btnNext) btnNext.disabled = (typeof totalPagesSeries === "number")
    ? (currentPageSeries >= totalPagesSeries)
    : (lastPageCountSeries < PAGE_SIZE_TMDB_S);
}

function updatePaginationClientSeries() {
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");
  setPageLabelSeries();
  if (btnPrev) btnPrev.disabled = currentPageSeries <= 1;
  if (btnNext) btnNext.disabled = currentPageSeries >= totalPagesSeries;
}

function setPageLabelSeries() {
  const lbl = document.getElementById("current-page");
  if (!lbl) return;
  if (typeof totalPagesSeries === "number" && totalPagesSeries > 0) {
    lbl.textContent = `Page ${currentPageSeries} / ${totalPagesSeries}`;
  } else {
    lbl.textContent = `Page ${currentPageSeries}`;
  }
}

// ==========================
// Initialisation DOM + Listeners
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const selOrder = document.getElementById('filter-order');
  if (selOrder) selOrder.value = sortOrderSeries;

  selOrder?.addEventListener('change', async (e) => {
    const value = e.target.value;
    sortOrderSeries = value;
    currentPageSeries = 1; totalPagesSeries = null; lastPageCountSeries = 0; cacheSeries = [];
    if (value === 'az' || value === 'za') {
      clientPagingSeries = true; await fetchAllThenSortSeries();
    } else {
      clientPagingSeries = false; await fetchSeries(currentPageSeries);
    }
  });

  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  btnPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries > 1) { currentPageSeries--; renderClientPageSeries(); }
    } else if (currentPageSeries > 1) fetchSeries(currentPageSeries - 1);
  });

  btnNext?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries < totalPagesSeries) { currentPageSeries++; renderClientPageSeries(); }
    } else {
      if (!totalPagesSeries || currentPageSeries < totalPagesSeries) fetchSeries(currentPageSeries + 1);
    }
  });

  fetchSeries(currentPageSeries);
});
