// ===============================
// recherche.js — Grande barre + TMDB + Résultats + Filtres
// ===============================

// --- Clé TMDB ---
const API_KEY = 'abedd43cf8d6083e8a33eafb9cc8b3f4';

// --- Références DOM (grande barre & résultats) ---
const form = document.getElementById('searchForm');                     // <form id="searchForm"> autour de la grande barre (optionnel)
const largeSearchBox = document.getElementById('large-search-box');     // <input id="large-search-box">
const largeSearchButton = document.getElementById('large-search-button');// bouton de la grande barre
const results = document.getElementById('results');

// Filtres (boutons sur la page résultats)
const filterAllButton = document.getElementById('filter-all');
const filterAnimationButton = document.getElementById('filter-animation');
const filterMoviesButton = document.getElementById('filter-movies');

// --- État ---
let _imageBaseUrl, _imageSizes;
let filterType = 'all'; // filtre par défaut

// ===============================
// Utils URL & text
// ===============================
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

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
// Expose pour d'autres scripts éventuels (ex. petite barre)
window.setQueryParamsAndGo = setQueryParamsAndGo;

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===============================
// Config images TMDB
// ===============================
fetch(`https://api.themoviedb.org/3/configuration?api_key=${API_KEY}`)
  .then(r => r.json())
  .then(data => {
    _imageBaseUrl = data?.images?.base_url || 'https://image.tmdb.org/t/p/';
    _imageSizes = data?.images?.poster_sizes || ['w342'];
  })
  .catch(err => console.error('Erreur config TMDB :', err));

// ===============================
// Recherche combinée (films + séries)
// ===============================
function search(query) {
  if (!query || !results) return;
  results.innerHTML = ''; // reset

  const moviesUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR&include_adult=false`;
  const tvUrl     = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR&include_adult=false`;

  Promise.all([ fetch(moviesUrl).then(r=>r.json()), fetch(tvUrl).then(r=>r.json()) ])
    .then(([moviesData, tvData]) => {
      const movies = Array.isArray(moviesData?.results) ? moviesData.results : [];
      const shows  = Array.isArray(tvData?.results)     ? tvData.results     : [];

      // Filtre “Animation” (genre 16) + années 1970–2010
      const filteredMovies = movies
        .filter(m => (m?.genre_ids || []).includes(16))
        .filter(m => {
          const y = m?.release_date ? new Date(m.release_date).getFullYear() : NaN;
          return y >= 1970 && y <= 2010;
        });

      const filteredShows = shows
        .filter(s => (s?.genre_ids || []).includes(16))
        .filter(s => {
          const y = s?.first_air_date ? new Date(s.first_air_date).getFullYear() : NaN;
          return y >= 1970 && y <= 2010;
        });

      if (filterType === 'all') {
        const total = filteredMovies.length + filteredShows.length;
        const niceQuery = capitalizeFirst(query);
        results.innerHTML = buildResultsHeader(niceQuery, total); // Header global “X résultats pour "Y"”
        results.innerHTML += filteredMovies.map(buildMovieElement).join('');
        results.innerHTML += filteredShows.map(buildTVShowElement).join('');
      } else if (filterType === 'movies') {
        results.innerHTML = buildResultsHeader('Films', filteredMovies.length);
        results.innerHTML += filteredMovies.map(buildMovieElement).join('');
      } else if (filterType === 'animation') {
        results.innerHTML = buildResultsHeader('Animation', filteredShows.length);
        results.innerHTML += filteredShows.map(buildTVShowElement).join('');
      }
    })
    .catch(err => console.error('Erreur recherche combinée :', err));
}

// ===============================
// Templates
// ===============================
function buildResultsHeader(typeOrQuery, count) {
  return `<div class="results-header"><h2>${count} résultats pour "${typeOrQuery}"</h2></div>`;
}

function buildMovieElement(movie) {
  const posterPath = movie?.poster_path ? getMoviePoster(movie.poster_path) : 'https://via.placeholder.com/200x300?text=No+Image';
  const releaseYear = movie?.release_date ? new Date(movie.release_date).getFullYear() : 'Année inconnue';
  return `
    <div class="card">
      <img src="${posterPath}" alt="${movie?.title || 'Film'}">
      <div>
        <p>${movie?.title || 'Titre inconnu'}</p>
        <p>${releaseYear}</p>
      </div>
    </div>`;
}

function buildTVShowElement(tvShow) {
  const posterPath = tvShow?.poster_path ? getMoviePoster(tvShow.poster_path) : 'https://via.placeholder.com/200x300?text=No+Image';
  const firstAirYear = tvShow?.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'Année inconnue';
  return `
    <div class="card">
      <img src="${posterPath}" alt="${tvShow?.name || 'Série'}">
      <div>
        <p>${tvShow?.name || 'Titre inconnu'}</p>
        <p>${firstAirYear}</p>
      </div>
    </div>`;
}

function getMoviePoster(imagePath) {
  const base = _imageBaseUrl || 'https://image.tmdb.org/t/p/';
  const size = _imageSizes?.[2] || _imageSizes?.[0] || 'w342';
  return `${base}${size}${imagePath}`;
}

// ===============================
// Chargement initial (URL → recherche)
// ===============================
function loadResults() {
  const queryFromUrl = getQueryParam('query');
  const filterFromUrl = getQueryParam('filter');
  filterType = filterFromUrl || 'all'; // par défaut ALL
  if (queryFromUrl) {
    search(queryFromUrl);
    if (largeSearchBox) largeSearchBox.value = queryFromUrl;
  }
}
window.addEventListener('load', loadResults);

// ===============================
// Filtres (indépendants)
// ===============================
function applyFilter(newFilterType) {
  filterType = newFilterType;

  // on lit la requête depuis inputs si présents, sinon depuis l’URL
  const q =
    (document.getElementById('large-search-box')?.value ||
     getQueryParam('query') ||  // (la petite barre est dans un autre script)
     '').trim();

  if (q) {
    setQueryParamsAndGo(q, filterType); // recharge avec query + filtre
  } else {
    setQueryParamsAndGo('', filterType); // change juste le filtre si pas de query
  }
}

// Listeners des boutons filtres
filterAllButton?.addEventListener('click', () => applyFilter('all'));
filterAnimationButton?.addEventListener('click', () => applyFilter('animation'));
filterMoviesButton?.addEventListener('click', () => applyFilter('movies'));

// ===============================
// Listeners grande barre (force ALL pour une nouvelle recherche)
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  // Enter
  if (largeSearchBox) {
    largeSearchBox.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const q = largeSearchBox.value.trim();
        if (q) setQueryParamsAndGo(q, 'all'); // nouvelle recherche => ALL
      }
    });
  }
  // Bouton
  if (largeSearchButton && largeSearchBox) {
    largeSearchButton.addEventListener('click', () => {
      const q = largeSearchBox.value.trim();
      if (q) setQueryParamsAndGo(q, 'all'); // nouvelle recherche => ALL
    });
  }
  // Submit du formulaire (si présent)
  if (form && largeSearchBox) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = largeSearchBox.value.trim();
      if (q) setQueryParamsAndGo(q, 'all'); // nouvelle recherche => ALL
    });
  }
});

// ===============================
// Écoute la petite barre (d’un autre script) — “search:submit”
// ===============================
document.addEventListener('search:submit', (e) => {
  const q = (e.detail?.query || '').trim();
  if (q) setQueryParamsAndGo(q, 'all'); // petite barre => ALL par défaut aussi
});
