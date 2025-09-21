const muteButton = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');

//MUTE ET UNMUTE
function muteUnmute() {
  if (video.muted) {
      video.muted = false;
      muteButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>'; /*= volume activé */

  } else {
      video.muted = true;
      muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; /* = volume coupé*/

  }
}

//REGLAGE DU VOLUME
function setVolume() {
  video.volume = volumeSlider.value / 100;

  if (volumeSlider.value == 0) {
      video.muted = true; // Mute si le volume est à zéro
      muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; /*= unmute*/
  } else if (volumeSlider.value > 0 && volumeSlider.value < 50) {
      video.muted = false; // Unmute si le volume est supérieur à zéro
      muteButton.innerHTML = '<i class="fa-solid fa-volume-low"></i>'; /*= mute*/
  } else {
      muteButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  }

}

//fonction pour initialiser le player 
document.addEventListener('DOMContentLoaded', () => {
  muteButton.addEventListener('click', muteUnmute);
  volumeSlider.addEventListener('change', setVolume);
})