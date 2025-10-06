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
}


// API TMDB
const API_KEY = 'abedd43cf8d6083e8a33eafb9cc8b3f4';
const seriesIds = [4622, 1618, 20353, 72377, 2808];

// Sélectionnez l'élément HTML où vous voulez afficher le lien
const linkContainer = document.getElementById('links-container');

// Vérifiez si l'ID 2808 est présent dans le tableau
if (seriesIds.includes(2808)) {
    // Créez un élément de lien (anchor) en HTML
    const link = document.createElement('a');
    link.href = 'fiche-dessin-anime.html'; // Lien vers votre autre page HTML
    link.textContent = '*'; // Texte du lien
    link.style.color = '#001D3D';
    link.target = '_blank'; // Ouvre le lien dans un nouvel onglet (optionnel)

    // Ajoutez le lien au conteneur
    linkContainer.appendChild(link);
}
//Carousel historique
// Gestion du carrousel des séries historiques (flèches désactivées)
document.addEventListener('DOMContentLoaded', function () {
    const seriesContainer = document.getElementById('historique-container');

    const seriesIds = [4622, 1618, 20353, 72377,2808]; 
    const apiUrlBase = `https://api.themoviedb.org/3/tv/`;

    let allSeries = [];
    
    // Fonction pour récupérer les séries sans async/await
    function fetchShows() {
        const seriesPromises = seriesIds.map(id => 
            fetch(`${apiUrlBase}${id}?api_key=${API_KEY}&language=fr-FR`).then(response => response.json())
        );

        // Gérer les promesses une fois toutes terminées
        Promise.all(seriesPromises)
            .then(seriesData => {
                allSeries = seriesData.filter(series => series); 
                showItems(); // Afficher les éléments récupérés
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des séries :', error);
            });
    }
    // Fonction pour afficher les séries dans le conteneur
    function showItems(startIndex = 0) {
        if (!allSeries || allSeries.length === 0) {
            return;
        }

        seriesContainer.innerHTML = ''; 
        const itemsPerView = 5;

        for (let i = startIndex; i < startIndex + itemsPerView && i < allSeries.length; i++) {
            const show = allSeries[i];
            const item = document.createElement('div');
            item.classList.add('item');
            item.style.backgroundImage = show.backdrop_path
                ? `url(https://image.tmdb.org/t/p/w500${show.backdrop_path})`
                : 'url(https://via.placeholder.com/500x300?text=No+Image)';

            const bodyItem = document.createElement('div');
            bodyItem.classList.add('body-item');

            const bodyItem1 = document.createElement('div');
            bodyItem1.classList.add('body-item-1');
            bodyItem1.innerHTML = `<div class="play"><i class="fa-solid fa-play"></i></div>`;

            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('content-wrapper');

            const title = document.createElement('div');
            title.classList.add('title', 'body-item-2');
            title.textContent = show.name;

            const properties = document.createElement('div');
            properties.classList.add('properties', 'body-item-3');
            const genreNames = show.genres.map(genre => genre.name || 'Inconnu').join(', ');

            const match = show.vote_average ? `${Math.round(show.vote_average * 10)}% Match` : 'N/A';
            const ageLimit = show.adult ? '18+' : '13+';
            const timeOrSeasons = `${show.number_of_seasons || 'N/A'} saisons`;

            properties.innerHTML = `
                <span class="match">${match}</span>
                <span class="year">${show.first_air_date ? show.first_air_date.split('-')[0] : 'N/A'}</span>
                <span class="age-limit">${ageLimit}</span>
                <span class="time">${timeOrSeasons}</span>
                <span class="genres">${genreNames}</span>
            `;

            contentWrapper.appendChild(title);
            contentWrapper.appendChild(properties);
            bodyItem.appendChild(bodyItem1);
            bodyItem.appendChild(contentWrapper);
            item.appendChild(bodyItem);
            seriesContainer.appendChild(item);
        }
    }

    // Ne pas initialiser de carrousel pour historique (flèches désactivées)
    fetchShows(); // Récupération des séries
});

// Gestion du carrousel des films (avec flèches activées)
document.addEventListener('DOMContentLoaded', function () {
    const animationFilmsContainer = document.getElementById('animation-films-container');
    const genreMap = {
        16: 'Animation',
        35: 'Comédie',
        10751: 'Famille',
        28: 'Action',
        12: 'Aventure',
    };

    const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&with_genres=16&release_date.gte=1970-01-01&release_date.lte=2010-12-31`;
    let allMovies = [];

    // Fonction pour récupérer les films d'animation
    function fetchAnimationFilms() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                allMovies = data.results;
                initializeCarouselAnimation();
                showAnimationItems(); // Afficher les éléments initiaux ici
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des films :', error);
            });
    }

    // Fonction pour afficher les films dans le conteneur
    function showAnimationItems(startIndex = 0) {
        animationFilmsContainer.classList.add('hidden'); // Ajouter une classe pour masquer

        // Réinitialiser le conteneur après une petite durée pour l'animation
        setTimeout(() => {
            animationFilmsContainer.innerHTML = ''; // Réinitialiser le conteneur
            const itemsPerView = 6;

            for (let i = startIndex; i < startIndex + itemsPerView && i < allMovies.length; i++) {
                const film = allMovies[i];
                const item = document.createElement('div');
                item.classList.add('animation-item');
                item.style.backgroundImage = film.poster_path
                    ? `url(https://image.tmdb.org/t/p/w500${film.poster_path})`
                    : 'url(https://via.placeholder.com/500x750?text=No+Image)';

                // Créer le contenu
                const bodyItem = document.createElement('div');
                bodyItem.classList.add('animation-body-item');

                const bodyItem1 = document.createElement('div');
                bodyItem1.classList.add('animation-body-item-1');
                bodyItem1.innerHTML = `<div class="play"><i class="fa-solid fa-play"></i></div>`;

                const contentWrapper = document.createElement('div');
                contentWrapper.classList.add('animation-content-wrapper');

                const title = document.createElement('div');
                title.classList.add('animation-title');
                title.textContent = film.title;

                const properties = document.createElement('div');
                properties.classList.add('animation-properties');
                const genreNames = film.genre_ids.map(id => genreMap[id] || '').join(', ');
                const match = film.vote_average ? `${Math.round(film.vote_average * 10)}% Match` : 'N/A';
                const releaseYear = film.release_date ? film.release_date.split('-')[0] : 'N/A';
                const ageLimit = film.adult ? '18+' : '13+';

                properties.innerHTML = `
                    <span class="match">${match}</span>
                    <span class="year">${releaseYear}</span>
                    <span class="age-limit">${ageLimit}</span>
                    <span class="genres">${genreNames}</span>
                `;

                contentWrapper.appendChild(title);
                contentWrapper.appendChild(properties);
                bodyItem.appendChild(bodyItem1);
                bodyItem.appendChild(contentWrapper);
                item.appendChild(bodyItem);
                animationFilmsContainer.appendChild(item);
            }

            animationFilmsContainer.classList.remove('hidden'); // Retirer la classe cachée
        }, 300); // Délai pour correspondre à la durée de la transition
    }

    fetchAnimationFilms();

    function initializeCarouselAnimation() {
        const prevButton = document.querySelector('.arrow-left-animation');
        const nextButton = document.querySelector('.arrow-right-animation');

        if (!prevButton || !nextButton) {
            return; // Si les boutons ne sont pas trouvés, ne pas continuer
        }

        let currentIndex = 0;
        const itemsPerView = 6;

        function showCurrentItems() {
            showAnimationItems(currentIndex);
        }

        nextButton.addEventListener('click', () => {
            if (currentIndex + itemsPerView < allMovies.length) {
                currentIndex += itemsPerView;
            } else {
                currentIndex = 0; // Revenir au début
            }
            showCurrentItems();
        });

        prevButton.addEventListener('click', () => {
            if (currentIndex - itemsPerView >= 0) {
                currentIndex -= itemsPerView;
            } else {
                currentIndex = Math.floor((allMovies.length - 1) / itemsPerView) * itemsPerView; // Retourner à la dernière page complète
            }
            showCurrentItems();
        });

        showCurrentItems(); // Afficher les éléments initiaux
    }
});

// Carrousel séries
document.addEventListener('DOMContentLoaded', function () {
    const seriesContainer = document.getElementById('series-container');

    const genreMap = {
        16: 'Animation',
        35: 'Comédie',
        10759: 'Action & Adventure',
        18: 'Drame',
        10765: 'Science-Fiction & Fantastique',
    };

    const apiUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&with_genres=16&first_air_date.gte=1970-01-01&first_air_date.lte=2010-12-31`;

    let allSeries = []; // Tableau pour stocker toutes les séries récupérées
    let currentIndex = 0; // Index courant pour le carrousel
    const itemsPerView = 5; // Nombre d'éléments à afficher

    // Fonction pour récupérer les séries
    function fetchShows() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                allSeries = data.results; // Stocke les séries récupérées
                initializeCarousel(); // Initialise le carrousel après récupération
                showCurrentItems(); // Affiche les premières séries
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des séries :', error);
            });
    }

    // Fonction pour afficher les séries dans le conteneur
    function showCurrentItems() {
        seriesContainer.innerHTML = ''; // Efface le conteneur avant d'ajouter de nouveaux éléments

        // Affiche les séries à partir de l'index courant
        for (let i = currentIndex; i < currentIndex + itemsPerView && i < allSeries.length; i++) {
            const show = allSeries[i];
            const item = document.createElement('div');
            item.classList.add('item');

            // Configure l'image de fond
            item.style.backgroundImage = show.backdrop_path
                ? `url(https://image.tmdb.org/t/p/w500${show.backdrop_path})`
                : 'url(https://via.placeholder.com/500x300?text=No+Image)';

            // Élément de contenu
            const bodyItem = document.createElement('div');
            bodyItem.classList.add('body-item');

            // Élément de corps 1 avec icône de lecture
            const bodyItem1 = document.createElement('div');
            bodyItem1.classList.add('body-item-1');
            bodyItem1.innerHTML = `<div class="play"><i class="fa-solid fa-play"></i></div>`;

            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('content-wrapper');

            // Titre de la série
            const title = document.createElement('div');
            title.classList.add('title', 'body-item-2');
            title.textContent = show.name;

            // Propriétés de la série
            const properties = document.createElement('div');
            properties.classList.add('properties', 'body-item-3');

            const genreNames = show.genre_ids.map(id => genreMap[id] || 'Inconnu').join(', ');
            const match = show.vote_average ? `${Math.round(show.vote_average * 10)}% Match` : 'N/A';
            const ageLimit = show.age_rating || '13+';
            const timeOrSeasons = show.runtime && show.runtime.length > 0 && show.runtime[0] > 0
                ? `${Math.floor(show.runtime[0] / 60)}h ${show.runtime[0] % 60}m`
                : `${show.number_of_seasons} saisons`;

            properties.innerHTML = `
                <span class="match">${match}</span>
                <span class="year">${show.first_air_date ? show.first_air_date.split('-')[0] : 'N/A'}</span>
                <span class="age-limit">${ageLimit}</span>
                <span class="time">${timeOrSeasons}</span>
                <span class="genres">${genreNames}</span>
            `;

            // Ajout du titre et des propriétés dans le content-wrapper
            contentWrapper.appendChild(title);
            contentWrapper.appendChild(properties);

            // Ajouter les éléments au body-item
            bodyItem.appendChild(bodyItem1);
            bodyItem.appendChild(contentWrapper);
            item.appendChild(bodyItem);

            // Ajouter l'élément à la série
            seriesContainer.appendChild(item);
        }
    }

    // Fonction pour initialiser le carrousel
    function initializeCarousel() {
        const prevButton = document.querySelector('.arrow-left-series');
        const nextButton = document.querySelector('.arrow-right-series');

        if (!prevButton || !nextButton) {
            return; // Si les boutons ne sont pas trouvés, ne pas continuer
        }

        nextButton.addEventListener('click', () => {
            // Incrémente l'index courant tout en s'assurant qu'il ne dépasse pas le nombre total de séries
            if (currentIndex + itemsPerView < allSeries.length) {
                currentIndex += itemsPerView;
            } else {
                currentIndex = 0; // Revenir au début
            }
            showCurrentItems(); // Met à jour l'affichage
        });

        prevButton.addEventListener('click', () => {
            // Décrémente l'index courant tout en s'assurant qu'il ne devient pas négatif
            if (currentIndex - itemsPerView >= 0) {
                currentIndex -= itemsPerView;
            } else {
                currentIndex = Math.floor((allSeries.length - 1) / itemsPerView) * itemsPerView; // Retourner à la dernière page complète
            }
            showCurrentItems(); // Met à jour l'affichage
        });

        showCurrentItems(); // Afficher les éléments initiaux
    }

    fetchShows(); // Appeler la fonction pour récupérer les séries
});











