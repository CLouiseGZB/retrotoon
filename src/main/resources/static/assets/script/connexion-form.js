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



