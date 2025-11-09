/****
 * Fonction appel API TMDB
 * Rechercher la série "Totally Spies" par son nom et afficher avec ses détails
****/
const apiKey = 'abedd43cf8d6083e8a33eafb9cc8b3f4';
const query = 'Totally Spies';
const synopsisElement = document.getElementById('synopsis');
const genresElement = document.getElementById('genres');
const yearElement = document.getElementById('year');
const runtimeElement = document.getElementById('runtime');
const seasonsElement = document.getElementById('seasons');
const loadingElement = document.getElementById('loading');

fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=fr-FR`)
  .then(response => response.json())
  .then(data => {
    if (data.results && data.results.length > 0) {
      const seriesId = data.results[0].id;

      fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${apiKey}&language=fr-FR`)
        .then(response => response.json())
        .then(seriesDetails => {

          loadingElement.style.display = 'none';
          synopsisElement.textContent = seriesDetails.overview || "Aucun synopsis disponible.";
          const genres = seriesDetails.genres.map(genre => genre.name).join(', ');
          genresElement.textContent = genres || "Genres non disponibles.";
          yearElement.textContent = seriesDetails.first_air_date ? seriesDetails.first_air_date.split('-')[0] : "Année non disponible.";
          const runtime = seriesDetails.episode_run_time.length > 0 ? `${seriesDetails.episode_run_time[0]} minutes` : "Durée non disponible.";
          runtimeElement.textContent = runtime;
          seasonsElement.textContent = seriesDetails.number_of_seasons || "Nombre de saisons non disponible.";
        })
        .catch(error => {
          loadingElement.textContent = "Erreur lors de la récupération des détails de la série.";
          console.error('Erreur lors de la récupération des détails de la série:', error);
        });
    } else {
      loadingElement.textContent = "Aucune série trouvée avec ce nom.";
    }
  })
  .catch(error => {
    loadingElement.textContent = "Erreur lors de la recherche.";
    console.error('Erreur lors de la recherche:', error);
  });
