/****
 * Fonction fetch app route
 * du formulaire d'inscription
 ****/
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

  const DDN = new Date(userData.dateDeNaissance);
  const now = new Date();
  const age = now.getFullYear() - DDN.getFullYear();
  const mois = now.getMonth() - DDN.getMonth();
  const jour = now.getDate() - DDN.getDate();

  const moins13 = age < 13 || (age === 13 && (mois < 0 || (mois === 0 && jour < 0)));

  if (moins13) {
    alert("Vous devez avoir au moins 13 ans pour vous inscrire.");
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

/****
 * Fonction pour l'icone d'afficher le mot de passe
 ****/
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
