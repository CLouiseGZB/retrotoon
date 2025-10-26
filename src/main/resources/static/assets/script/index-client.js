// Bouton mute video
function toggleMute() {
    const video = document.querySelector('#player video');
    const muteButton = document.querySelector('.mute-button');

    if (video.muted) {
        video.muted = false;
        muteButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>'; // volume activé
    } else {
        video.muted = true;
        muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; // volume coupé
    }

    // Si besoin, relance la lecture quand on remet le son (certains navigateurs pausent)
    if (!video.muted && video.paused) {
        video.play().catch(() => {});
    }
}










