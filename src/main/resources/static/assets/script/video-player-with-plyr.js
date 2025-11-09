/**
 * fonction du lecteur vidéo Plyr(bibliothèque open source)
 * Le sélecteur '#player' fait référence à l'élément vidéo dans le HTML
 * avec une liste des contrôles correspond a une option du lecteur
 */
const player = new Plyr('#player', {
    controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'settings',
        'fullscreen'
    ],
});