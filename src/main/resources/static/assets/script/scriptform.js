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

// oeil mot de passe
document.querySelectorAll('.input-with-eye').forEach(wrap => {
  const input = wrap.querySelector('input[type="password"], input[type="text"]'); // le champ
  const btn   = wrap.querySelector('.icon-btn');
  const icon  = btn?.querySelector('i');
  if (!input || !btn) return;

  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    if (icon) icon.className = show ? 'fi fi-rs-crossed-eye' : 'fi fi-rr-eye';
  });
});
