// *************************barre de recherche
document.addEventListener('DOMContentLoaded', () => {
    const searchIcon = document.querySelector('.search-icon');
    const searchBox = document.getElementById('search-box');
    const filterAllButton = document.getElementById('filter-all');
    const filterAnimationButton = document.getElementById('filter-animation');
    const filterMoviesButton = document.getElementById('filter-movies');
    let filterType = 'all'; // Type de filtre par défaut

    // Bascule la visibilité de la barre de recherche lors du clic sur l'icône
    searchIcon.addEventListener('click', () => {
        searchBox.classList.toggle('active'); // Ajoute ou supprime la classe active
        searchBox.focus(); // Focalise la barre de recherche pour permettre la saisie de texte
    });

    // Gère l'événement "Enter" pour déclencher la recherche avec le filtre actuel
    searchBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Empêche le rechargement de la page
            const searchQuery = searchBox.value.trim(); // Récupère la valeur de la barre de recherche
            if (searchQuery) {
                // Redirige vers la page des résultats avec la requête de recherche et le filtre
                window.location.href = `resultas-barre-de-recherche.html?query=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
            }
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const searchIcon = document.querySelector('.search-icon');
        const searchBox = document.getElementById('search-box');
        const form = document.getElementById('searchForm');
        let filterType = 'all'; // Type de filtre par défaut
    
        // Ajoute un événement au clic sur l'icône de recherche
        searchIcon.addEventListener('click', () => {
            searchBox.classList.toggle('active'); // Ajoute ou supprime la classe active
            searchBox.focus(); // Focalise la barre de recherche pour permettre la saisie de texte
        });
    
        // Gestion de l'événement "keydown" sur la barre de recherche
        searchBox.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const searchQuery = searchBox.value.trim();
                if (searchQuery) {
                    // Redirige vers la page des résultats avec la requête de recherche et le filtre
                    window.location.href = `/html/resultas-barre-de-recherche.html?query=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
                }
            }
        });
    
        // Gestion de la soumission du formulaire
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Empêche le rechargement de la page
            const searchQuery = searchBox.value.trim();
            if (searchQuery) {
                // Redirige vers la page des résultats avec la requête de recherche et le filtre
                window.location.href = `/html/resultas-barre-de-recherche.html?query=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
            }
        });
    });
    

    // Événements de clic sur les boutons de filtre
    filterAllButton.addEventListener('click', () => {
        applyFilter('all');
    });

    filterAnimationButton.addEventListener('click', () => {
        applyFilter('animation');
    });

    filterMoviesButton.addEventListener('click', () => {
        applyFilter('movies');
    });
});



// Événements de soumission et de recherche
    // Gestion des filtres pour la recherche
    function applyFilter(newFilterType) {
        filterType = newFilterType;
        const searchQuery = searchBox.value.trim(); // Récupère la valeur actuelle de la barre de recherche
        if (searchQuery) {
            // Redirige vers la page des résultats avec la requête de recherche et le filtre appliqué
            window.location.href = `/html/resultas-barre-de-recherche.html?query=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
        }
    }


input.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        const searchQuery = input.value.trim();
        search(searchQuery);
    }
});

largeSearchBox.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        const searchQuery = largeSearchBox.value.trim();
        search(searchQuery);
    }
});

largeSearchButton.addEventListener('click', () => {
    const searchQuery = largeSearchBox.value.trim();
    search(searchQuery);
});

// Événements de clic sur les boutons de filtre
filterAllButton.addEventListener('click', () => {
    filterType = 'all';
    const searchQuery = largeSearchBox.value.trim() || input.value.trim();
    search(searchQuery);
});

filterAnimationButton.addEventListener('click', () => {
    filterType = 'animation';
    const searchQuery = largeSearchBox.value.trim() || input.value.trim();
    search(searchQuery);
});

filterMoviesButton.addEventListener('click', () => {
    filterType = 'movies';
    const searchQuery = largeSearchBox.value.trim() || input.value.trim();
    search(searchQuery);
});

// Charger les résultats lorsque la page est chargée
window.addEventListener('load', loadResults);

//***************** petite barre de recherche
document.addEventListener('DOMContentLoaded', () => {
    const searchIcon = document.querySelector('.search-icon');
    const searchBox = document.getElementById('search-box');
    const form = document.getElementById('searchForm');
    let filterType = 'all'; // Type de filtre par défaut

    // Ajoute un événement au clic sur l'icône de recherche
    searchIcon.addEventListener('click', () => {
        searchBox.classList.toggle('active'); // Ajoute ou supprime la classe active
        searchBox.focus(); // Focalise la barre de recherche pour permettre la saisie de texte
    });

    // Gestion de l'événement "keydown" sur la barre de recherche
    searchBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const searchQuery = searchBox.value.trim();
            if (searchQuery) {
                // Redirige vers la page des résultats avec la requête de recherche et le filtre
                window.location.href = `/html/resultas-barre-de-recherche.html?query=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
            }
        }
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Empêche le rechargement de la page
        const searchQuery = searchBox.value.trim();
        if (searchQuery) {
            // Redirige vers la page des résultats avec la requête de recherche et le filtre
            window.location.href = `/html/resultas-barre-de-recherche.html?query=${encodeURIComponent(searchQuery)}&filter=${filterType}`;
        }
    });
});