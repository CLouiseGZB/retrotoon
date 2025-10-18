/****
 * Fonction fetch qui sert a ajouté les vidéos
 * Modifier le format du date 
 ****/
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("videos-container");

  try {
    const response = await fetch("http://localhost:8080/videos/all");
    const videos = await response.json();

    videos.forEach(video => {
      const dateFormatee = video.dateAjout
        ? new Date(video.dateAjout).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "—";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${video.titre}</td>
        <td>${video.description}</td>
        <td>${video.categorie}</td>
        <td>${dateFormatee}</td>
        <td><a href="${video.url}" target="_blank">Voir</a></td>
        <td><input type="checkbox" class="select-video" data-id="${video.id}"></td>
      `;
      container.appendChild(row);
    });

  } catch (error) {
    console.error("Erreur lors du chargement :", error);
  }
});

const btnSupprimer = document.getElementById("btn-supprimer");

btnSupprimer.addEventListener("click", async () => {
    // Récupère toutes les checkbox cochées
    const checkedBoxes = document.querySelectorAll(".select-video:checked");
    const ids = Array.from(checkedBoxes).map(cb =>cb.dataset.id);

    if (ids.length === 0) {
        alert("Sélectionnez au moins une vidéo !");
        return;
    }

    // Confirmation avant suppression
    if (!confirm(`Voulez-vous vraiment supprimer ${ids.length} vidéo(s) ?`)) return;

    try {
        // Appel fetch vers le backend pour supprimer les vidéos
        const response = await fetch(`http://localhost:8080/videos/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(ids), // envoie un tableau d'id
        });

        if (response.ok) {
            alert("Vidéos supprimées !");
            // Supprime les lignes du tableau côté front
            ids.forEach(id => {
                const row = document.querySelector(`.select-video[data-id="${id}"]`).closest("tr");
                row.remove();
            });
        } else {
            const result = await response.text();
            alert("Erreur lors de la suppression : " + result);
        }

    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        alert("Erreur lors de la suppression au serveur.");
    }
});


/****
 * Fonction fetch qui sert a ajouté les vidéos
 ****/
const uploadVideo = document.getElementById('uploadVideo');
uploadVideo.addEventListener('submit', async (e) => {
  e.preventDefault();

  const categorie = document.querySelector('input[name="categorie"]:checked')?.value;
  if (!categorie) {
    alert("Veuillez sélectionner un type de contenu (Film ou Série).");
    return;
  }
  const videoData = {
    titre: document.getElementById('titreVideo').value,
    description: document.getElementById('description').value,
    url: document.getElementById('urlVideo').value,
    categorie: categorie
  };
  try {
    const response = await fetch('http://localhost:8080/videos/uploadVideo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData)
    });

    if (response.ok) {
      document.getElementById('uploadVideo').reset();
      window.location.href = 'gestionVideos.html';
    } else {
      const result = await response.text();
      alert("Erreur d'ajout : " + result);
    }

  } catch (error) {
    console.error("Erreur d'ajout:", error);
    alert("Erreur d'ajout au serveur.");
  }
});