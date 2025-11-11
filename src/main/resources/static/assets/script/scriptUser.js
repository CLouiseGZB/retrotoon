  document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/user/prenom")
      .then(response => {
        if (!response.ok) throw new Error("Non connecté");
        return response.text();
      })
      .then(prenom => {
        const span = document.getElementById("smUserName");
        if (span) {
          span.textContent = prenom;
        }
      })
      .catch(error => {
        console.warn("Utilisateur non connecté ou erreur API :", error);
      });
  });