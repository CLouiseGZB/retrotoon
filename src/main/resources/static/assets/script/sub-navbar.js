/**** Fonction gestion du menu "compte" dans le header 
 * Ouverture/fermeture du menu au clic
 * Ferme si clic à l’extérieur
 * Ferme avec la touche echap
 ****/

(function () {
  document.addEventListener('click', function (e) {
    const accountRoot = e.target.closest('header .account');
    const clickedInsideMenu = e.target.closest('header .account .sub-menus');

    if (accountRoot && !clickedInsideMenu) {
      const toggle = e.target.closest(
        'a.icon, button.icon, [role="button"].icon, ' +
        '.dropdown-arrow, .js-account-toggle, [data-account-toggle]'
      );

      if (toggle) {
        
        if (toggle.tagName === 'A') e.preventDefault();
        e.stopPropagation();
        const menu = accountRoot.querySelector('.sub-menus');

        if (!menu) return;
        const willOpen = !menu.classList.contains('active');
        document.querySelectorAll('header .account .sub-menus.active')
          .forEach(m => m.classList.remove('active'));
        menu.classList.toggle('active', willOpen);
        toggle.setAttribute('aria-expanded', String(willOpen));
        
        if (menu.id && !toggle.hasAttribute('aria-controls')) {
          toggle.setAttribute('aria-controls', menu.id);
        }

        return;
      }
    }

    if (!e.target.closest('header .account')) {
      document.querySelectorAll('header .account .sub-menus.active')
        .forEach(m => m.classList.remove('active'));
      document.querySelectorAll('header .account [aria-expanded="true"]')
        .forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('header .account .sub-menus.active')
        .forEach(m => m.classList.remove('active'));
      document.querySelectorAll('header .account [aria-expanded="true"]')
        .forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });
})();


/****Fonction gestion du drawer (panneau latéral) du compte utilisateur
 * Ouvrerture/fermeture du drawer
 * Ferme si clic à l’extérieur ou touche Échap
 * Bouton de déconnexion
 ****/

(function () {
  const btn = document.getElementById('tabAccountBtn');
  const drawer = document.getElementById('accountDrawer');
  const closeBtn = drawer?.querySelector('.drawer-close');

  if (!btn || !drawer) return;

  const open = () => drawer.classList.add('show');
  const close = () => drawer.classList.remove('show');

  btn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  drawer.addEventListener('click', (e) => {
    if (!e.target.closest('.drawer-card')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    fetch('/logout', { method: 'POST' }).finally(() => {
      window.location.href = '../html/index.html';
    });
  });
})();
