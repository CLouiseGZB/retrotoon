// ///////////////////////////nav/////////////////////////////////
//  // **sous menu
 document.addEventListener('DOMContentLoaded', () => {
    const accountToggle = document.getElementById('accountToggle');
    const accountSubMenu = document.getElementById('accountSubMenu');

    accountToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Empêche le lien de naviguer
        accountSubMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        // Cacher le sous-menu si on clique en dehors de l'élément ou du sous-menu
        if (!accountToggle.contains(e.target) && !accountSubMenu.contains(e.target)) {
            accountSubMenu.classList.remove('active');
        }
    });
    
});

// *barre de recherche
document.addEventListener('DOMContentLoaded', () => {
    const searchIcon = document.querySelector('.search-icon');
    const searchBox = document.getElementById('search-box');

    searchIcon.addEventListener('click', () => {
        searchBox.classList.toggle('active'); // Ajoute ou supprime la classe active
        searchBox.focus(); // Focalise la barre de recherche pour permettre la saisie de texte
    });

    searchBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Ajoute ici la logique pour envoyer la recherche, par exemple en soumettant un formulaire
            console.log('Recherche soumise :', searchBox.value);
        }
    });
});

const inscriptionForm = document.getElementById('inscriptionForm');
inscriptionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userData = {
    nom: document.getElementById('nom').value,
    prenom: document.getElementById('prenom').value,
    email: document.getElementById('email').value,
    dateDeNaissance: document.getElementById('dateDeNaissance').value,
    motDePasse: document.getElementById('motDePasse').value
  };

  const confirmPassword = document.getElementById('confirmPassword').value;

  if (userData.motDePasse !== confirmPassword) {
    alert("Les mots de passe ne correspondent pas.");
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const result = await response.text();
    console.log("Réponse backend:", result);

    if (response.ok && result === 'success') {
      alert("Inscription réussie !");
      window.location.href = 'index-client.html';
    } else {
      alert("Erreur d'inscription : " + result);
    }

  } catch (error) {
    console.error("Erreur de connexion:", error);
    alert("Erreur de connexion au serveur.");
  }
});
