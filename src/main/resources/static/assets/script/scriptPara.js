// Fonction pour cacher tous les pages et afficher que la page demandée
function afficherPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    const pageActive = document.getElementById(pageId);
    if (pageActive) {
        pageActive.classList.add('active');
    }
}
//les boutons de retour
document.querySelectorAll('.choixParametre').forEach(element => {
    element.addEventListener('click', () => {
        const targetPage = element.getAttribute('data-page');
        afficherPage(targetPage);
    });
});
document.querySelectorAll('.retourPage').forEach(element => {
    element.addEventListener('click', () => {
        const targetPage = element.getAttribute('data-page');
        afficherPage(targetPage);
    });
});

document.getElementById('saveCodeButton').addEventListener('click', function () {
    const codeInput = document.getElementById('code').value;
    const messageElement = document.getElementById('message');

    // Vérification que le code est composé de quatre chiffres uniquement
    if (/^\d{4}$/.test(codeInput)) {
        // Enregistrer le code parental dans le stockage local (ou toute autre méthode de stockage)
        localStorage.setItem('parentalCode', codeInput);
        messageElement.textContent = 'Code parental enregistré avec succès !';
        messageElement.style.color = 'green';
    } else {
        messageElement.textContent = 'Veuillez entrer un code à 4 chiffres uniquement.';
        messageElement.style.color = 'red';
    }
});

const logOut = document.querySelector('.choixParametre[data-page="page-gestion-compte-6"]');
logOut.addEventListener('click', function () {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');

    window.location.href = '/html/index.html';
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

