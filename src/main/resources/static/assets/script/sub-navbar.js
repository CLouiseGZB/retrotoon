/* ===== Dropdown "account" universel (multi-pages, sans ID) ===== */
(function () {
  // Ouvre/ferme au clic sur un toggle dans le HEADER
  document.addEventListener('click', function (e) {
    // On clique quelque part dans le header ?
    const accountRoot = e.target.closest('header .account');
    const clickedInsideMenu = e.target.closest('header .account .sub-menus');

    // 1) Clic sur un TOGGLE (dans .account, mais PAS dans .sub-menus)
    if (accountRoot && !clickedInsideMenu) {
      // Détecte un "toggle" plausible : <a> ou <button> ou [role=button] avec .icon/.dropdown-arrow/etc.
      const toggle = e.target.closest(
        'a.icon, button.icon, [role="button"].icon, ' +
        '.dropdown-arrow, .js-account-toggle, [data-account-toggle]'
      );

      if (toggle) {
        // Empêche une éventuelle navigation (#)
        if (toggle.tagName === 'A') e.preventDefault();
        e.stopPropagation();

        const menu = accountRoot.querySelector('.sub-menus');
        if (!menu) return;

        const willOpen = !menu.classList.contains('active');

        // Ferme tous les autres menus éventuels du header
        document.querySelectorAll('header .account .sub-menus.active')
          .forEach(m => m.classList.remove('active'));

        // Ouvre/ferme celui-ci
        menu.classList.toggle('active', willOpen);

        // Accessibilité
        toggle.setAttribute('aria-expanded', String(willOpen));
        if (menu.id && !toggle.hasAttribute('aria-controls')) {
          toggle.setAttribute('aria-controls', menu.id);
        }
        return;
      }
    }

    // 2) Clic en dehors de tout .account → fermer tous les menus
    if (!e.target.closest('header .account')) {
      document.querySelectorAll('header .account .sub-menus.active')
        .forEach(m => m.classList.remove('active'));
      document.querySelectorAll('header .account [aria-expanded="true"]')
        .forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });

  // 3) Touche Échap : ferme n’importe quel menu ouvert
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('header .account .sub-menus.active')
        .forEach(m => m.classList.remove('active'));
      document.querySelectorAll('header .account [aria-expanded="true"]')
        .forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });
})();
