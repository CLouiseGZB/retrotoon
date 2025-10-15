document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');

  const showPage = (id) => {
    pages.forEach(p => {
      p.classList.remove('active');
      p.setAttribute('hidden', ''); // a11y + évite les flash
    });
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      target.removeAttribute('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Un seul écouteur pour TOUT ce qui a data-page (choix + retour)
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = el.getAttribute('data-page');
      if (!id) return;

      // Cas spécial: "Déconnexion" (data-page="page-gestion-compte-6" chez toi)
      if (id === 'page-gestion-compte-6') {
        // TODO: clear token/localStorage si tu utilises JWT
        window.location.href = '../html/index.html';
        return;
      }

      // Empêche la sélection de texte et évite side effects
      e.preventDefault();
      e.stopPropagation();

      showPage(id);
    });

    // Accessibilité clavier (Entrée / Espace) pour les div/btn
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

  // Optionnel: démarrer proprement (assure hidden sur celles non actives)
  pages.forEach(p => {
    if (!p.classList.contains('active')) p.setAttribute('hidden', '');
  });
});

// 1) SPA : clics sur éléments avec data-page ET PAS de href
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-page]');
  if (!trigger) return;

  // si c'est (ou contient) un lien <a href>, on laisse la navigation native
  const link = e.target.closest('a[href]');
  if (link) return;

  // on gère UNIQUEMENT les éléments sans href (ex: <button data-page="...">)
  const pageId = trigger.dataset.page;
  if (!pageId) return;

  e.preventDefault();
  afficherPage(pageId);
});

// 2) Bonus : empêche qu’un parent SPA intercepte un clic sur un vrai lien
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href]');
  if (anchor) {
    // on laisse faire la redirection native et on bloque la propagation
    e.stopPropagation();
  }
}, { capture: true }); // capture pour être sûr de passer avant d'autres handlers



// document.getElementById('saveCodeButton').addEventListener('click', function () {
//     const codeInput = document.getElementById('code').value;
//     const messageElement = document.getElementById('message');

//     // Vérification que le code est composé de quatre chiffres uniquement
//     if (/^\d{4}$/.test(codeInput)) {
//         // Enregistrer le code parental dans le stockage local (ou toute autre méthode de stockage)
//         localStorage.setItem('parentalCode', codeInput);
//         messageElement.textContent = 'Code parental enregistré avec succès !';
//         messageElement.style.color = 'green';
//     } else {
//         messageElement.textContent = 'Veuillez entrer un code à 4 chiffres uniquement.';
//         messageElement.style.color = 'red';
//     }
// });

const logOut = document.querySelector('.choixParametre[data-page="page-gestion-compte-6"]');
logOut.addEventListener('click', function () {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');

    window.location.href = '../html/index.html';
})

// appel API back pour modifier compte utilisateur 

document.getElementById('userBtn').addEventListener('click', async (e) => {
  e.preventDefault();

  const oldEmail = document.getElementById('email').value.trim(); // ancien email (celui actuel)
  const nouveauEmail = document.getElementById('nouveauEmail').value.trim();
  const confirmEmail = document.getElementById('confirmEmail').value.trim();

  const userData = {
    nom: document.getElementById('nom').value.trim(),
    prenom: document.getElementById('prenom').value.trim(),
    dateDeNaissance: document.getElementById('dateDeNaissance').value, 
    email: nouveauEmail
  };

  // Vérification des emails
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
    } else if (response.status === 404) {
      alert("Erreur : utilisateur introuvable (email actuel incorrect).");
    } 
  } catch (error) {
    console.error("Erreur de connexion:", error);
    alert("Erreur de connexion au serveur.");
  }
});

// Active le bouton œil pour tous les inputs avec data-target
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

      // Bascule l’icône (Font Awesome)
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  })();