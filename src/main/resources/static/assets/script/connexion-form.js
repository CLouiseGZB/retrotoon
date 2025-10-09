// function sendLoginForm() {
//   const formulaire = document.getElementById("loginForm");
//   const champs = formulaire.elements;
//   const data = {};
//   for (const champ of champs) {
//     data[champ.name] = champ.value;
//   }

//   fetch('/api/login', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data)
//   })
//     .then(response => response.json())
//     .then(data => {
//       if (data.token) {
//         if (readCookie('auth-token-vod') == null) {
//           createCookie('auth-token-vod', data.token, 2);
//         }
//         console.log('on change de page ')
//         window.location.href = "/private/accueil";
//       }
//       else if (data.status == 404) {
//         alert("pas d'utilisateur avec ce couple identifiant / mot de passe");
//       }
//     })
//     .catch(error => console.error('err : ' + error));
// }
const form = document.getElementById('loginForm');
// const errorMessage = document.getElementById('error');

form.addEventListener('submit', async (e) => {
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

//+ d'infos sur les cookies en javascript : https://www.quirksmode.org/js/cookies.html
// function createCookie(name, value, days) {
//   if (days) {
//     var date = new Date();
//     date.setTime(date.getTime() + (days2460601000));
//     var expires = "; expires=" + date.toGMTString();
//   }
//   else var expires = "";
//   document.cookie = name + "=" + value + expires + "; path=/";
// }

// function readCookie(name) {
//   var nameEQ = name + "=";
//   var ca = document.cookie.split(';');
//   for (var i = 0; i < ca.length; i++) {
//     var c = ca[i];
//     while (c.charAt(0) == ' ') c = c.substring(1, c.length);
//     if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
//   }
//   return null;
// }

// function eraseCookie(name) {
//   createCookie(name, "", -1);
// }

// document.getElementById("loginForm").addEventListener("submit", function(e){
//     e.preventDefault();
//     const user = {
//         email: document.getElementById("email").value,
//         password: document.getElementById("loginPassword").value
//     };
//     fetch("http://localhost:8080/api/login", {
//         method: "POST",
//         headers: {"content-Type": "application/json"},
//         body: JSON.stringify(user)
//     })
// });