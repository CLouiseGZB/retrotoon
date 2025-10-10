const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const response = await fetch('http://localhost:8080/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse: password })
    });

    if (response.ok) {
      const text = await response.text();
      if (text === 'success') {
        window.location.href = 'index-client.html';
      } else {
        errorMessage.textContent = "Erreur inattendue.";
      }
    } else {
      errorMessage.textContent = "Email ou mot de passe incorrect.";
    }

  } catch (err) {
    errorMessage.textContent = "Erreur de connexion au serveur.";
    console.error(err);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('inscriptionForm');

  form.addEventListener('submit', async (e) => {
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
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.text();
      console.log("Réponse backend:", result);

      if (response.ok && result === 'success') {
        alert("Inscription réussie !");
        window.location.href = '/index-client.html'; // redirection ici
      } else {
        alert("Erreur d'inscription : " + result);
      }

    } catch (error) {
      console.error("Erreur de connexion:", error);
      alert("Erreur de connexion au serveur.");
    }
  });
});

