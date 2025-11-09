/**
 * 1- Initialisation du lecteur vidéo Plyr
 * Le sélecteur '#player' fait référence à l'élément vidéo dans le HTML
 * Plyr est une bibliothèque open source. 
 * Il permet d'ajouter facilement un lecteur HTML5 stylisé avec des contrôles intuitifs sans devoir tout coder à la main 
 */
const player = new Plyr('#player', {
    /**
     * 2-Liste des contrôles visibles dans le lecteur
     * Chaque élément de ce tableau correspond à un bouton ou une option du lecteur
     * Par exemple : 
     */
    controls: [
        'play-large', // Gros bouton de lecteure au centre de la vidéo
        'play', // Bouton Lecture/Pause dans la barre de contrôle
        'progress', // Barre de porgression de la vidéo
        'current-time', // Temps écoulé
        'mute', // Bouton Mute/Unmute
        'volume', // Contrôle du volume
        'settings', // Menu de réglages (qualité, vitesse, etc)
        'fullscreen' // Bouton pour passer en mode plein écran
    ],
});