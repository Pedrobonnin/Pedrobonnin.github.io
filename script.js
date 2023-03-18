const API_KEY = '6511c938195c56067e1386df779c2be0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const homeButton = document.getElementById('home');
const recommendedButton = document.getElementById('recommended');
const popularButton = document.getElementById('popular');
const upcomingButton = document.getElementById('upcoming');
const searchInput = document.getElementById('search');
const movieContainer = document.getElementById('movieContainer');

homeButton.addEventListener('click', () => fetchMovies('trending/movie/week'));
recommendedButton.addEventListener('click', () => fetchMovies('movie/top_rated'));
popularButton.addEventListener('click', () => fetchMovies('movie/popular'));
upcomingButton.addEventListener('click', () => fetchMovies('movie/upcoming'));
searchInput.addEventListener('input', (event) => searchMovies(event.target.value));


let currentPage = 1;
let currentEndpoint = 'trending/movie/week';

document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.movie-container');
  const masonry = new Masonry(container, {
    itemSelector: '.movie',
    columnWidth: '.movie',
    gutter: 20,
    fitWidth: true
  });
});

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    currentPage++;
    fetchMoreMovies(currentEndpoint);
  }
});

function fetchMoreMovies(endpoint) {
  fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=es-ES&page=${currentPage}`)
    .then((response) => response.json())
    .then((data) => displayMoreMovies(data.results));
    
}




  async function displayMoreMovies(movies) {
    for (const movie of movies) {
      const logo = await fetchMovieLogo(movie.id);
      // Aquí puedes usar el logo para mostrarlo en la interfaz de usuario junto con la demás información de la película

      movieContainer.innerHTML += `
      <div class="movie">
      <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}">
      <div class="movie-info">
        ${logo ? `<img  class="movie-logo" src="${logo}" alt="${movie.title}">` : `<h2>${movie.title}</h2>`}
        <p>${movie.overview.slice(0, 150)}...<span class="more">Más</span></p>
        ${movie.runtime ? `<p>Duración: ${movie.runtime} minutos</p>` : ''}
      </div>
    </div>
      `;
    }

    const movieInfo = document.querySelectorAll('.movie-info');

    // Agregar evento click a cada contenedor de película
    movieInfo.forEach(el => {
      el.addEventListener('click', () => {
        // Agregar o quitar la clase 'abierto' cuando se hace clic en el contenedor de la película
        el.classList.toggle('abierto');
      });
    });

    // Agregar un event listener para cada enlace "Más"
    const moreLinks = document.querySelectorAll('.more');

    moreLinks.forEach((link, index) => {
      link.addEventListener('click', () => {
            if (index >= 0 && index < movies.length) {
              // Al hacer clic en el enlace "Más", reemplazar el contenido del párrafo con la sinopsis completa
              link.parentElement.innerHTML = movies[index].overview;
              
        
            }
      });
    });
    
  }
  

homeButton.addEventListener('click', () => {
  currentEndpoint = 'trending/movie/week';
  currentPage = 1;
  fetchMovies(currentEndpoint);
});
recommendedButton.addEventListener('click', () => {
  currentEndpoint = 'movie/top_rated';
  currentPage = 1;
  fetchMovies(currentEndpoint);
});
popularButton.addEventListener('click', () => {
  currentEndpoint = 'movie/popular';
  currentPage = 1;
  fetchMovies(currentEndpoint);
});
upcomingButton.addEventListener('click', () => {
  currentEndpoint = 'movie/upcoming';
  currentPage =1;
fetchMovies(currentEndpoint);
});

function fetchMovies(endpoint) {
    fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=es-ES`)
      .then((response) => response.json())
      .then((data) => displayMovies(data.results));
  }
  
  function searchMovies(query) {
    if (query.length > 2) {
      fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=es-ES`)
        .then((response) => response.json())
        .then((data) => displayMovies(data.results));
    }
  }





  async function fetchMovieLogo(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${API_KEY}`);
    const data = await response.json();
    //console.log(data);
    if (!Array.isArray(data.logos)) {
      return null;
    }
    const logoImage = data.logos[0];
    return logoImage ? `${IMAGE_BASE_URL}${logoImage.file_path}` : null;
  }

  async function displayMovies(movies) {
    console.log(movies)
    const moviesWithLogo = await Promise.all(movies.map(async (movie) => {
      const logoUrl = await fetchMovieLogo(movie.id);
      return { ...movie, logoUrl };
      
    }));
    
    movieContainer.innerHTML = moviesWithLogo.map((movie) => `
    
      <div class="movie">
        <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}">
        <div class="movie-info">
          ${movie.logoUrl ? `<img  class="movie-logo" src="${movie.logoUrl}" alt="${movie.title}">` : `<h2>${movie.title}</h2>`}
          <p class="">${movie.overview.slice(0, 150)}...<span class="more">Más</span></p>
          ${movie.runtime ? `<p>Duración: ${movie.runtime} minutos</p>` : ''}
        </div>
      </div>
    `).join('');

    
    const movieInfo = document.querySelectorAll('.movie-info');

    // Agregar evento click a cada contenedor de película
    movieInfo.forEach(el => {
      el.addEventListener('click', () => {
        // Agregar o quitar la clase 'abierto' cuando se hace clic en el contenedor de la película
        el.classList.toggle('abierto');
      });
    });

    const synopsis = document.querySelectorAll(".movie-synopsis");

synopsis.forEach((elem) => {
  const fullText = elem.textContent;
  const shortText = fullText.substring(0, 150) + "...";
  elem.setAttribute("data-full-text", fullText);
  elem.textContent = shortText;

  let isExpanded = false; // Variable de estado para saber si se ha expandido la sinopsis

  const moreLink = elem.parentElement.querySelector(".movie-more");

  moreLink.addEventListener("click", (event) => {
    event.preventDefault();

    if (isExpanded) {
      elem.textContent = shortText;
      moreLink.textContent = "Mas";
    } else {
      elem.textContent = fullText;
      moreLink.textContent = "Menos";
    }

    isExpanded = !isExpanded;
  });

  elem.addEventListener("mouseleave", () => {
    if (isExpanded) {
      return; // Si se ha expandido la sinopsis, no hacer nada al alejar el cursor
    }

    elem.textContent = shortText;
    moreLink.textContent = "Mas";
  });
});

    // Agregar un event listener para cada enlace "Más"
    const moreLinks = document.querySelectorAll('.more');

    moreLinks.forEach((link, index) => {
      link.addEventListener('click', () => {
            if (index >= 0 && index < movies.length) {
              // Al hacer clic en el enlace "Más", reemplazar el contenido del párrafo con la sinopsis completa
              link.parentElement.innerHTML = movies[index].overview;
              
        
            }
      });
    });
    
    
  }
  

fetchMovies('trending/movie/week');


