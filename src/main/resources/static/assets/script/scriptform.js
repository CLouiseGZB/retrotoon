/****
 * Fonction fetch app route du formulaire d'inscription
 ****/
const inscriptionForm = document.getElementById('inscriptionForm');

inscriptionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userData = {
    nom: document.getElementById('nom').value,
    prenom: document.getElementById('prenom').value,
    email: document.getElementById('email').value,
    dateDeNaissance: document.getElementById('dateDeNaissance').value,
    motDePasse: document.getElementById('motDePasse').value
  };

  const confirmPassword = document.getElementById('confirmPassword').value;

  /****
  * Vérification confirmation
  ****/
  if (userData.motDePasse !== confirmPassword) {
    alert("Les mots de passe ne correspondent pas.");
    return;
  }

  /**** 
   * Vérification de la force du mot de passe 
  ****/
  const pw = userData.motDePasse;
  const hasUpper   = /[A-Z]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const hasLength  = pw.length >= 12;

  if (!hasUpper || !hasSpecial || !hasLength) {
    alert("Le mot de passe ne respecte pas les conditions.");
    return;
  }

  /**** 
   * Vérification âge minimum 13 ans et empêche les dates futures
  ****/
  const DDN = new Date(userData.dateDeNaissance);
  const now = new Date();

  if (isNaN(DDN.getTime())) {
    alert("Veuillez renseigner une date de naissance valide.");
    return;
  }
  if (DDN > now) {
    alert("La date de naissance ne peut pas être dans le futur.");
    return;
  }

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
 * Fonction pour l'icone d'affichage du mot de passe
 ****/
document.querySelectorAll('.input-with-eye').forEach(wrap => {
  const input = wrap.querySelector('input[type="password"], input[type="text"]');
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


/****
 * Conditions mot de passe (majuscule, caractère spécial, 12+)
 * Aide dynamique sous le champ mot de passe
 ****/
const pwInput = document.getElementById('motDePasse');
const pwHelp  = document.getElementById('password-help');

const spanUpper   = pwHelp?.querySelector('[data-upper]');
const spanSpecial = pwHelp?.querySelector('[data-special]');
const spanLength  = pwHelp?.querySelector('[data-length]');

function updatePasswordHelp() {
  if (!pwInput || !pwHelp) return;
  const pw = pwInput.value;

  const hasUpper   = /[A-Z]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const hasLength  = pw.length >= 12;

  if (spanUpper)   spanUpper.style.color   = hasUpper   ? 'green' : 'red';
  if (spanSpecial) spanSpecial.style.color = hasSpecial ? 'green' : 'red';
  if (spanLength)  spanLength.style.color  = hasLength  ? 'green' : 'red';
}

pwInput?.addEventListener('input', updatePasswordHelp);
updatePasswordHelp();


/****
 * Bloque la sélection de dates futures dans le calendrier (au chargement), utilise la date locale pour éviter le décalage UTC
 ****/
(function lockFutureDates(){
  const dateInput = document.getElementById('dateDeNaissance');
  if (!dateInput) return;

  const todayLocal = new Date();
  const yyyy = todayLocal.getFullYear();
  const mm = String(todayLocal.getMonth() + 1).padStart(2, '0');
  const dd = String(todayLocal.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  dateInput.setAttribute('max', todayStr);
})();
