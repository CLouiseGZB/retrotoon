// ===============================
// small-search.js — UI petite barre (ouvre/ferme + submit)
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.search-container'); // wrapper petite barre
  const icon      = container?.querySelector('.search-icon');   // icône loupe
  const input     = document.getElementById('search-box');       // <input id="search-box">
  const form      = document.getElementById('searchForm');       // (optionnel) <form id="searchForm">

  if (!container || !icon || !input) return;

  function openSearch() {
    input.classList.add('active');
    input.focus();
  }
  function closeSearch() {
    input.classList.remove('active');
    input.blur();
  }

  // Empêche que le clic dans le container soit considéré "extérieur"
  container.addEventListener('click', (e) => e.stopPropagation());

  // Loupe : toggle
  icon.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.classList.contains('active') ? closeSearch() : openSearch();
  });

  // Enter -> lance recherche (ALL par défaut)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

      if (typeof window.setQueryParamsAndGo === 'function') {
        window.setQueryParamsAndGo(q, 'all');
      } else {
        window.location.href = `resultas-barre-de-recherche.html?query=${encodeURIComponent(q)}&filter=all`;
      }
    }
  });

  // Submit du formulaire (si tu as un bouton)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

      if (typeof window.setQueryParamsAndGo === 'function') {
        window.setQueryParamsAndGo(q, 'all');
      } else {
        window.location.href = `resultas-barre-de-recherche.html?query=${encodeURIComponent(q)}&filter=all`;
      }
    });
  }

  // Fermer au clic extérieur
  document.addEventListener('click', () => closeSearch());

  // Fermer avec Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });
});
