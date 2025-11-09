/****
 * Fonction fetch qui sert a récuperer les utilisateurs
 * et modifier le format du date 
 ****/
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("users-container");

  try {
    const response = await fetch("http://localhost:8080/api/all");
    if (!response.ok) {
      throw new Error("Erreur HTTP : " + response.status);
    }

    const users = await response.json();

    users.forEach(user => {
      const dateFormatee = user.dateDeNaissance
        ? new Date(user.dateDeNaissance).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })
        : "—";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.nom || ""}</td>
        <td>${user.prenom || ""}</td>
        <td>${user.email || ""}</td>
        <td>${dateFormatee}</td>
        <td>Actif</td> <!-- Statut non présent dans ton JSON -->
        <td><input type="checkbox" class="select-user" data-id="${user.email}"></td>
      `;
      container.appendChild(row);
    });

  } catch (error) {
    console.error("Erreur lors du chargement :", error);
    container.innerHTML = '<tr><td colspan="6">Erreur lors du chargement des utilisateurs.</td></tr>';
  }
});