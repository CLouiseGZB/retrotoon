// ***********API TMDB**************
// Clé API pour accéder à l'API de The Movie Database (TMDB)
const API_KEY = 'abedd43cf8d6083e8a33eafb9cc8b3f4';

// ***********************Pages séries
let selectedGenre = '';  // Genre secondaire sélectionné
let selectedAnnee = '';   // Plage d'années sélectionnée
let currentPage = 1;      // Page actuelle
let totalPages = 1;       // Nombre total de pages

const containerSeries = document.getElementById('series');

// URL de base pour récupérer les séries d'animation
const apiUrlBase = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&first_air_date.gte=1970-01-01&first_air_date.lte=2010-12-31&language=fr`;

// Fonction pour récupérer les séries avec les filtres sélectionnés
function fetchSeries(page = 1) {
    let apiUrl = `${apiUrlBase}&page=${page}`;

    // Ajouter le genre sélectionné s'il existe (exclut les genres non-animation)
    if (selectedGenre) {
        apiUrl += `&with_genres=16,${selectedGenre}`; // Genre d'animation + genre secondaire
    }

    // Ajouter les filtres d'année
    if (selectedAnnee) {
        const [startYear, endYear] = selectedAnnee.split(',');
        apiUrl += `&first_air_date.gte=${startYear}&first_air_date.lte=${endYear}`;
    }

    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données');
            }
            return response.json();
        })
        .then(data => {
            // Mettre à jour le nombre total de pages
            totalPages = data.total_pages;
            currentPage = page; // Mettre à jour la page actuelle

            const seriesList = data.results.map(serie => ({
                title: serie.name,
                year: serie.first_air_date ? serie.first_air_date.split('-')[0] : 'Année inconnue',
                affiche: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : 'https://via.placeholder.com/500x750?text=Image+non+disponible',
                popularity: serie.popularity,
                tmdbId: serie.id
            }));

            // Afficher les cartes des séries
            displaySeries(seriesList);

            // Mettre à jour l'affichage de la pagination
            updatePagination();
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des séries:', error);
            containerSeries.innerHTML = '<p>Erreur lors de la récupération des séries.</p>';
        });
}

// Fonction pour afficher les séries
function displaySeries(series) {
    // Trier les séries par popularité (décroissant)
    const sortedSeries = series.sort((a, b) => b.popularity - a.popularity);

    // Afficher les cartes des séries
    containerSeries.innerHTML = ''; // Vider le conteneur avant d'ajouter les nouvelles cartes
    sortedSeries.forEach(serie => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <img src="${serie.affiche}" alt="${serie.title}">
            <div>
                <p>${serie.title}</p>
                <p>${serie.year}</p>
            </div>
        `;
        containerSeries.appendChild(card);
    });
}

// Mettre à jour l'affichage de la pagination
document.addEventListener('DOMContentLoaded', () => {
    let selectedGenre = '';
    let selectedAnnee = '';
    let currentPage = 1;
    let totalPages = 1;

    const containerSeries = document.getElementById('series');

    if (!containerSeries) {
        console.error('Le conteneur des séries (div#series) est introuvable.');
        return;
    }

    // Fonction pour récupérer et afficher les séries
    function fetchSeries(page = 1) {
        const apiUrlBase = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&first_air_date.gte=1970-01-01&first_air_date.lte=2010-12-31&language=fr`;
        let apiUrl = `${apiUrlBase}&page=${page}`;

        if (selectedGenre) {
            apiUrl += `&with_genres=16,${selectedGenre}`;
        }

        if (selectedAnnee) {
            const [startYear, endYear] = selectedAnnee.split(',');
            apiUrl += `&first_air_date.gte=${startYear}&first_air_date.lte=${endYear}`;
        }

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                totalPages = data.total_pages;
                currentPage = page;
                const seriesList = data.results.map(serie => ({
                    title: serie.name,
                    year: serie.first_air_date ? serie.first_air_date.split('-')[0] : 'Année inconnue',
                    affiche: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : 'https://via.placeholder.com/500x750?text=Image+non+disponible',
                    popularity: serie.popularity,
                    tmdbId: serie.id
                }));
                displaySeries(seriesList);
                updatePagination();
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des séries:', error);
                containerSeries.innerHTML = '<p>Erreur lors de la récupération des séries.</p>';
            });
    }

    function displaySeries(series) {
        containerSeries.innerHTML = '';
        series.forEach(serie => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <img src="${serie.affiche}" alt="${serie.title}">
                <div>
                    <p>${serie.title}</p>
                    <p>${serie.year}</p>
                </div>
            `;
            containerSeries.appendChild(card);
        });
    }

    function updatePagination() {
        const currentPageElem = document.getElementById('current-page');
        const prevPageButton = document.getElementById('prev-page');
        const nextPageButton = document.getElementById('next-page');

        if (currentPageElem && prevPageButton && nextPageButton) {
            currentPageElem.textContent = `Page ${currentPage}`;
            prevPageButton.disabled = currentPage === 1;
            nextPageButton.disabled = currentPage === totalPages;
        }
    }

    const filterAllButton = document.getElementById('filter-all');
    const filterGenreSelect = document.getElementById('filter-genre');
    const filterAnneeSelect = document.getElementById('filter-annees');

    if (filterAllButton) {
        filterAllButton.addEventListener('click', () => {
            selectedGenre = '';
            selectedAnnee = '';
            currentPage = 1;
            fetchSeries(currentPage);
        });
    }

    if (filterGenreSelect) {
        filterGenreSelect.addEventListener('change', event => {
            selectedGenre = event.target.value;
            currentPage = 1;
            fetchSeries(currentPage);
        });
    }

    if (filterAnneeSelect) {
        filterAnneeSelect.addEventListener('change', event => {
            selectedAnnee = event.target.value;
            currentPage = 1;
            fetchSeries(currentPage);
        });
    }

    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');

    if (prevPageButton) {
        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchSeries(currentPage);
            }
        });
    }

    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchSeries(currentPage);
            }
        });
    }

    // Charger les séries au démarrage
    fetchSeries(currentPage);
});




// **********Page films****************


// Variables pour les films
document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'abedd43cf8d6083e8a33eafb9cc8b3f4';

    // Variables pour les films
    let selectedGenreFilm = '';
    let selectedAnneeFilm = '';
    let currentPageFilm = 1;
    let totalPagesFilm = 1;

    const containerFilms = document.getElementById('films');

    // URL de base pour récupérer les films d'animation
    const apiUrlBaseFilms = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=16&primary_release_date.gte=1970-01-01&primary_release_date.lte=2010-12-31&language=fr`;

    // Fonction pour récupérer les films avec les filtres sélectionnés
    function fetchFilms(page = 1) {
        let apiUrl = `${apiUrlBaseFilms}&page=${page}`;

        // Ajouter le genre sélectionné s'il existe (exclut les genres non-animation)
        if (selectedGenreFilm) {
            apiUrl += `&with_genres=16,${selectedGenreFilm}`;
        }

        // Ajouter les filtres d'année
        if (selectedAnneeFilm) {
            const [startYear, endYear] = selectedAnneeFilm.split(',');
            apiUrl += `&primary_release_date.gte=${startYear}&primary_release_date.lte=${endYear}`;
        }

        return fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des données');
                }
                return response.json();
            })
            .then(data => {
                totalPagesFilm = data.total_pages;
                currentPageFilm = page;

                const filmsList = data.results.map(film => ({
                    title: film.title,
                    year: film.release_date ? film.release_date.split('-')[0] : 'Année inconnue',
                    affiche: film.poster_path ? `https://image.tmdb.org/t/p/w500${film.poster_path}` : 'https://via.placeholder.com/500x750?text=Image+non+disponible',
                    popularity: film.popularity,
                    tmdbId: film.id
                }));

                console.log(filmsList); // Affichez les données de films dans la console
                displayFilms(filmsList);
                updatePaginationFilm();
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des films:', error);
                containerFilms.innerHTML = '<p>Erreur lors de la récupération des films.</p>';
            });
    }

    // Fonction pour afficher les films
    function displayFilms(films) {
        const sortedFilms = films.sort((a, b) => b.popularity - a.popularity);
        containerFilms.innerHTML = '';
        sortedFilms.forEach(film => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                    <img src="${film.affiche}" alt="${film.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/500x750?text=Image+non+disponible'">
                    <div>
                        <p>${film.title}</p>
                        <p>${film.year}</p>
                    </div>
                `;
            containerFilms.appendChild(card);
        });
    }

    // Mettre à jour l'affichage de la pagination pour les films
    function updatePaginationFilm() {
        document.getElementById('current-page-films').textContent = `Page ${currentPageFilm}`;
        document.getElementById('prev-page-films').disabled = currentPageFilm === 1;
        document.getElementById('next-page-films').disabled = currentPageFilm === totalPagesFilm;
    }

    // Événements pour les filtres des films
    document.getElementById('filter-all-films').addEventListener('click', () => {
        selectedGenreFilm = '';
        selectedAnneeFilm = '';
        currentPageFilm = 1;
        fetchFilms(currentPageFilm);
    });

    document.getElementById('filter-genre-films').addEventListener('change', (event) => {
        selectedGenreFilm = event.target.value;
        currentPageFilm = 1;
        fetchFilms(currentPageFilm);
    });

    document.getElementById('filter-annees-films').addEventListener('change', (event) => {
        selectedAnneeFilm = event.target.value;
        currentPageFilm = 1;
        fetchFilms(currentPageFilm);
    });

    // Événements pour la pagination des films
    document.getElementById('prev-page-films').addEventListener('click', () => {
        if (currentPageFilm > 1) {
            currentPageFilm--;
            fetchFilms(currentPageFilm);
        }
    });

    document.getElementById('next-page-films').addEventListener('click', () => {
        if (currentPageFilm < totalPagesFilm) {
            currentPageFilm++;
            fetchFilms(currentPageFilm);
        }
    });

    // Appeler la fonction pour charger et afficher les films d'animation au chargement de la page
    fetchFilms(currentPageFilm);
});

// Filtre barre de recherche avec tmdb
const form = document.getElementById('searchForm');
const input = document.getElementById('search-box'); // Petite barre de recherche
const largeSearchBox = document.getElementById('large-search-box');
const results = document.getElementById('results');
const filterAllButton = document.getElementById('filter-all');
const filterAnimationButton = document.getElementById('filter-animation');
const filterMoviesButton = document.getElementById('filter-movies');
const largeSearchButton = document.getElementById('large-search-button'); // Nouveau bouton de recherche pour la grande barre

let _imageBaseUrl, _imageSizes;
let filterType = 'all'; // Type de filtre par défaut

// Obtenez les configurations d'image au chargement de la page
fetch(`https://api.themoviedb.org/3/configuration?api_key=${API_KEY}`)
  .then(response => response.json())
  .then(data => {
    _imageBaseUrl = data.images.base_url;
    _imageSizes = data.images.poster_sizes;
  })
  .catch(error => console.error('Erreur lors de la récupération des configurations :', error));

  document.addEventListener('DOMContentLoaded', () => {
    const query = new URLSearchParams(window.location.search).get('query');
    const filter = new URLSearchParams(window.location.search).get('filter') || 'all'; // Par défaut 'all'

    if (query) {
        search(query, filter);
    }
});

// Fonction pour effectuer une recherche
function search(query) {
    if (query) {
        results.innerHTML = ''; // Nettoyer les résultats précédents
        searchMovies(query);
        searchTVShows(query);
    }
}

// Fonction pour rechercher les films
function searchMovies(query) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR&include_adult=false`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (filterType === 'movies' || filterType === 'all') {
                showMovies(data.results);
            }
        })
        .catch(error => console.error('Erreur lors de la recherche de films :', error));
}

// Fonction pour rechercher les séries TV
function searchTVShows(query) {
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR&include_adult=false`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (filterType === 'animation' || filterType === 'all') {
                showTVShows(data.results);
            }
        })
        .catch(error => console.error('Erreur lors de la recherche de séries :', error));
}

// Afficher les films en fonction du filtre
function showMovies(movies) {
    let filteredMovies = movies.filter(movie => movie.genre_ids.includes(16)); // Genre 16 est Animation

    // Filtrer les films en fonction de l'année
    filteredMovies = filteredMovies.filter(movie => {
        const releaseYear = new Date(movie.release_date).getFullYear();
        return releaseYear >= 1970 && releaseYear <= 2010;
    });

    // Afficher les films en fonction du filtre
    if (filterType === 'movies') {
        results.innerHTML = buildResultsHeader('Films', filteredMovies.length);
        results.innerHTML += filteredMovies.map(buildMovieElement).join('');
    } else if (filterType === 'all') {
        results.innerHTML += filteredMovies.map(buildMovieElement).join('');
    }
}

// Afficher les séries TV en fonction du filtre
function showTVShows(tvShows) {
    let filteredTVShows = tvShows.filter(show => show.genre_ids.includes(16)); // Genre 16 est Animation

    // Filtrer les séries TV en fonction de l'année
    filteredTVShows = filteredTVShows.filter(show => {
        const firstAirYear = new Date(show.first_air_date).getFullYear();
        return firstAirYear >= 1970 && firstAirYear <= 2010;
    });

    // Afficher les séries TV en fonction du filtre
    if (filterType === 'animation') {
        results.innerHTML = buildResultsHeader('Animation', filteredTVShows.length);
        results.innerHTML += filteredTVShows.map(buildTVShowElement).join('');
    } else if (filterType === 'all') {
        results.innerHTML += filteredTVShows.map(buildTVShowElement).join('');
    }
}

// Construire l'en-tête des résultats
function buildResultsHeader(type, count) {
    let headerText = `${count} résultats pour "${type}"`;
    return `
        <div class="results-header">
            <h2>${headerText}</h2>
        </div>
    `;
}

// Construire un élément pour un film
// Fonction pour construire un élément de film
// Fonction pour construire un élément de film
function buildMovieElement(movie) {
    const posterPath = movie.poster_path ? getMoviePoster(movie.poster_path) : 'https://via.placeholder.com/200x300?text=No+Image';
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Année inconnue';

    return `<div class="card">
        <img src="${posterPath}" alt="${movie.title}">
        <div>
            <p>${movie.title}</p>
            <p>${releaseYear}</p>
        </div>
    </div>`;
}

// Fonction pour construire un élément de série TV
function buildTVShowElement(tvShow) {
    const posterPath = tvShow.poster_path ? getMoviePoster(tvShow.poster_path) : 'https://via.placeholder.com/200x300?text=No+Image';
    const firstAirYear = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'Année inconnue';

    return `<div class="card">
        <img src="${posterPath}" alt="${tvShow.name}">
        <div>
            <p>${tvShow.name}</p>
            <p>${firstAirYear}</p>
        </div>
    </div>`;
}


// Fonction utilitaire pour obtenir l'URL complète de l'affiche
function getMoviePoster(posterPath) {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
}


// Construire l'URL de l'image du film
function getMoviePoster(imagePath) {
    if (!_imageBaseUrl || !_imageSizes || _imageSizes.length === 0) {
        return 'https://via.placeholder.com/200x300?text=No+Image';
    }
    return `${_imageBaseUrl}${_imageSizes[2]}${imagePath}`; // Utiliser la taille d'image par défaut
}


// Charger les résultats basés sur la requête URL
function loadResults() {
    const query = getQueryParam('query');
    if (query) {
        search(query);
    }
}




