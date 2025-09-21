const frame = document.getElementById('frame-video-title-controls');

//FRAME QUI CONTIENT LES CONTROLS ET TITRE, EST CACHÉE LORS DU PASSAGE DE LA SOURIS
videoContainer.addEventListener('mouseover', () => {
  frame.style.opacity = 1;
})

videoContainer.addEventListener('mouseleave', () => {
  frame.style.opacity = 0;
})

// FRAME QUI DISPARAIT AU BOUT DE TROIS SECONDES QUAND ON EST PLEIN ÉCRAN
let controlsTimeout;
let mouseMoveTimeout;
// Afficher les contrôles lorsque la souris bouge sur la vidéo
videoContainer.addEventListener('mousemove', () => {
  clearTimeout(controlsTimeout);
  clearTimeout(mouseMoveTimeout);

  frame.style.opacity = 1; // Afficher les contrôles

  // Cacher les contrôles si la souris ne bouge plus après 2 secondes
  mouseMoveTimeout = setTimeout(() => {
      frame.style.opacity = 0;
  }, 3000);
});