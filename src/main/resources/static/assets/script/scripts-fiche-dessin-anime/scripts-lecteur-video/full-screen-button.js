const fullScreenButton = document.getElementById('full-screen');
const videoContainer = document.getElementById('video-container');


// VIDEO EN PLEIN ECRAN OU EN PETIT ECRAN: 
function openFullScreen() {
  if (fullScreenButton.innerHTML == '<i class="fa-solid fa-expand"></i>') {
      if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
      } else if (videoContainer.webkitRequestFullscreen) { /*Pour Safari*/
          videoContainer.webkitRequestFullscreen();
      } else if (videoContainer.msRequestFullscreen) { /*Pour internet explorer*/
          videoContainer.msRequestFullscreen();
      }
      fullScreenButton.innerHTML = '<i class="fa-solid fa-compress"></i>';
  }
  else if (fullScreenButton.innerHTML == '<i class="fa-solid fa-compress"></i>') {
      if (document.exitFullscreen) {
          document.exitFullscreen();
      } else if (document.webkitExitFullscren) {
          document.webkitExitFullscren();
      } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
      }
      fullScreenButton.innerHTML = '<i class="fa-solid fa-expand"></i>';
  }
}

//fonction pour initialiser le player 
document.addEventListener('DOMContentLoaded', () => {
  fullScreenButton.addEventListener('click', openFullScreen);
});