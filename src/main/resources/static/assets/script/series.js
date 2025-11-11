/* ============================== CONFIG / CONSTANTES ============================== */
const API_KEY = "abedd43cf8d6083e8a33eafb9cc8b3f4";

/* ========================== ÉTAT : Filtres & pagination (serveur) ========================== */
let selectedGenreSeries = "";
let selectedAnneeSeries = "";
let currentPageSeries   = 1;
let totalPagesSeries    = null;
const PAGE_SIZE_TMDB_S  = 20;
let lastPageCountSeries = 0;
let sortOrderSeries     = "pop"; // 'pop' | 'az' | 'za' | 'client'
let lastSeriesPage      = [];

/* ========================== ÉTAT : Mode client (tri/pagination locale) ========================== */
const MAX_PAGES_TO_LOAD_S = 5;
let clientPagingSeries = false;
let cacheSeries        = [];

/* ============================== ENDPOINTS ============================== */
const apiUrlBaseSeries =
  `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}` +
  `&with_genres=16&first_air_date.gte=1970-01-01&first_air_date.lte=2010-12-31` +
  `&include_null_first_air_dates=false&language=fr-FR`;

/* ============================== HELPERS ============================== */
/**
 * Convertit "YYYY,YYYY" ou "YYYY-MM-DD,YYYY-MM-DD" en bornes { gte, lte }.
 */
function toDateRangeFromYears(rangeStr) {
  if (!rangeStr) return null;
  const [a, b] = rangeStr.split(",").map(s => s.trim());
  if (!a || !b) return null;
  const isFull = a.includes("-") && b.includes("-");
  return isFull ? { gte: a, lte: b } : { gte: `${a}-01-01`, lte: `${b}-12-31` };
}

/**
 * Normalise les résultats TMDB série pour l’UI.
 */
function mapSeries(results = []) {
  return results.map(serie => ({
    title:   serie.name,
    year:    serie.first_air_date ? serie.first_air_date.split("-")[0] : "Année inconnue",
    affiche: serie.poster_path
      ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible",
    popularity: serie.popularity ?? 0,
    tmdbId: serie.id
  }));
}

/**
 * Détails série (append content_ratings, translations).
 * @param {number} id
 * @returns {Promise<object>}
 */
async function getTvDetails(id) {
  const url = `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=fr-FR&append_to_response=content_ratings,translations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status} @ /tv/${id}`);
  return res.json();
}

/**
 * Transforme une certification (FR/US) en badge d’âge.
 * @param {string} cert
 * @returns {string}
 */
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

/**
 * Extrait la certification priorisant FR puis US depuis details TV.
 * @param {object} details
 * @returns {string}
 */
function pickCertificationTV(details) {
  const arr = details?.content_ratings?.results || [];
  const fr  = arr.find(r => r.iso_3166_1 === "FR")?.rating;
  const us  = arr.find(r => r.iso_3166_1 === "US")?.rating;
  return fr || us || "";
}

/* ============================== HISTORIQUE (localStorage) ============================== */
/**
 * Clé et utilitaire de stockage local de l’historique (max 30).
 */
const HISTORY_KEY = "vod_history";

/**
 * Ajoute un élément en tête, dédoublonné par (id,type), limite 30.
 * @param {object} item
 */
function pushHistoryLocal(item) {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const idx  = list.findIndex(x => x.id === item.id && x.type === item.type);
    if (idx !== -1) list.splice(idx, 1);
    list.unshift({ ...item, ts: Date.now() });
    if (list.length > 30) list.length = 30;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("localStorage indisponible:", e);
  }
}

/* ============================== FETCH (SERVEUR) ============================== */
/**
 * Charge une page de séries en appliquant les filtres et met à jour l’UI + pagination.
 */
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
    .then(response => {
      if (!response.ok) throw new Error("Erreur lors de la récupération des données séries");
      return response.json();
    })
    .then(data => {
      totalPagesSeries    = (typeof data.total_pages === "number") ? data.total_pages : null;
      currentPageSeries   = page;
      lastPageCountSeries = Array.isArray(data.results) ? data.results.length : 0;

      const seriesList = mapSeries(data.results || []);
      displaySeries(seriesList);
      updatePaginationServerSeries();
    })
    .catch(error => {
      console.error("Erreur séries:", error);
      const container = document.getElementById("series");
      if (container) container.innerHTML = "<p>Erreur lors de la récupération des séries.</p>";
    });
}

/**
 * Version "raw" qui renvoie juste results (pour le mode client).
 */
function fetchSeriesRaw(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;

  if (selectedGenreSeries) apiUrl += `&with_genres=16,${selectedGenreSeries}`;
  if (selectedAnneeSeries) {
    const range = toDateRangeFromYears(selectedAnneeSeries);
    if (range) apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
  }

  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur TMDB raw séries"); return r.json(); })
    .then(d => d.results || [])
    .catch(e => { console.error(e); return []; });
}

/* ============================== MODE CLIENT (tri global local) ============================== */
/**
 * Charge plusieurs pages, trie FR, initialise la pagination locale.
 */
async function fetchAllThenSortSeries() {
  clientPagingSeries = true;
  cacheSeries = [];

  for (let p = 1; p <= MAX_PAGES_TO_LOAD_S; p++) {
    const batch = await fetchSeriesRaw(p);
    cacheSeries.push(...mapSeries(batch));
    if (batch.length < PAGE_SIZE_TMDB_S) break;
  }

  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheSeries.sort((a, b) =>
    (sortOrderSeries === "za")
      ? collator.compare(b.title || "", a.title || "")
      : collator.compare(a.title || "", b.title || "")
  );

  totalPagesSeries  = Math.max(1, Math.ceil(cacheSeries.length / PAGE_SIZE_TMDB_S));
  currentPageSeries = 1;
  renderClientPageSeries();
}

/**
 * Rend une page locale et met à jour la pagination locale.
 */
function renderClientPageSeries() {
  const start = (currentPageSeries - 1) * PAGE_SIZE_TMDB_S;
  const pageItems = cacheSeries.slice(start, start + PAGE_SIZE_TMDB_S);

  const prevSort = sortOrderSeries;
  sortOrderSeries = "client";
  displaySeries(pageItems);
  sortOrderSeries = prevSort;

  updatePaginationClientSeries();
}

/* ============================== DISPLAY ============================== */
/**
 * Affiche la grille séries (tri local de la page si nécessaire) + clic => historique enrichi.
 */
function displaySeries(series) {
  const container = document.getElementById("series");
  if (!container) return;

  lastSeriesPage = (series || []).slice();

  // Tri local de la page (si on n’est pas déjà en mode client).
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
    card.dataset.id = String(s.tmdbId || ""); // pour le clic
    card.innerHTML = `
      <img src="${s.affiche}" alt="${s.title}">
      <div>
        <p>${s.title ?? ""}</p>
        <p>${s.year ?? ""}</p>
      </div>
    `;
    container.appendChild(card);
  });

  // Clic carte => fetch détails, construire payload "comme film.js", push localStorage
  if (!container.__historyBound) {
    container.addEventListener("click", async (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const id = Number(card.dataset.id || 0);
      if (!id) return;

      const item = sorted.find(x => x.tmdbId === id) || lastSeriesPage.find(x => x.tmdbId === id);
      if (!item) return;

      let d = null;
      try { d = await getTvDetails(id); } catch {}

      const rawCert = pickCertificationTV(d);
      const age     = certToBadge(rawCert);
      const duration = d?.episode_run_time?.[0] ? `${d.episode_run_time[0]}m` : "";
      const genres   = (d?.genres || []).map(g => g.name).slice(0,3).join(" • ");
      const year     = (d?.first_air_date || item?.year || "").slice(0,4);

      const payload = {
        id,
        type: "tv",
        title: item?.title || d?.name || "",
        poster_path:   d?.poster_path || "",
        backdrop_path: d?.backdrop_path || "",
        age,
        duration,
        year,
        genres
      };

      pushHistoryLocal(payload);

      if (typeof refreshHistoryCarousel === "function") {
        refreshHistoryCarousel();
      }
    });
    container.__historyBound = true;
  }
}

/* ============================== PAGINATION UI ============================== */
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
    lbl.setAttribute("aria-label", `Page ${currentPageSeries} sur ${totalPagesSeries}`);
  } else {
    lbl.textContent = `Page ${currentPageSeries}`;
    lbl.setAttribute("aria-label", `Page ${currentPageSeries}`);
  }
}

/* ============================== CHIPS / LIBELLÉS ============================== */
function getOrderLabelSeries() {
  if (sortOrderSeries === 'az') return 'Ordre : A → Z';
  if (sortOrderSeries === 'za') return 'Ordre : Z → A';
  return 'Popularité';
}
function getGenreLabelSeries() {
  const sel = document.getElementById('filter-genre');
  if (!sel || !selectedGenreSeries) return '';
  const opt = [...sel.options].find(o => o.value === String(selectedGenreSeries));
  return opt ? `Genre : ${opt.textContent.trim()}` : 'Genre';
}
function getAnneeLabelSeries() {
  const sel = document.getElementById('filter-annees');
  if (!sel || !selectedAnneeSeries) return '';
  const opt = [...sel.options].find(o => o.value === String(selectedAnneeSeries));
  return opt ? `Années : ${opt.textContent.trim()}` : 'Années';
}
function escapeHtmlSeries(s='') {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function renderActiveFiltersSeries() {
  const wrap = document.getElementById('active-filters');
  if (!wrap) return;
  wrap.innerHTML = '';

  const chips = [];
  if (selectedGenreSeries)  chips.push({ key: 'genre',  label: getGenreLabelSeries() });
  if (selectedAnneeSeries)  chips.push({ key: 'annees', label: getAnneeLabelSeries() });
  if (sortOrderSeries === 'az' || sortOrderSeries === 'za') chips.push({ key: 'order', label: getOrderLabelSeries() });

  if (chips.length === 0) return;

  for (const c of chips) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.setAttribute('data-key', c.key);
    btn.setAttribute('aria-label', `Supprimer le filtre ${c.label}`);
    btn.innerHTML = `${escapeHtmlSeries(c.label)} <span class="x" aria-hidden="true">×</span>`;
    wrap.appendChild(btn);
  }
}

/* ============================== INTERACTIONS CHIPS & RESET ============================== */
document.addEventListener('click', (e) => {
  const chip = e.target.closest('#active-filters .chip');
  if (!chip) return;
  const key = chip.getAttribute('data-key');

  if (key === 'genre') {
    selectedGenreSeries = '';
    const sel = document.getElementById('filter-genre');
    if (sel) sel.value = '';
  } else if (key === 'annees') {
    selectedAnneeSeries = '';
    const sel = document.getElementById('filter-annees');
    if (sel) sel.value = '';
  } else if (key === 'order') {
    sortOrderSeries = 'pop';
    const selOrder = document.getElementById('filter-order');
    if (selOrder) selOrder.value = 'pop';
    clientPagingSeries = false;
  }

  refetchAfterFilterChangeSeries();
  renderActiveFiltersSeries();
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#filters-reset');
  if (!btn) return;

  selectedGenreSeries = '';
  selectedAnneeSeries = '';
  sortOrderSeries     = 'pop';
  clientPagingSeries  = false;

  const selG = document.getElementById('filter-genre');
  const selA = document.getElementById('filter-annees');
  const selO = document.getElementById('filter-order');
  if (selG) selG.value = '';
  if (selA) selA.value = '';
  if (selO) selO.value = 'pop';

  currentPageSeries   = 1;
  totalPagesSeries    = null;
  lastPageCountSeries = 0;
  cacheSeries         = [];
  fetchSeries(currentPageSeries);
  renderActiveFiltersSeries();
});

/* ============================== INIT DOM + LISTENERS ============================== */
document.addEventListener("DOMContentLoaded", () => {
  const selFilterGenre  = document.getElementById("filter-genre");
  const selFilterAnnees = document.getElementById("filter-annees");

  selFilterGenre?.addEventListener("change", (event) => {
    selectedGenreSeries = event.target.value || "";
    refetchAfterFilterChangeSeries();
  });

  selFilterAnnees?.addEventListener("change", (event) => {
    selectedAnneeSeries = event.target.value || "";
    refetchAfterFilterChangeSeries();
  });

  const selOrder = document.getElementById('filter-order');
  if (selOrder) selOrder.value = sortOrderSeries;
  selOrder?.addEventListener('change', async (e) => {
    const value = e.target.value;
    sortOrderSeries     = value;
    currentPageSeries   = 1;
    totalPagesSeries    = null;
    lastPageCountSeries = 0;
    cacheSeries         = [];
    if (value === 'az' || value === 'za') {
      clientPagingSeries = true;
      await fetchAllThenSortSeries();
    } else {
      clientPagingSeries = false;
      await fetchSeries(currentPageSeries);
    }
    renderActiveFiltersSeries();
  });

  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  btnPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries > 1) { currentPageSeries--; renderClientPageSeries(); }
    } else {
      if (currentPageSeries > 1) { fetchSeries(currentPageSeries - 1); }
    }
  });

  btnNext?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries < totalPagesSeries) { currentPageSeries++; renderClientPageSeries(); }
    } else {
      const canGoNext = (typeof totalPagesSeries === "number")
        ? (currentPageSeries < totalPagesSeries)
        : true;
      if (canGoNext) { fetchSeries(currentPageSeries + 1); }
    }
  });

  fetchSeries(currentPageSeries);
});

/* ============================== REFETCH HELPER ============================== */
/**
 * Recharge après changement de filtre/tri, en respectant le mode courant.
 */
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
