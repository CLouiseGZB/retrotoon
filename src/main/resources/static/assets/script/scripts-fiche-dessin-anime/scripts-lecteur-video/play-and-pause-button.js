const video = document.getElementById('my-video');
const playPauseButton = document.getElementById('play-pause-btn');

//BOUTON PAUSE ET PLAY 
function playPause() {
  if (video.paused) {
    video.play();
    playPauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    video.pause();
    playPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

//fonction pour initialiser le player 
document.addEventListener('DOMContentLoaded', () => {
  playPauseButton.addEventListener('click', playPause);
});