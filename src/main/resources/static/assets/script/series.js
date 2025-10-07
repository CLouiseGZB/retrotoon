const API_KEY = "abedd43cf8d6083e8a33eafb9cc8b3f4";

// ==========================
// Variables filtres & pagination (serveur)
// ==========================
let selectedGenreSeries = "";   // Genre secondaire sélectionné
let selectedAnneeSeries = "";   // Plage d'années ("1970,2010" ou "1970-01-01,1979-12-31")
let currentPageSeries   = 1;    // Page actuelle
let totalPagesSeries    = null; // Nombre total de pages (serveur) inconnu
const PAGE_SIZE_TMDB_S  = 20;   // Taille page standard TMDB (Séries)
let lastPageCountSeries = 0;    // Nombre d'items de la dernière page
let sortOrderSeries     = "pop"; // 'pop' | 'az' | 'za' | 'client'
let lastSeriesPage      = [];   // dernière liste affichée (pour re-render rapide)

// ==========================
// Variables du mode client (tri global local)
// ==========================
const MAX_PAGES_TO_LOAD_S = 5;  // Combien de pages charger pour trier localement
let clientPagingSeries = false; // true si pagination locale
let cacheSeries        = [];    // Séries triées côté client (FR)

// ==========================
// API base (TV)
// ==========================
const apiUrlBaseSeries = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&first_air_date.gte=1970-01-01&first_air_date.lte=2010-12-31&include_null_first_air_dates=false&language=fr-FR`;

// ==========================
// Helpers
// ==========================
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
// Fetch côté serveur (page par page)
// ==========================
function fetchSeries(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;

  // tri serveur si demandé (attention: original_name.* = titre original TMDB)
  if (sortOrderSeries === "az") apiUrl += `&sort_by=original_name.asc`;
  if (sortOrderSeries === "za") apiUrl += `&sort_by=original_name.desc`;

  if (selectedGenreSeries) {
    apiUrl += `&with_genres=16,${selectedGenreSeries}`;
  }

  if (selectedAnneeSeries) {
    const range = toDateRangeFromYears(selectedAnneeSeries);
    if (range) {
      apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
    }
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

// Version "raw" qui renvoie juste results (pour le mode client)
function fetchSeriesRaw(page = 1) {
  let apiUrl = `${apiUrlBaseSeries}&page=${page}`;

  if (selectedGenreSeries) apiUrl += `&with_genres=16,${selectedGenreSeries}`;

  if (selectedAnneeSeries) {
    const range = toDateRangeFromYears(selectedAnneeSeries);
    if (range) {
      apiUrl += `&first_air_date.gte=${range.gte}&first_air_date.lte=${range.lte}`;
    }
  }

  return fetch(apiUrl)
    .then(r => { if (!r.ok) throw new Error("Erreur TMDB raw séries"); return r.json(); })
    .then(d => d.results || [])
    .catch(e => { console.error(e); return []; });
}

// ==========================
// Mode client : charger plusieurs pages, trier FR, paginer localement
// ==========================
async function fetchAllThenSortSeries() {
  clientPagingSeries = true;
  cacheSeries = [];

  for (let p = 1; p <= MAX_PAGES_TO_LOAD_S; p++) {
    const batch = await fetchSeriesRaw(p);
    cacheSeries.push(...mapSeries(batch));
    if (batch.length < PAGE_SIZE_TMDB_S) break; // plus de pages
  }

  // Tri FR sur le titre affiché (on ne retire pas les articles)
  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheSeries.sort((a, b) => {
    if (sortOrderSeries === "za") return collator.compare(b.title || "", a.title || "");
    return collator.compare(a.title || "", b.title || ""); // 'az' par défaut
  });

  // Init pagination locale
  totalPagesSeries  = Math.max(1, Math.ceil(cacheSeries.length / PAGE_SIZE_TMDB_S));
  currentPageSeries = 1;
  renderClientPageSeries();
}

function renderClientPageSeries() {
  const start = (currentPageSeries - 1) * PAGE_SIZE_TMDB_S;
  const pageItems = cacheSeries.slice(start, start + PAGE_SIZE_TMDB_S);

  // On demande à displaySeries de ne pas re-trier
  const prevSort = sortOrderSeries;
  sortOrderSeries = "client";
  displaySeries(pageItems);
  sortOrderSeries = prevSort;

  updatePaginationClientSeries();
}

// ==========================
// Display
// ==========================
function displaySeries(series) {
  const container = document.getElementById("series");
  if (!container) return;

  // mémorise la page courante pour pouvoir re-trier sans refetch
  lastSeriesPage = (series || []).slice();

  // Si le tri est déjà fait côté client, on n'applique rien ici
  if (sortOrderSeries === "client") {
    container.innerHTML = "";
    lastSeriesPage.forEach(s => {
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
    return;
  }

  // Sinon : tri local courant (uniquement sur la page en mode serveur)
  let sorted = lastSeriesPage.slice();

  if (sortOrderSeries === "az" || sortOrderSeries === "za") {
    const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
    sorted.sort((a, b) => {
      const res = collator.compare(a.title || "", b.title || "");
      return sortOrderSeries === "za" ? -res : res;
    });
  } else {
    // popularité décroissante
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
  const lblPage = document.getElementById("current-page");
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  setPageLabelSeries();;
  if (btnPrev) btnPrev.disabled = currentPageSeries <= 1;

  const noNext = (typeof totalPagesSeries === "number")
    ? (currentPageSeries >= totalPagesSeries)
    : (lastPageCountSeries < PAGE_SIZE_TMDB_S);

  if (btnNext) btnNext.disabled = !!noNext;
}

function updatePaginationClientSeries() {
  const lblPage = document.getElementById("current-page");
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  setPageLabelSeries();
  if (btnPrev) btnPrev.disabled = currentPageSeries <= 1;
  if (btnNext) btnNext.disabled = currentPageSeries >= totalPagesSeries;
}

// ==========================
// Rechargement après changement de filtre
// ==========================
function refetchAfterFilterChangeSeries() {
  currentPageSeries   = 1;
  totalPagesSeries    = null;
  lastPageCountSeries = 0;
  cacheSeries         = [];

  if (sortOrderSeries === "az" || sortOrderSeries === "za") {
    clientPagingSeries = true;      // rester en tri global côté client
    fetchAllThenSortSeries().then(renderActiveFiltersSeries);
  } else {
    clientPagingSeries = false;     // popularité (serveur)
    fetchSeries(currentPageSeries).then(renderActiveFiltersSeries);
  }
}

// --- helpers affichage libellés ---
function getOrderLabelSeries() {
  if (sortOrderSeries === 'az') return 'Ordre : A → Z';
  if (sortOrderSeries === 'za') return 'Ordre : Z → A';
  return 'Popularité'; // on ne crée un chip "ordre" que pour az/za
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

function setPageLabelSeries() {
  const lbl = document.getElementById("current-page");
  if (!lbl) return;
  if (typeof totalPagesSeries === "number" && totalPagesSeries > 0) {
    lbl.textContent = `Page ${currentPageSeries} / ${totalPagesSeries}`; // ou `${currentPageSeries} / ${totalPagesSeries}`
    lbl.setAttribute("aria-label", `Page ${currentPageSeries} sur ${totalPagesSeries}`);
  } else {
    lbl.textContent = `Page ${currentPageSeries}`;
    lbl.setAttribute("aria-label", `Page ${currentPageSeries}`);
  }
}


function escapeHtmlSeries(s='') {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// --- rendu de l’historique ---
function renderActiveFiltersSeries() {
  const wrap = document.getElementById('active-filters');
  if (!wrap) return;
  wrap.innerHTML = '';

  const chips = [];

  if (selectedGenreSeries)  chips.push({ key: 'genre',  label: getGenreLabelSeries() });
  if (selectedAnneeSeries)  chips.push({ key: 'annees', label: getAnneeLabelSeries() });
  if (sortOrderSeries === 'az' || sortOrderSeries === 'za') {
    chips.push({ key: 'order',  label: getOrderLabelSeries() });
  }

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

// --- retirer un filtre en cliquant sur la “x” ---
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
    // repasser en mode serveur pour l’ordre pop
    clientPagingSeries = false;
  }

  // recharge avec la logique qui respecte l’ordre courant
  refetchAfterFilterChangeSeries();
  renderActiveFiltersSeries();
});

// --- bouton Effacer les filtres ---
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#filters-reset');
  if (!btn) return;

  selectedGenreSeries = '';
  selectedAnneeSeries = '';
  sortOrderSeries     = 'pop';
  clientPagingSeries  = false;

  // sync UI
  const selG = document.getElementById('filter-genre');
  const selA = document.getElementById('filter-annees');
  const selO = document.getElementById('filter-order');
  if (selG) selG.value = '';
  if (selA) selA.value = '';
  if (selO) selO.value = 'pop';

  // recharge standard
  currentPageSeries   = 1;
  totalPagesSeries    = null;
  lastPageCountSeries = 0;
  cacheSeries         = [];
  fetchSeries(currentPageSeries);

  renderActiveFiltersSeries();
});

// ==========================
// Initialisation DOM + Listeners
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Filtres
  const selFilterGenre  = document.getElementById("filter-genre");
  const selFilterAnnees = document.getElementById("filter-annees");

  selFilterGenre?.addEventListener("change", (event) => {
    selectedGenreSeries = event.target.value || "";
    refetchAfterFilterChangeSeries();
  });

  selFilterAnnees?.addEventListener("change", (event) => {
    selectedAnneeSeries = event.target.value || ""; // ex: "1970,2010" ou "1970-01-01,1979-12-31"
    refetchAfterFilterChangeSeries();
  });

  // ---- TRI via le <select id="filter-order"> ----
  const selOrder = document.getElementById('filter-order');

  // garder l'UI synchro avec l'état courant
  if (selOrder) selOrder.value = sortOrderSeries;

  selOrder?.addEventListener('change', async (e) => {
    const value = e.target.value;            // 'pop' | 'az' | 'za'
    sortOrderSeries   = value;
    currentPageSeries = 1;
    totalPagesSeries  = null;
    lastPageCountSeries = 0;
    cacheSeries       = [];

    if (value === 'az' || value === 'za') {
      // tri global côté client : charge plusieurs pages, trie sur le titre FR
      clientPagingSeries = true;
      await fetchAllThenSortSeries();
    } else {
      // retour au flux serveur (popularité)
      clientPagingSeries = false;
      await fetchSeries(currentPageSeries);
    }
    renderActiveFiltersSeries();
  });

  // Pagination
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  btnPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    if (clientPagingSeries) {
      if (currentPageSeries > 1) {
        currentPageSeries--;
        renderClientPageSeries();
      }
    } else {
      if (currentPageSeries > 1) {
        fetchSeries(currentPageSeries - 1);
      }
    }
  });

  btnNext?.addEventListener("click", (e) => {
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
      if (canGoNext) {
        fetchSeries(currentPageSeries + 1);
      }
    }
  });

  // Chargement initial
  fetchSeries(currentPageSeries);
});
