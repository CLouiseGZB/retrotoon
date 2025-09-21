const forwardButton = document.getElementById('btn-en-avant');
const rewindButton = document.getElementById('btn-en-arriere');
const videoCurrentTime = document.getElementById('current-time');

//BOUTON 10SEC EN AVANT 
forwardButton.addEventListener('click', function () {
  video.currentTime += 10;
});

//BOUTON 10SEC EN ARRIÈRE
rewindButton.addEventListener('click', function () {
  video.currentTime -= 10;
});