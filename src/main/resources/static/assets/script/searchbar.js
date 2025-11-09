/****
 * Petite barre de recherche :
 * - Ouvre/ferme l’input au clic sur la loupe
 * - Lance la recherche (filtre 'all') sur Entrée ou submit
 * - Se ferme au clic extérieur ou via Échap
 ****/
document.addEventListener('DOMContentLoaded', () => {
  /* ========================= Références DOM ========================= */
  const container = document.querySelector('.search-container');
  const icon      = container?.querySelector('.search-icon');
  const input     = document.getElementById('search-box');
  const form      = document.getElementById('searchForm');

  if (!container || !icon || !input) return;

  /* ========================= Contrôles UI ========================= */
  /*** 
   * Ouvre la zone de recherche et donne le focus. 
   ***/
  function openSearch() {
    input.classList.add('active');
    input.focus();
  }
  /** Ferme la zone de recherche et retire le focus. */
  function closeSearch() {
    input.classList.remove('active');
    input.blur();
  }

  /* ========================= Écouteurs UI ========================= */
  container.addEventListener('click', (e) => e.stopPropagation());

  icon.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.classList.contains('active') ? closeSearch() : openSearch();
  });

  /* ========================= Navigation (recherche) ========================= */
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

  /* ========================= Fermeture (extérieur / Échap) ========================= */
  document.addEventListener('click', () => closeSearch());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });
});

