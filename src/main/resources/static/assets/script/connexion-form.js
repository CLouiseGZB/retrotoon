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

    const text = await response.text();

    if (response.ok && text === "success") {
      let role = "USER";
      try {
        const localPart = email.split('@')[0] || "";
        if (localPart.toLowerCase().includes('admin')) {
          role = "ADMIN";
        }
      } catch (e) {
        console.warn("Impossible d'extraire la partie locale de l'email :", e);
      }

      localStorage.setItem("email", email);
      localStorage.setItem("role", role);

      if (role === "ADMIN") {
        window.location.href = "dashbordAdmin.html";
      } else {
        window.location.href = "index-client.html";
      }
    } else {
      errorMessage.textContent = "Email ou mot de passe incorrect.";
    }

  } catch (err) {
    console.error("Erreur :", err);
    errorMessage.textContent = "Erreur de connexion au serveur.";
  }
});


// oeil mot de passe
const input = document.getElementById('loginPassword');
const btn = document.getElementById('togglePwd');
const icon = btn.querySelector('i');

btn.addEventListener('click', () => {
  const willShow = input.type === 'password';
  input.type = willShow ? 'text' : 'password';
  btn.setAttribute('aria-pressed', String(willShow));
  btn.setAttribute('aria-label', willShow ? 'Masquer le mot de passe' : 'Afficher le mot de passe');

  // changer l’icône : œil ↔ œil barré
  icon.className = willShow ? 'fi fi-rs-crossed-eye' : 'fi fi-rr-eye';
});