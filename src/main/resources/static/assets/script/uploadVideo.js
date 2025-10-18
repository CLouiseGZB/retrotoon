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