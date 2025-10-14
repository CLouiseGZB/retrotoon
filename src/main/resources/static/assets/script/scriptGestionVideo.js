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
    console.log("Données envoyées :", JSON.stringify(videoData));
    try {
        const response = await fetch('http://localhost:8080/videos/uploadVideo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });

        const result = await response.text();

        if (response.ok && result === 'success') {
            alert("Vidéo ajouté !");
            window.location.href = 'gestionVideos.html';
        } else {
            alert("Erreur d'ajout : " + result);
        }

    } catch (error) {
        console.error("Erreur d'ajout:", error);
        alert("Erreur d'ajout au serveur.");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("videos-container");

  try {
    const response = await fetch("/videos/all");
    if (!response.ok) throw new Error("Erreur lors du chargement des vidéos");

    const videos = await response.json();
    console.log("Vidéos récupérées :", videos);

    if (videos.length === 0) {
      container.innerHTML = "<p>Aucune vidéo disponible.</p>";
      return;
    }

    videos.forEach(video => {
      const card = document.createElement("div");
      card.className = "video-card";

      card.innerHTML = `
        <h3>${video.titre}</h3>
        <p><strong>Description :</strong> ${video.description}</p>
        <p><strong>Catégorie :</strong> ${video.categorie}</p>
        <a href="${video.url}" target="_blank">🔗 Voir la vidéo</a>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erreur :", error);
    container.innerHTML = "<p>Erreur de chargement des vidéos.</p>";
  }
});
