const API_KEY = '6511c938195c56067e1386df779c2be0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const language = navigator.language;// Obtener el idioma del navegador

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



//animacion de carga

function showLoader() {
  const loader = document.createElement('div');
  loader.classList.add('loader');
  document.body.appendChild(loader);
}

function hideLoader() {
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.remove();
  }
}



// control de cambio de modo
const switchInput = document.querySelector('.switch input');
const modoEstiloLink = document.querySelector('#modo-estilo');

switchInput.addEventListener('change', function() {
  if (this.checked) {
    modoEstiloLink.disabled = false;
  } else {
    modoEstiloLink.disabled = true;
  }
});


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
  
  const response = await fetch(`${BASE_URL}/${section}?api_key=${API_KEY}&language=${language}&page=1`);
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
  const language = navigator.language;// Obtener el idioma del navegador
  const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=${language}&page=${currentPage}`);
  const data    	= await response.json();

  loaded_movies.push(...data.results);
  displayMovie( loaded_movies )

  isLoading=false; //Esto debería estar dentro del handler 
}

window.addEventListener("scroll", () => {
  showLoader()
	const isAtBottom=
    window.innerHeight + window.scrollY 
    >= document.body.offsetHeight;

	if (isAtBottom){
		fetchMoreMovies(currentEndpoint);
    }
  hideLoader()
});

async function fetchMovies(endpoint) {
 
  isLoading = true;
  currentEndpoint = endpoint;
	currentPage=1; //inicializar la página
	
	const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=${language}&page=${currentPage}`);
	const data  	  	  = await response.json();
	totalPages=data.total_pages;
	
	loaded_movies=[...data.results];
	displayMovie( loaded_movies )

	isLoading=false; 
 
}

async function searchMovies(query) {
  if (query.length > 2) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=${language}`);
    const data    	= await response.json();
    displayMovie(data.results)
   }
 }


async function fetchMovieLogo(movieId) {
  const images = await fetchMovieImages(movieId);
  console.log("logos español", images )
  if (!Array.isArray(images.logos)) {
    return null;
  }
  const logoImage = images.logos[0];
  const w500LogoUrl = logoImage ? `${IMAGE_BASE_URL}w500${logoImage.file_path}` : null;
  const originalLogoUrl = logoImage ? `${IMAGE_BASE_URL}original${logoImage.file_path}` : null;
  return { w500LogoUrl, originalLogoUrl };
}



async function displayMovie(movies, moreLinkListener = true) {
  showLoader(); // Muestra la animación de carga
  let moviesWithLogo = [];
  for (const movie of movies) {
    const logoUrl = await fetchMovieLogo(movie.id);
    const w500LogoUrl = logoUrl.w500LogoUrl;
    movie.logoUrl =  w500LogoUrl;
    moviesWithLogo.push({ ...movie });
  }
  movieContainer.innerHTML = moviesWithLogo
    .map(
      ({ poster_path: urlImg, title, id, overview, runtime, logoUrl }, _) => `
      <article class="movie" >
        <img src="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}">
        <div class="movie-info" data-movie-id="${id}">
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
  // Obtener todos los elementos .movie
  const moviess = document.querySelectorAll('.movie');

  // Iterar sobre cada elemento .movie y agregar el evento
  moviess.forEach((movie) => {
    // Verificar si el dispositivo es móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    let clickedOnce = false;
    // Agregar evento de clic en el elemento .movie
    movie.addEventListener('click', function () {
      const movieInfo = this.querySelector('.movie-info');
      // Verificar si el elemento .movie-info no está visible
      if (movieInfo.style.display !== "flex")  {
        // Mostrar el elemento .movie-info
          movieInfo.style.display = 'flex';
          movieInfo.style.position = 'absolute';
          movieInfo.style.width = '100%';
          movieInfo.style.flexDirection = 'column';
          movieInfo.style.zIndex = '1';
          clickedOnce = true;
      } else {
        // Redirigir a la página de detalles de la película
        const movieId = movieInfo.dataset.movieId;
        const url = `movie.html?id=${movieId}`;
        window.location.href = url;
      }
    });
  } else {
    // Agregar evento de clic en el elemento .movie-info
    const movieInfo = movie.querySelector('.movie-info');
    movieInfo.addEventListener('click', function () {
      const movieId = this.dataset.movieId;
      const url = `movie.html?id=${movieId}`;
      window.location.href = url;
    });
  }
});

  hideLoader(); // Oculta la animación de carga
}

//consume los datos de la pelicula selecionada
async function fetchMovieDetails(movieId) {
  showLoader()
  const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=${language}`);
  const data = await response.json();
  //console.log(data)
  hideLoader()
  return data;
}

//consumelos videos de las pelicluas
async function fetchMovieVideos(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=${language}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}

//recore los datos de la pelicula y los muestra en el html
async function displayMovieDetails(movieId) {

  const videos = await fetchMovieVideos(movieId);

  // Buscar el primer video de tipo "Trailer"
  const trailerVideo = videos.find(video => video.type === "Trailer");
  // Obtener la URL del video de tipo "Trailer" o del primer video si no hay videos de tipo "Trailer"
  const videoUrl = trailerVideo ? trailerVideo.key : videos[0].key;

  
  // Construye la URL completa del video de YouTube
  const videoFullUrl = `https://www.youtube.com/embed/${videoUrl}?autoplay=1`;
  console.log("url triler", videoFullUrl)
  // Actualiza el atributo 'src' del elemento 'video'
 
  // Ahora puedes usar los datos de los videos en tu código
  console.log("lista de videos", videos);
    
  const movieDetails = await fetchMovieDetails(movieId);
  // Verificar si se proporciona la propiedad 'images' en la respuesta de la API
  if (!movieDetails.images) {
    // Si no se proporciona, hacer una llamada adicional a la API para obtener las imágenes
    movieDetails.images = await fetchMovieImages(movieId);
  }
  
  const { poster_path: urlImg, backdrop_path: urlBackdrop, title, overview, runtime, genres, images} = movieDetails;

  const genresNames = genres.map((genre) => genre.name).join(', ');
  const movieContainer = document.getElementById('movie-container');
  

  // Verificar la existencia de la propiedad 'backdrops' en 'images'
  if (images.backdrops || images.backdrops.length < 1) {
    showLoader()
    // Arreglo de las primeras 5 imágenes de backdrop
    const backdrops = images.backdrops.slice(0, 5).map(backdrop => `${IMAGE_BASE_URL}original${backdrop.file_path}`);

 
    
    // Crear elementos de imagen ocultos para pre-cargar las imágenes de fondo
    const backdropImages = backdrops.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
    
    const logoUrl = await fetchMovieLogo(movieId);//llamado a la fetchMovieLogo() logo y le damos el id de la movie 
    const originalLogoUrl = logoUrl.originalLogoUrl;
    const w500LogoUrl = logoUrl.w500LogoUrl;
    console.log("logo", originalLogoUrl) 
    console.log("logo", w500LogoUrl) 
    
    // Esperar a que todas las imágenes se hayan cargado antes de mostrar el telón
    await Promise.all(backdropImages.map(img => img.decode()));
   
    movieContainer.innerHTML =  `
    <div class="poster-container">
      <picture>
        <source srcset="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}" media="(max-width:768px)"></source>
        <img class="imgPoster" src="${IMAGE_BASE_URL}original${urlImg}" alt="${title}">
      </picture>
    </div>
    <div class="metadato-container">
      <picture>
        <source class="movie-logo" srcset="${w500LogoUrl}" alt="${title}"  media="(max-width:768px)"></source>
        <img class="movie-logo" src=${originalLogoUrl} alt="${title}"> 
      </picture>
      <h2>${title}</h2>
      <section>
        <p>${overview}</p>
        <div class="wrapper">
          <button  id="trailer-boton">Trailer 
            <svg fill="#fff" width="800px" height="800px" viewBox="0 0 1069 1069" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:serif="http://www.serif.com/" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect height="1066.67" id="Video-player" style="fill:none;" width="1066.67" x="1.515" y="0.143"/>
              <g>
              <path d="M653.802,660.183c9.682,-5.579 15.648,-15.903 15.648,-27.077c0,-11.174 -5.966,-21.498 -15.648,-27.077c-0,0 -207.519,-119.571 -207.519,-119.571c-9.669,-5.571 -21.576,-5.563 -31.238,0.021c-9.662,5.584 -15.613,15.897 -15.613,27.056c-0,0 -0,239.142 -0,239.142c-0,11.159 5.951,21.472 15.613,27.056c9.662,5.584 21.569,5.592 31.238,0.021c0,-0 207.519,-119.571 207.519,-119.571Zm-78.196,-27.077l-113.674,65.498c-0,0.001 -0,-130.996 -0,-130.996l113.674,65.498Z" style="fill-opacity:0.5;"/>
              <path d="M45.265,325.143l-0,458.333c-0,52.49 20.852,102.831 57.968,139.948c37.117,37.117 87.458,57.969 139.949,57.969c165.508,-0 417.825,-0 583.333,-0c52.491,-0 102.832,-20.852 139.948,-57.969c37.117,-37.117 57.969,-87.458 57.969,-139.948l-0,-458.333c-0,-52.49 -20.852,-102.831 -57.969,-139.948c-37.116,-37.117 -87.457,-57.969 -139.948,-57.969c-165.508,0 -417.825,0 -583.333,0c-52.491,0 -102.832,20.852 -139.949,57.969c-37.116,37.117 -57.968,87.458 -57.968,139.948Zm62.5,56.213l-0,402.12c-0,35.915 14.267,70.358 39.662,95.754c25.396,25.396 59.84,39.663 95.755,39.663c165.508,-0 417.825,-0 583.333,-0c35.915,-0 70.359,-14.267 95.754,-39.663c25.396,-25.396 39.663,-59.839 39.663,-95.754l-0,-458.333c-0,-35.915 -14.267,-70.358 -39.663,-95.754c-25.395,-25.396 -59.839,-39.663 -95.754,-39.663c-165.508,0 -417.825,0 -583.333,0c-35.915,0 -70.359,14.267 -95.755,39.663c-23.909,23.91 -37.955,55.84 -39.516,89.467l676.937,0c17.248,0 31.25,14.003 31.25,31.25c0,17.248 -14.002,31.25 -31.25,31.25l-677.083,0Zm123.177,-160.38c18.253,0 33.073,14.82 33.073,33.073c-0,18.254 -14.82,33.074 -33.073,33.074c-18.254,-0 -33.074,-14.82 -33.074,-33.074c0,-18.253 14.82,-33.073 33.074,-33.073Zm104.166,0c18.254,0 33.074,14.82 33.074,33.073c-0,18.254 -14.82,33.074 -33.074,33.074c-18.253,-0 -33.073,-14.82 -33.073,-33.074c0,-18.253 14.82,-33.073 33.073,-33.073Zm104.167,0c18.254,0 33.073,14.82 33.073,33.073c0,18.254 -14.819,33.074 -33.073,33.074c-18.254,-0 -33.073,-14.82 -33.073,-33.074c-0,-18.253 14.819,-33.073 33.073,-33.073Z"/>
              </g>
            </svg>
          </button>
        </div>
        <p>Duración: ${Math.floor(runtime / 60)}h ${runtime % 60}min</p>
        <p>Géneros: ${genresNames}</p>
      </section>
    </div>
    `;

    const trailerContainer = document.getElementById('trailer-container');
    
    
    trailerContainer.innerHTML =  `
        <iframe id="trailer-iframe" class="oculto" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
      `;

    const overlay = document.getElementById('overlay');
    const botonTrailer = document.getElementById("trailer-boton");
    const marco = document.getElementById("trailer-iframe");
   
    botonTrailer.addEventListener("click", function(event) {
      marco.setAttribute("src", videoFullUrl);  
      marco.classList.remove("oculto"); // Muestra el trailer
      trailerContainer.classList.remove("oculto"); // Muestra el trailer
      botonTrailer.querySelector("svg").setAttribute("fill", "#ff0000"); // Cambia el color del SVG al hacer clic
      overlay.classList.remove("oculto"); // oscurece la pantalla
      trailerContainer.style.display = "block"
    });


    document.addEventListener("click", function(event) { // Oculta el trailer
      // Verifica que el clic no haya sido en el botón ni en el marco
      if (event.target !== marco && event.target !== botonTrailer && !marco.contains(event.target)) {
        marco.removeAttribute("src");
        marco.classList.add("oculto");
        trailerContainer.classList.add("oculto");
        botonTrailer.querySelector("svg").setAttribute("fill", "#fff"); // Cambia el color del SVG al hacer clic
        overlay.classList.add("oculto");
        trailerContainer.style.display = "none"
      }
    });

    


    
    //--
    // const botonTrailer = document.getElementById("trailer-boton");
    // const marco = document.getElementById("trailer-iframe");
    
    // botonTrailer.addEventListener("click", function() {
    //   marco.classList.remove("oculto"); // Muestra el trailer
    // });
    
    // document.addEventListener("click", function(event) { // Oculta el trailer
    //   // Verifica que el clic no haya sido en el botón ni en el marco
    //   if (event.target !== marco && event.target !== botonTrailer && !marco.contentWindow.document.contains(event.target)) {
    //     marco.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    //     marco.classList.add("oculto");
    //   }
    // });

   
    const backdropContainer = document.createElement('div');
    backdropContainer.id = 'backdrop';
    backdropContainer.style.backgroundImage = `url(${backdrops[0]})`;
    document.body.appendChild(backdropContainer);
    // Verificar si hay suficientes imágenes de fondo para rotar
    rotateBackdrops(backdrops, 20); 
    
  }
  hideLoader() //cierra la animacion de carga
}

async function fetchMovieImages(movieId) {

  const url = `${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  const images = {
    backdrops: data.backdrops,
    logos: data.logos,
    posters: data.posters
  };
  
  const spanishImages = {
    backdrops: [],
    logos: [],
    posters: []
  };
  // Busca imágenes en el lenguaje que que tiene el navegador
  for (let type in images) {
   
    const language = navigator.language.slice(0, 2);// Obtener el idioma del navegador
    console.log("navegador lenguaje", language)
    for (let i = 0; i < images[type].length; i++) {
      if (images[type][i].iso_639_1 === language) { //verifica si existe el tipo de imagen en ese idioma
        spanishImages[type].push(images[type][i]);
      }
    }
    for (let i = 0; i < images[type].length; i++) { //si no busca imágenes en ingles
      if (images[type][i].iso_639_1 === "en") {
        spanishImages[type].push(images[type][i]);
      }
    }
  }
  
  // Si hay imágenes en español, devuelve esas,si no , devuelve en inglés de lo contrario devuelve pordefecto
  for (let type in spanishImages) {
    if (spanishImages[type].length > 0) {
      images[type] = spanishImages[type];
    }
  }
 
  return images;
}

// async function fetchMovieImages(movieId) {
//   const url = `${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`;
//   const response = await fetch(url);
//   const data = await response.json();
//   return data;
// }

// async function fetchMovieImages(movieId) {
//   const language = navigator.language || navigator.userLanguage; // Obtener el idioma del navegador
//   console.log("lenguaje", language)
//   const url = `${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}&language=en`;
//   const response = await fetch(url);
//   const data = await response.json();
//   return data;
// }

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

