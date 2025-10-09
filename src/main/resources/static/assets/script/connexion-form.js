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

const form = document.getElementById('inscriptionForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nom = document.getElementById('nom').value;
    const prenom = document.getElementById('prenom').value;
    const email = document.getElementById('email').value;
    const dateDeNaissance = document.getElementById('dateDeNaissance').value;
    const motDePasse = document.getElementById('motDePasse').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms').checked;

    if (!termsAccepted) {
      alert("Veuillez accepter les conditions d’utilisation.");
      return;
    }

    if (motDePasse !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    const userData = {
      nom,
      prenom,
      email,
      dateDeNaissance,
      motDePasse
    };

    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const text = await response.text();
        if (text === 'success' || text.includes('index-client')) {
          // Redirection si succès
          window.location.href = 'index-client.html';
        } else {
          alert("Inscription réussie !");
        }
      } else if (response.status === 409) {
        alert("Cet email est déjà utilisé.");
      } else {
        alert("Erreur lors de l’inscription. Réessayez plus tard.");
      }

    } catch (error) {
      console.error(error);
      alert("Erreur de connexion au serveur.");
    }
  });