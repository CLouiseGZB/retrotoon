/****
 * Fonction pour afficher le contenu cache
 ****/
document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');

  const showPage = (id) => {
    pages.forEach(p => {
      p.classList.remove('active');
      p.setAttribute('hidden', '');
    });
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      target.removeAttribute('hidden');
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  };

/****
 * Fonction pour naviguer entre le contenu cache
 ****/
 document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = el.getAttribute('data-page');
      if (!id) return;

      if (id === 'page-gestion-compte-6') {
        window.location.href = '../html/index.html';
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      showPage(id);
    });

    if (el.tagName !== 'A' && !el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    }
  });

  pages.forEach(p => {
    if (!p.classList.contains('active')) p.setAttribute('hidden', '');
  });
});

/****
 * Fonction pour clics sur éléments avec data-page ET PAS de href
 ****/
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-page]');
  if (!trigger) return;

  const link = e.target.closest('a[href]');
  if (link) return;

  const pageId = trigger.dataset.page;
  if (!pageId) return;

  e.preventDefault();
 afficherPage(pageId);
});

document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href]');
  if (anchor) {
    e.stopPropagation();
  }
}, { capture: true });



/****
 * Fonction pour déconnecter
 ****/
async function doLogout(redirectUrl) {
  try {
    await fetch('/logout', { method: 'POST' });
  } catch (e) {
    console.warn("Impossible d'appeler /logout, redirection forcée.");
  }

  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');

  window.location.href = redirectUrl;
}

/****
 * Bouton de la sub-navbar
 ****/
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  doLogout('/index.html');
});

/****
 * Bouton sur compte.html
 ****/
document.getElementById('logoutBtnAccount')?.addEventListener('click', () => {
  doLogout('/index.html');
});
/****
 * Lien "Déconnexion" dans paramètres
 ****/
document.querySelector('.choixParametre[data-page="page-gestion-compte-6"]')
  ?.addEventListener('click', () => {
    doLogout('../html/index.html');
});

/****
 * Fonction pour Map "hash" -> id de section .page
 * Ouvre la section demandée par le hash (ex: #securite)
 ****/
const SECTION_HASH_MAP = {
  securite:  'page-gestion-compte-2',
  compte:    'page-gestion-compte-1',
  appareils: 'page-gestion-compte-3',
  accueil:   'page-accueil'
};

function openFromHash() {
  const key = (location.hash || '').replace('#', '').trim();
  const targetId = SECTION_HASH_MAP[key];
  if (!targetId) return;

  if (typeof afficherPage === 'function') {
    afficherPage(targetId);
  } else {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(targetId)?.classList.add('active');
  }

  const accueil = document.getElementById('page-accueil');
  if (accueil && targetId !== 'page-accueil') {
    accueil.classList.remove('active');
  }

  window.scrollTo({ top: 190, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', openFromHash);
window.addEventListener('hashchange', openFromHash);


/****
 * Fonction fetch app route
 * pour la formulaire du modifications
 * des données personnelles
 ****/
document.getElementById('userBtn').addEventListener('click', async (e) => {
  e.preventDefault();

  const oldEmail = document.getElementById('email').value.trim();
  const nouveauEmail = document.getElementById('nouveauEmail').value.trim();
  const confirmEmail = document.getElementById('confirmEmail').value.trim();

  const userData = {
    nom: document.getElementById('nom').value.trim(),
    prenom: document.getElementById('prenom').value.trim(),
    dateDeNaissance: document.getElementById('dateDeNaissance').value, 
    email: nouveauEmail
  };

  if (nouveauEmail !== confirmEmail) {
    alert("Les emails ne correspondent pas.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/api/modify/user/${encodeURIComponent(oldEmail)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      alert("Modifications enregistrées avec succès !");
      window.location.href = "parametre.html";
    } else if (response.status === 404) {
      alert("Erreur : utilisateur introuvable (email actuel incorrect).");
    } 
  } catch (error) {
    console.error("Erreur de connexion:", error);
    alert("Erreur de connexion au serveur.");
  }
});

/****
 * Fonction pour active le bouton œil 
 * pour tous les inputs avec data-target
 ****/
  (function () {
    const container = document.getElementById('page-gestion-compte-2');
    if (!container) return;

    container.addEventListener('click', function (e) {
      const btn = e.target.closest('.icon-btn');
      if (!btn) return;

      const inputId = btn.getAttribute('data-target');
      const input = document.getElementById(inputId);
      if (!input) return;

      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';

      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  })();