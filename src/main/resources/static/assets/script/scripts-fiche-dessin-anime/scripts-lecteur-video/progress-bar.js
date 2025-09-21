const progressBar = document.getElementById('progress-bar');
const videoDuration = document.getElementById('duration-time');
const thumbSlider = document.getElementById('thumb-slider');

//BARRE DE PROGRESSION
function videoTimeUpdate() {
  if (video.duration) {
    //calculer le pourcentage de progression
    let newTime = (video.currentTime / video.duration) * 100;

    //mettre a jour la barre de progression et le slider
    progressBar.style.width = newTime + '%';
    thumbSlider.value = newTime;

    //CURRENT PLAY TIME : on calcule le temps de la vidéo ici
    let currentMinutes = Math.floor(video.currentTime / 60);
    let currentSeconds = Math.floor(video.currentTime - currentMinutes * 60);
    let durationMinutes = Math.floor(video.duration / 60);
    let durationSeconds = Math.floor(video.duration - durationMinutes * 60);
    if (currentSeconds < 10) { currentSeconds = `0${currentSeconds}`; }
    if (durationSeconds < 10) { durationSeconds = `0${durationSeconds}`; }
    if (currentMinutes < 10) { currentMinutes = `0${currentMinutes}`; }
    if (durationMinutes < 10) { durationMinutes = `0${durationMinutes}`; }

    videoCurrentTime.innerHTML = currentMinutes + " : " + currentSeconds;
    videoDuration.innerHTML = durationMinutes + " : " + durationSeconds;
  }
}

//MISE À JOUR DU TEMPS ÉCOULÉ SUR LA VIDÉO
function updateProgress() {
  const progressPercentage = video.duration * (progressBar.value / 100);
  video.currentTime = progressPercentage;
  console.log(video.duration);
  console.log(progressBar.value);
}


// Permet de cliquer sur la barre pour changer l'avancement de la vidéo
progressBar.addEventListener('input', () => {
  const seekTime = (progressBar.value / 100) * video.duration;
  video.currentTime = seekTime;
});

// Permet de cliquer n'importe où sur la barre et déplacer le thumb slider
progressBar.addEventListener('click', (e) => {
  const totalWidth = progressBar.clientWidth;  // Largeur totale du slider
  const clickX = e.offsetX;  // Position du clic par rapport à l'input
  const percent = (clickX / totalWidth) * 100;  // Calcul du pourcentage cliqué

  // Ajuste la valeur du slider et de la vidéo en fonction du clic
  progressBar.value = percent;
  const seekTime = (percent / 100) * video.duration;
  video.currentTime = seekTime;
});

//fonction pour initialiser le player 
document.addEventListener('DOMContentLoaded', () => {
  progressBar.addEventListener('change', updateProgress);
  video.addEventListener('timeupdate', videoTimeUpdate);
  thumbSlider.addEventListener('input', videoTimeUpdate);
});