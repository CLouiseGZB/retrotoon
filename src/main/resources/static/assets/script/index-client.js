/****Fonction bouton mute video
 * Avec relance lecture quand on remet le son (certains navigateurs pausent)
****/
function toggleMute() {
    const video = document.querySelector('#player video');
    const muteButton = document.querySelector('.mute-button');

    if (video.muted) {
        video.muted = false;
        muteButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    } else {
        video.muted = true;
        muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    }


    if (!video.muted && video.paused) {
        video.play().catch(() => { });
    }
}










