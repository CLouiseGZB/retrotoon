function sendLoginForm() {
  const formulaire = document.getElementById("loginForm");
  const champs = formulaire.elements;
  const data = {};
  for (const champ of champs) {
    data[champ.name] = champ.value;
  }

  fetch('/public/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        if (readCookie('auth-token-vod') == null) {
          createCookie('auth-token-vod', data.token, 2);
        }
        console.log('on change de page ')
        window.location.href = "/private/accueil";
      }
      else if (data.status == 404) {
        alert("pas d'utilisateur avec ce couple identifiant / mot de passe");
      }
    })
    .catch(error => console.error('err : ' + error));
}

//+ d'infos sur les cookies en javascript : https://www.quirksmode.org/js/cookies.html
function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days2460601000));
    var expires = "; expires=" + date.toGMTString();
  }
  else var expires = "";
  document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name, "", -1);
}