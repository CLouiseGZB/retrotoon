//NAV BAR LOUISIANE
// **sous menu
document.addEventListener('DOMContentLoaded', () => {
    const accountToggle = document.getElementById('accountToggle');
    const accountSubMenu = document.getElementById('accountSubMenu');

    accountToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Empêche le lien de naviguer
        accountSubMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        // Cacher le sous-menu si on clique en dehors de l'élément ou du sous-menu
        if (!accountToggle.contains(e.target) && !accountSubMenu.contains(e.target)) {
            accountSubMenu.classList.remove('active');
        }
    });
});

// *barre de recherche
document.addEventListener('DOMContentLoaded', () => {
    const searchIcon = document.querySelector('.search-icon');
    const searchBox = document.getElementById('search-box');

    searchIcon.addEventListener('click', () => {
        searchBox.classList.toggle('active'); // Ajoute ou supprime la classe active
        searchBox.focus(); // Focalise la barre de recherche pour permettre la saisie de texte
    });

    searchBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Ajoute ici la logique pour envoyer la recherche, par exemple en soumettant un formulaire
            console.log('Recherche soumise :', searchBox.value);
        }
    });
});

//LECTEUR VIDÉO  MORGANE
//initialisation des valeurs 
const video = document.getElementById('my-video');
const playPauseButton = document.getElementById('play-pause-btn');
const forwardButton = document.getElementById('btn-en-avant');
const rewindButton = document.getElementById('btn-en-arriere');
const progressBar = document.getElementById('progress-bar');
const videoCurrentTime = document.getElementById('current-time');
const videoDuration = document.getElementById('duration-time');
const fullScreenButton = document.getElementById('full-screen');
const muteButton = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const videoContainer = document.getElementById('video-container');
const videoControlsContainer = document.getElementById('video-controls-container');
const titleOnVideoContainer = document.getElementById('title-video-container');
const thumbSlider = document.getElementById('thumb-slider');
const favoriteButton = document.getElementById('favorite-button');
const likeButton = document.getElementById('like-button');
const frame = document.getElementById('frame-video-title-controls');

//fonction pour initialiser le player 
document.addEventListener('DOMContentLoaded', () => {
    playPauseButton.addEventListener('click', playPause);
    progressBar.addEventListener('change', updateProgress);
    video.addEventListener('timeupdate', videoTimeUpdate);
    fullScreenButton.addEventListener('click', openFullScreen);
    muteButton.addEventListener('click', muteUnmute);
    volumeSlider.addEventListener('change', setVolume);
    thumbSlider.addEventListener('input', videoTimeUpdate);
})

/********* RIGHT CONTROLS *********/
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

//BOUTON 10SEC EN AVANT 
forwardButton.addEventListener('click', function () {
    video.currentTime += 10;
});

//BOUTON 10SEC EN ARRIÈRE
rewindButton.addEventListener('click', function () {
    video.currentTime -= 10;
});

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

//TEMPS MIS À JOUR LORS DU CLIC SUR LA BARRE DE PROGRESSION
// progressBar.addEventListener("click", function (e) {
//     let progressWidth = progressBar.clientWidth;
//     let clickedPosition = e.offsetX;
//     let clickedTime = (clickedPosition / progressWidth) * video;
//     video.currentTime = clickedTime;
// })

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

/********* LEFT CONTROLS *********/
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

/* Fonction pour mettre à jour la couleur de la piste */
//   volumeSlider.addEventListener('input', function() {
//     const value = this.value;
//     const max = this.max;
    
//     /* Calculer le pourcentage de la valeur actuelle */
//     const percentage = (value / max) * 100;
    
//     /* Mettre à jour la couleur de la piste en utilisant un dégradé linéaire */
//     this.style.background = `linear-gradient(to right, #4CAF50 ${percentage}%, #ccc ${percentage}%)`;
//   });

// volumeSlider.addEventListener('input', function(){
//     video.volume = volumeSlider.value;
// })


//FRAME QUI CONTIENT LES CONTROLS ET TITRE, EST CACHÉE LORS DU PASSAGE DE LA SOURIS
// videoContainer.addEventListener('mouseover', () => {
//     frame.style.opacity = 1;
// })

// videoContainer.addEventListener('mouseleave', () => {
//     frame.style.opacity = 0;
// })

//FRAME QUI DISPARAIT AU BOUT DE TROIS SECONDES QUAND ON EST PLEIN ÉCRAN
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

// Masquer les contrôles avec un délai lorsque la souris quitte la vidéo
videoContainer.addEventListener('mouseleave', () => {
    clearTimeout(mouseMoveTimeout);
    controlsTimeout = setTimeout(() => {
        frame.style.opacity = 0;
    }, 3000);
});

// Masquer les contrôles avec un délai lorsque la souris quitte le conteneur des contrôles
videoContainer.addEventListener('mouseleave', () => {
    clearTimeout(mouseMoveTimeout);
    controlsTimeout = setTimeout(() => {
        frame.style.opacity = 0;
    }, 3000);
});



/************ FAVORITE AND LIKE SECTION ************/
// BOUTON COEUR
let favorite = false;
favoriteButton.addEventListener('click', () => {
    favorite = !favorite;

    if (favorite) {
        //afficher l'icone "favoris" (coeur plein)
        favoriteButton.innerHTML = '<i class="fa-solid fa-heart"></i>';
        favoriteButton.style = 'color: #EB7A57';
    } else {
        //afficher l'icone "favoris" (coeur vide)
        favoriteButton.innerHTML = '<i class="fa-regular fa-heart"></i>';
        favoriteButton.style = 'color: #FFFAE0';

    }
});

// BOUTON POUCE LEVÉ
let liked = false; // Suivre l'état du "like"
likeButton.addEventListener('click', () => {
    liked = !liked; // Bascule entre like/unlike

    if (liked) {
        // Afficher l'icône "like" (pouce levé plein)
        likeButton.innerHTML = '<i class="fa-solid fa-thumbs-up"></i>';
        likeButton.style = 'color: #EB7A57';
    } else {
        // Afficher l'icône "unlike" (pouce levé vide)
        likeButton.innerHTML = '<i class="fa-regular fa-thumbs-up"></i>';
        likeButton.style = 'color: #FFFAE0';

    }
});

/************ COMMENTAIRES ************/
//envoi des commentaires
const inputUser = document.getElementById('input-user');
const containerGeneralComment = document.getElementById('comment-container')
const submitButton = document.getElementById('submit');
let userCommentRow = document.getElementById('user-comment-row');

/************ AJOUT D'UN COMMENTAIRE A LA BOITE DE COMMENTAIRES + VERIFICATION ************/

function addComment() {

    let comment = document.createElement('p');
    comment.classList.add('commentaire');

    if (inputUser.value.trim() == "" || inputUser.value == null) {
        alert("Laissez un commentaire !");
        return false;
    } else {

        comment.innerHTML = inputUser.value;

        containerGeneralComment.appendChild(userCommentRow);
        containerGeneralComment.appendChild(comment);


        /************ BOUTON QUI SUPPRIME INDIVIDUELLEMENT LES COMMENTAIRES ************/

        let aSupprimer = document.createElement('span');
        aSupprimer.classList.add('btn-a-supprimer');

        aSupprimer.innerHTML = '<i class="fa-solid fa-trash"></i>';

        aSupprimer.style = 'color: #FACA78; font-size: 20px; cursor: pointer; margin-left: 10px;';

        comment.appendChild(aSupprimer);

        aSupprimer.addEventListener("click", function (event) {
            event.stopPropagation();
            userCommentRow.remove();
            comment.remove();
        });
    }
}

submitButton.addEventListener("click", addComment);


