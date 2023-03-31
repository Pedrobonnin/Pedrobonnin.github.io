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
  console.log("recomendadas",movies)
  movies.sort((a, b) => b.vote_average - a.vote_average); // ordenar por calificación descendente
  return movies.slice(0, 4)      // devolver las 4 películas con la calificación más alta
  .map(movie => ({
    ...movie,
    backdrop_path: `${IMAGE_BASE_URL}original${movie.backdrop_path}`,
    backdrop_path_small: `${IMAGE_BASE_URL}w500${movie.backdrop_path}`
  }));
  }

homeButton.addEventListener('click', async () => {
  const movies = await fetchHighestRatedMovies('trending/movie/week');
  const slider = document.querySelector('.slider ul');
  slider.innerHTML = movies.map(movie =>  `
  <li>
    <picture>
      <source srcset="${movie.backdrop_path_small}" alt="${movie.title}" media="(max-width:768px)"></source>
      <img src="${movie.backdrop_path}" alt="${movie.title}">
    </picture>
  </li>`)
  .join('');
  fetchMovies('trending/movie/week');
});


recommendedButton.addEventListener('click', async () => {
  const movies = await fetchHighestRatedMovies('movie/top_rated');
  const slider = document.querySelector('.slider ul');
  slider.innerHTML = movies.map(movie => `
  <li>
    <picture>
      <source srcset="${movie.backdrop_path_small}" alt="${movie.title}" media="(max-width:768px)"></source>
      <img src="${movie.backdrop_path}" alt="${movie.title}">
    </picture>
  </li>`)
  .join('');
  fetchMovies('movie/top_rated');
});

popularButton.addEventListener('click', async () => {
  const movies = await fetchHighestRatedMovies('movie/popular');
  const slider = document.querySelector('.slider ul');
  slider.innerHTML = movies.map(movie => `
    <li>
      <picture>
        <source srcset="${movie.backdrop_path_small}" alt="${movie.title}" media="(max-width:768px)"></source>
        <img src="${movie.backdrop_path}" alt="${movie.title}">
      </picture>
    </li>`)
    .join('');
  fetchMovies('movie/popular');
});

upcomingButton.addEventListener('click', async () => {
  const movies = await fetchHighestRatedMovies('movie/upcoming');
  const slider = document.querySelector('.slider ul');
  slider.innerHTML = movies.map(movie => `
  <li>
    <picture>
      <source srcset="${movie.backdrop_path_small}" alt="${movie.title}" media="(max-width:768px)"></source>
      <img src="${movie.backdrop_path}" alt="${movie.title}">
    </picture>
  </li>`)
  .join('');
  fetchMovies('movie/upcoming');
});

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

 async function displayMovie(movies, moreLinkListener=true ){
 	 	let moviesWithLogo=[];
	 	for(const movie of movies ) {

	 		const logoUrl = await fetchMovieLogo(movie.id);
	 		              			 		 
	 		movie.logoUrl =	logoUrl
	       moviesWithLogo.push({ ...movie })	   
	     } 
	    movieContainer.innerHTML=moviesWithLogo.map(
        ({ poster_path: urlImg,title,id,overview,runtime, logoUrl},_)=>`
          <article class="movie">
              <img src="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}">
                <div class="movie-info">
                      ${logoUrl ?`<img class="movie-logo"src=${logoUrl}>`: `<h2>${title}</h2>`}
                        <p class="overview">${overview.slice(0, 150)}... 
                            <span data-movie-id="${id}"
                                    class=${moreLinkListener?'more': 'remove'} >Más
                            </span>
                        </p>
                    ${ runtime ? `<p>Duración: ${runtime} minutos</p>` : ''}
              </div>               
          </article>`
          ).join('');
       moreLinkListener && addMoreLinkListeners(movies);
 }
  
 function addMoreLinkListeners(movies) {
  const moreLinks = document.querySelectorAll('.more');
  moreLinks.forEach((link, index) => {
  link.removeEventListener('click', showFullOverview);
  link.addEventListener('click', showFullOverview);
    });
      function showFullOverview(event) {
      const movieId = event.target.dataset.movieId;
      const movie = movies.find(m => m.id == movieId);
      if (movie) {
      event.target.parentElement.textContent = movie.overview;
      }
    }
  }
 
  fetchMovies('trending/movie/week');