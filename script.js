const API_KEY = '6511c938195c56067e1386df779c2be0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const homeButton = document.getElementById('home');
const recommendedButton = document.getElementById('top_rated');
const popularButton = document.getElementById('popular');
const upcomingButton = document.getElementById('upcoming');
const searchInput = document.getElementById('search');
const movieContainer = document.getElementById('movieContainer');

homeButton.addEventListener('click', () => fetchMovies('trending/movie/week'));
recommendedButton.addEventListener('click', () => fetchMovies('movie/top_rated'));
popularButton.addEventListener("click", () => fetchMovies("movie/popular"));
upcomingButton.addEventListener("click", () => fetchMovies("movie/upcoming"));


//----variables----//
searchInput.addEventListener("input", (event) =>
  searchMovies(event.target.value)
);

let currentPage;
let totalPages;
let currentEndpoint;
let isLoading;

//---carruzel---//
async function fetchHighestRatedMovies(section) {
  const response = await fetch(`${BASE_URL}/${section}?api_key=${API_KEY}&language=es-ES&page=1`);
  const data = await response.json();
  const movies = data.results;
  console.log("recomendadas", movies);
  movies.sort((a, b) => b.vote_average - a.vote_average); // ordenar por calificación descendente
  return movies.slice(0, 4) // devolver las 4 películas con la calificación más alta
    .map(movie => ({
      ...movie,
      backdrop_path: `${IMAGE_BASE_URL}original${movie.backdrop_path}`,
      backdrop_path_small: `${IMAGE_BASE_URL}w500${movie.backdrop_path}`
    }));
}

function updateSlider(movies) {
  const slider = document.querySelector('.slider ul');
  slider.innerHTML = movies.map(movie => `
    <li>
      <picture>
        <source srcset="${movie.backdrop_path_small}" alt="${movie.title}" media="(max-width:768px)"></source>
        <img src="${movie.backdrop_path}" alt="${movie.title}">
      </picture>
    </li>`)
    .join('');
}

async function handleButtonClick(section) {
  const movies = await fetchHighestRatedMovies(section);
  updateSlider(movies);
  fetchMovies(section);
}

homeButton.addEventListener('click', () => handleButtonClick('trending/movie/week'));
recommendedButton.addEventListener('click', () => handleButtonClick('movie/top_rated'));
popularButton.addEventListener('click', () => handleButtonClick('movie/popular'));
upcomingButton.addEventListener('click', () => handleButtonClick('movie/upcoming'));
//---------------//

async function fetchMoreMovies(endpoint) {
  if (isLoading || currentPage >= totalPages) return;

  isLoading = true;
  currentPage++;

  const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=es-ES&page=${currentPage}`);
  const data    	= await response.json();

  loaded_movies.push(...data.results);
  displayMovie( loaded_movies )

  isLoading=false; //Esto debería estar dentro del handler 
}

window.addEventListener("scroll", () => {
	const isAtBottom=
    window.innerHeight + window.scrollY 
    >= document.body.offsetHeight;

	if (isAtBottom){
		fetchMoreMovies(currentEndpoint);
    }
});

async function fetchMovies(endpoint) {
  isLoading = true;
  currentEndpoint = endpoint;
	currentPage=1; //inicializar la página
	
	const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=es-ES&page=${currentPage}`);
	const data  	  	  = await response.json();
	totalPages=data.total_pages;
	
	loaded_movies=[...data.results];
	displayMovie( loaded_movies )

	isLoading=false; 
}

async function searchMovies(query) {
  if (query.length > 2) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=es-ES`);
    const data    	= await response.json();

    displayMovie(data.results)
   }
 }

async function fetchMovieLogo(movieId) {
const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${API_KEY}`);
const data 	     			= await response.json();
if (!Array.isArray(data.logos)) {
return null;
}
const logoImage 			= data.logos[0];
return logoImage ? `${IMAGE_BASE_URL}w500${logoImage.file_path}` : null;
}

async function displayMovie(movies, moreLinkListener = true) {
  let moviesWithLogo = [];
  for (const movie of movies) {
    const logoUrl = await fetchMovieLogo(movie.id);
    movie.logoUrl = logoUrl;
    moviesWithLogo.push({ ...movie });
  }
  movieContainer.innerHTML = moviesWithLogo
    .map(
      ({ poster_path: urlImg, title, id, overview, runtime, logoUrl }, _) => `
      <article class="movie" data-movie-id="${id}">
        <img src="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}">
        <div class="movie-info" >
        ${logoUrl ? `<img class="movie-logo"src=${logoUrl}>` : `<h2>${title}</h2>`}
        <p class="overview">${overview.slice(0, 150)}...<span data-movie-id="${id}" class=${moreLinkListener ? 'more' : 'remove'}>Más</span></p>
        ${runtime ? `<p>Duración: ${runtime} minutos</p>` : ''}
        </div>
      </article>`
    )
    .join('');

  if (moreLinkListener) {
    addMoreLinkListeners(movies);
  }

  // Mueve este bloque de código dentro de la función displayMovie
  const movieElements = document.querySelectorAll('.movie');
  movieElements.forEach((movieElement) => {
    movieElement.addEventListener('click', function () {
      const movieId = this.dataset.movieId;
      const url = `movie.html?id=${movieId}`;
      window.location.href = url;
    });
  });
}

//consume los datos de la pelicula selecionada
async function fetchMovieDetails(movieId) {
  const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=es-AR`);
  const data = await response.json();
  console.log(data)
  return data;
}
//recore los datos de la pelicula y los muestra en el html
async function displayMovieDetails(movieId) {
  const movieDetails = await fetchMovieDetails(movieId);
  
  // Verificar si se proporciona la propiedad 'images' en la respuesta de la API
  if (!movieDetails.images) {
    // Si no se proporciona, hacer una llamada adicional a la API para obtener las imágenes
    movieDetails.images = await fetchMovieImages(movieId);
  }
  
  const { poster_path: urlImg, backdrop_path: urlBackdrop, title, overview, runtime, genres, images } = movieDetails;

  const genresNames = genres.map((genre) => genre.name).join(', ');
  const movieContainer = document.getElementById('movie-telon');

  // Verificar la existencia de la propiedad 'backdrops' en 'images'
  if (images.backdrops || images.backdrops.length < 1) {
    // Arreglo de las primeras 5 imágenes de backdrop
    const backdrops = images.backdrops.slice(0, 5).map(backdrop => `${IMAGE_BASE_URL}original${backdrop.file_path}`);
    
    // Crear elementos de imagen ocultos para pre-cargar las imágenes de fondo
    const backdropImages = backdrops.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
    
    // Esperar a que todas las imágenes se hayan cargado antes de mostrar el telón
    await Promise.all(backdropImages.map(img => img.decode()));
    
    movieContainer.innerHTML = `
      <div class="movie-container">
        <div class="poster-container">
          <picture>
            <source srcset="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}" media="(max-width:768px)"></source>
            <img class="imgPoster" src="${IMAGE_BASE_URL}original${urlImg}" alt="${title}">
          </picture>
        </div>
        <div class="metadata-container">
          <h1>${title}</h1>
          <section>
            <p>${overview}</p>
            <p>Duración: ${runtime} minutos</p>
            <p>Géneros: ${genresNames}</p>
          </section>
        </div>
      </div>
    `;
    
    const backdropContainer = document.createElement('div');
    backdropContainer.id = 'backdrop';
    backdropContainer.style.backgroundImage = `url(${backdrops[0]})`;
 
    document.body.appendChild(backdropContainer);
    // Verificar si hay suficientes imágenes de fondo para rotar
    rotateBackdrops(backdrops, 20); 
  }
}

async function fetchMovieImages(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function rotateBackdrops(backdrops, duration) {
  
  let index = 0;
  document.getElementById('backdrop').style.backgroundImage = `url(${backdrops[index]})`;
  setInterval(() => {
    index = (index + 1) % backdrops.length;
    document.getElementById('backdrop').style.backgroundImage = `url(${backdrops[index]})`;
  }, duration * 1000);
}

document.addEventListener('DOMContentLoaded', function () {
  // Aquí puedes llamar a la función displayMovie con los datos de las películas
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');
  displayMovieDetails(movieId);
});



//ecento click en "Mas" caga la sinapcis completa  
function addMoreLinkListeners(movies) {
const moreLinks = document.querySelectorAll('.more');
moreLinks.forEach((link, index) => {
link.removeEventListener('click', showFullOverview);
link.addEventListener('click', showFullOverview);
  });
    function showFullOverview(event) {
    event.stopPropagation(); // evita el evento de direccionamiento al presionar sobre "Mas"
    const movieId = event.target.dataset.movieId;
    const movie = movies.find(m => m.id == movieId);
    if (movie) {
    event.target.parentElement.textContent = movie.overview;
    }
  }
}

fetchMovies('trending/movie/week');