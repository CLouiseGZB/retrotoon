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
const MAX_PAGES_TO_LOAD = 5;   // Combien de pages charger pour trier localement (5*20 = 100 films)
let clientPaging = false;      // true si pagination locale
let cacheFilms   = [];         // Films triés côté client (FR)

// ==========================
// API base
// ==========================
const apiUrlBaseFilms = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=16&primary_release_date.gte=1970-01-01&primary_release_date.lte=2010-12-31&language=fr-FR&include_adult=false`;

// ==========================
// Helpers
// ==========================
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
// Fetch côté serveur (page par page)
// ==========================
function fetchFilms(page = 1) {
  let apiUrl = `${apiUrlBaseFilms}&page=${page}`;

  // tri serveur si demandé (attention: original_title.* = titre original TMDB)
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
    .then(data => {
      totalPagesFilm    = (typeof data.total_pages === "number") ? data.total_pages : null;
      currentPageFilm   = page;
      lastPageCountFilm = Array.isArray(data.results) ? data.results.length : 0;

      const filmsList = mapFilms(data.results || []);
      displayFilms(filmsList);
      updatePaginationServer();
    })
    .catch(error => {
      console.error("Erreur lors de la récupération des films:", error);
      const containerFilms = document.getElementById("films");
      if (containerFilms) containerFilms.innerHTML = "<p>Erreur lors de la récupération des films.</p>";
    });
}

// Version "raw" qui renvoie juste results (pour le mode client)
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

// ==========================
// Mode client : charger plusieurs pages, trier FR, paginer localement
// ==========================
async function fetchAllThenSortAZZA() {
  clientPaging = true;
  cacheFilms = [];

  for (let p = 1; p <= MAX_PAGES_TO_LOAD; p++) {
    const batch = await fetchFilmsRaw(p);
    cacheFilms.push(...mapFilms(batch));
    if (batch.length < PAGE_SIZE_TMDB) break; // plus de pages
  }

  // Tri FR sur le titre affiché (on ne retire pas les articles)
  const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
  cacheFilms.sort((a, b) => {
    if (sortOrderFilm === "za") return collator.compare(b.title || "", a.title || "");
    return collator.compare(a.title || "", b.title || ""); // 'az' par défaut
  });

  // Init pagination locale
  totalPagesFilm  = Math.max(1, Math.ceil(cacheFilms.length / PAGE_SIZE_TMDB));
  currentPageFilm = 1;
  renderClientPage();
}

function renderClientPage() {
  const start = (currentPageFilm - 1) * PAGE_SIZE_TMDB;
  const pageItems = cacheFilms.slice(start, start + PAGE_SIZE_TMDB);

  // On demande à displayFilms de ne pas re-trier
  const prevSort = sortOrderFilm;
  sortOrderFilm = "client";
  displayFilms(pageItems);
  sortOrderFilm = prevSort;

  updatePaginationClient();
}

// ==========================
// Display
// ==========================
function displayFilms(films) {
  const containerFilms = document.getElementById("films");
  if (!containerFilms) return;

  // mémorise la page courante pour pouvoir re-trier sans refetch
  lastFilmsPage = (films || []).slice();

  // Si le tri est déjà fait côté client, on n'applique rien ici
  if (sortOrderFilm === "client") {
    containerFilms.innerHTML = "";
    lastFilmsPage.forEach(film => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <img src="${film.affiche}" alt="${film.title}">
        <div>
          <p>${film.title ?? ""}</p>
          <p>${film.year ?? ""}</p>
        </div>
      `;
      containerFilms.appendChild(card);
    });
    return;
  }

  // Sinon : tri local courant (uniquement sur la page en mode serveur)
  let sorted = lastFilmsPage.slice();

  if (sortOrderFilm === "az" || sortOrderFilm === "za") {
    const collator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true, numeric: true });
    sorted.sort((a, b) => {
      const res = collator.compare(a.title || "", b.title || "");
      return sortOrderFilm === "za" ? -res : res;
    });
  } else {
    // popularité décroissante
    sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  containerFilms.innerHTML = "";
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
    containerFilms.appendChild(card);
  });
}

// ==========================
// Pagination UI
// ==========================
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

function updatePaginationClient() {
  const lblPage = document.getElementById("current-page-films");
  const btnPrev = document.getElementById("prev-page-films");
  const btnNext = document.getElementById("next-page-films");

  setPageLabelFilms();
  if (btnPrev) btnPrev.disabled = currentPageFilm <= 1;
  if (btnNext) btnNext.disabled = currentPageFilm >= totalPagesFilm;
}

// ==========================
// Rechargement après changement de filtre
// ==========================
function refetchAfterFilterChange() {
  currentPageFilm   = 1;
  totalPagesFilm    = null;
  lastPageCountFilm = 0;
  cacheFilms        = [];

  if (sortOrderFilm === "az" || sortOrderFilm === "za") {
    clientPaging = true;      // rester en tri global côté client
    fetchAllThenSortAZZA().then(renderActiveFilters);
  } else {
    clientPaging = false;     // popularité (serveur)
    fetchFilms(currentPageFilm).then(renderActiveFilters);
  }
}

// --- helpers affichage libellés ---
function getOrderLabel() {
  if (sortOrderFilm === 'az') return 'Ordre : A → Z';
  if (sortOrderFilm === 'za') return 'Ordre : Z → A';
  return 'Popularité'; // on ne crée un chip "ordre" que pour az/za
}

function getGenreLabel() {
  const sel = document.getElementById('filter-genre');
  if (!sel || !selectedGenreFilm) return '';
  const opt = [...sel.options].find(o => o.value === String(selectedGenreFilm));
  return opt ? `Genre : ${opt.textContent.trim()}` : 'Genre';
}

function getAnneeLabel() {
  const sel = document.getElementById('filter-annees');
  if (!sel || !selectedAnneeFilm) return '';
  const opt = [...sel.options].find(o => o.value === String(selectedAnneeFilm));
  return opt ? `Années : ${opt.textContent.trim()}` : 'Années';
}

function setPageLabelFilms() {
  const lbl = document.getElementById("current-page-films");
  if (!lbl) return;
  if (typeof totalPagesFilm === "number" && totalPagesFilm > 0) {
    lbl.textContent = `Page ${currentPageFilm} / ${totalPagesFilm}`; // ou `${currentPageFilm} / ${totalPagesFilm}`
    lbl.setAttribute("aria-label", `Page ${currentPageFilm} sur ${totalPagesFilm}`);
  } else {
    lbl.textContent = `Page ${currentPageFilm}`;
    lbl.setAttribute("aria-label", `Page ${currentPageFilm}`);
  }
}


function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// --- rendu de l’historique ---
function renderActiveFilters() {
  const wrap = document.getElementById('active-filters');
  if (!wrap) return;
  wrap.innerHTML = '';

  const chips = [];

  if (selectedGenreFilm)  chips.push({ key: 'genre',  label: getGenreLabel() });
  if (selectedAnneeFilm)  chips.push({ key: 'annees', label: getAnneeLabel() });
  if (sortOrderFilm === 'az' || sortOrderFilm === 'za') {
    chips.push({ key: 'order',  label: getOrderLabel() });
  }

  if (chips.length === 0) return;

  for (const c of chips) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.setAttribute('data-key', c.key);
    btn.setAttribute('aria-label', `Supprimer le filtre ${c.label}`);
    btn.innerHTML = `${escapeHtml(c.label)} <span class="x" aria-hidden="true">×</span>`;
    wrap.appendChild(btn);
  }
}

// --- retirer un filtre en cliquant sur la “x” ---
document.addEventListener('click', (e) => {
  const chip = e.target.closest('#active-filters .chip');
  if (!chip) return;
  const key = chip.getAttribute('data-key');

  if (key === 'genre') {
    selectedGenreFilm = '';
    const sel = document.getElementById('filter-genre');
    if (sel) sel.value = '';
  } else if (key === 'annees') {
    selectedAnneeFilm = '';
    const sel = document.getElementById('filter-annees');
    if (sel) sel.value = '';
  } else if (key === 'order') {
    sortOrderFilm = 'pop';
    const selOrder = document.getElementById('filter-order');
    if (selOrder) selOrder.value = 'pop';
    // repasser en mode serveur pour l’ordre pop
    clientPaging = false;
  }

  // recharge avec la logique qui respecte l’ordre courant
  refetchAfterFilterChange();
  renderActiveFilters();
});

// --- bouton Réinitialiser ---
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#filters-reset');
  if (!btn) return;

  selectedGenreFilm = '';
  selectedAnneeFilm = '';
  sortOrderFilm     = 'pop';
  clientPaging      = false;

  // sync UI
  const selG = document.getElementById('filter-genre');
  const selA = document.getElementById('filter-annees');
  const selO = document.getElementById('filter-order');
  if (selG) selG.value = '';
  if (selA) selA.value = '';
  if (selO) selO.value = 'pop';

  // recharge standard
  currentPageFilm   = 1;
  totalPagesFilm    = null;
  lastPageCountFilm = 0;
  cacheFilms        = [];
  fetchFilms(currentPageFilm);

  renderActiveFilters();
});

// ==========================
// Initialisation DOM + Listeners
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Filtres
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
    selectedAnneeFilm = event.target.value || ""; // ex: "1970,2010"
    refetchAfterFilterChange();
  });

  // Délégation d’événements pour le tri (marche avec <button> ou <a>)
  // ---- TRI via le <select id="filter-order"> ----
const selOrder = document.getElementById('filter-order');

// garder l'UI synchro avec l'état courant
if (selOrder) selOrder.value = sortOrderFilm;

selOrder?.addEventListener('change', async (e) => {
  const value = e.target.value;            // 'pop' | 'az' | 'za'
  sortOrderFilm    = value;
  currentPageFilm  = 1;
  totalPagesFilm   = null;
  lastPageCountFilm= 0;
  cacheFilms       = [];

  if (value === 'az' || value === 'za') {
    // tri global côté client : charge plusieurs pages, trie sur le titre FR
    clientPaging = true;
    await fetchAllThenSortAZZA();
  } else {
    // retour au flux serveur (popularité)
    clientPaging = false;
    await fetchFilms(currentPageFilm);
  }
  renderActiveFilters();
});


  // Pagination
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

  // Chargement initial
  fetchFilms(currentPageFilm);
});
