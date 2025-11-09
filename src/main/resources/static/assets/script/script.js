// ***********API TMDB Pages séries**************//

document.addEventListener('DOMContentLoaded', () => {
  const containerSeries = document.getElementById('series');
  if (!containerSeries) {
    console.error('Le conteneur des séries (div#series) est introuvable.');
    return;
  }

  let selectedGenre = '';
  let selectedAnnee = '';
  let currentPage = 1;
  let totalPages = 1;

  const currentPageElem = document.getElementById('current-page');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const filterAllButton = document.getElementById('filter-all');
  const filterGenreSelect = document.getElementById('filter-genre');
  const filterAnneeSelect = document.getElementById('filter-annees');


  /**** Fonction pour la gestion des séries récuperer via l'API
   * Ajout du filtre de genre et d’année si défini
   * Appel de l'API avec fetch
   * Traitement des données récupérées
   * Transformation des résultats pour affichage
   * Affichage des séries et mise à jour de la pagination
  ****/

  async function fetchSeries(page = 1) {
    const base = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=fr`;
    const url = new URL(base);

    if (selectedGenre) {
      url.searchParams.set('with_genres', `16,${selectedGenre}`);
    } else {
      url.searchParams.set('with_genres', '16');
    }

    if (selectedAnnee) {
      const [startYear, endYear] = selectedAnnee.split(',');
      url.searchParams.set('first_air_date.gte', startYear);
      url.searchParams.set('first_air_date.lte', endYear);
    } else {
      url.searchParams.set('first_air_date.gte', '1970-01-01');
      url.searchParams.set('first_air_date.lte', '2010-12-31');
    }

    url.searchParams.set('page', page);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Erreur lors de la récupération des données');
    const data = await res.json();

    totalPages = data.total_pages;
    currentPage = page;

    const seriesList = data.results.map(serie => ({
      title: serie.name,
      year: serie.first_air_date ? serie.first_air_date.split('-')[0] : 'Année inconnue',
      affiche: serie.poster_path
        ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=Image+non+disponible',
      popularity: serie.popularity,
      tmdbId: serie.id
    }));

    displaySeries(seriesList);
    updatePagination();
  }



  /**** Fonction pour afficher les séries dans le conteneur
   * Trie par popularité décroissante
   * Vide le conteneur avant d'ajouter les nouvelles cartes
   * Création et ajout des cartes HTML pour chaque série
  ****/
  function displaySeries(series) {
    const sorted = [...series].sort((a, b) => b.popularity - a.popularity);
    containerSeries.innerHTML = '';
    sorted.forEach(serie => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <img src="${serie.affiche}" alt="${serie.title}">
        <div>
          <p>${serie.title}</p>
          <p>${serie.year}</p>
        </div>`;
      containerSeries.appendChild(card);
    });
  }

  function updatePagination() {
    if (currentPageElem && prevPageButton && nextPageButton) {
      currentPageElem.textContent = `Page ${currentPage}`;
      prevPageButton.disabled = currentPage === 1;
      nextPageButton.disabled = currentPage === totalPages;
    }
  }

  filterAllButton?.addEventListener('click', () => {
    selectedGenre = '';
    selectedAnnee = '';
    currentPage = 1;
    fetchSeries(currentPage).catch(console.error);
  });

  filterGenreSelect?.addEventListener('change', e => {
    selectedGenre = e.target.value;
    currentPage = 1;
    fetchSeries(currentPage).catch(console.error);
  });

  filterAnneeSelect?.addEventListener('change', e => {
    selectedAnnee = e.target.value;
    currentPage = 1;
    fetchSeries(currentPage).catch(console.error);
  });

  prevPageButton?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchSeries(currentPage).catch(console.error);
    }
  });

  nextPageButton?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchSeries(currentPage).catch(console.error);
    }
  });

  fetchSeries(currentPage).catch(err => {
    console.error(err);
    containerSeries.innerHTML = '<p>Erreur lors de la récupération des séries.</p>';
  });
});



// ***********API TMDB Pages film**************//
/****
  * Fonction pour afficher les films
  * avec du filtrage
****/
document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = 'abedd43cf8d6083e8a33eafb9cc8b3f4';

  let selectedGenreFilm = '';
  let selectedAnneeFilm = '';
  let currentPageFilm = 1;
  let totalPagesFilm = 1;

  const containerFilms = document.getElementById('films');
  const apiUrlBaseFilms = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=16&primary_release_date.gte=1970-01-01&primary_release_date.lte=2010-12-31&language=fr`;

  function fetchFilms(page = 1) {
    let apiUrl = `${apiUrlBaseFilms}&page=${page}`;

    if (selectedGenreFilm) {
      apiUrl += `&with_genres=16,${selectedGenreFilm}`;
    }

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

        console.log(filmsList);
        displayFilms(filmsList);
        updatePaginationFilm();
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des films:', error);
        containerFilms.innerHTML = '<p>Erreur lors de la récupération des films.</p>';
      });
  }

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

  function updatePaginationFilm() {
    document.getElementById('current-page-films').textContent = `Page ${currentPageFilm}`;
    document.getElementById('prev-page-films').disabled = currentPageFilm === 1;
    document.getElementById('next-page-films').disabled = currentPageFilm === totalPagesFilm;
  }

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
  fetchFilms(currentPageFilm);
});