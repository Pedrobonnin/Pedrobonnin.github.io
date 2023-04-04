

//movie.js
import { IMAGE_BASE_URL, BASE_URL, API_KEY } from './script.js';

async function fetchMovieDetails(movieId) {
  const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-AR`);
  const data = await response.json();
  console.log(data)
  return data;
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

async function displayMovieDetails(movieId) {
  const movieDetails = await fetchMovieDetails(movieId);

  if (!movieDetails.images) {
    movieDetails.images = await fetchMovieImages(movieId);
  }

  const { poster_path: urlImg, backdrop_path: urlBackdrop, title, overview, runtime, genres, images, logoUrl } = movieDetails;

  const genresNames = genres.map((genre) => genre.name).join(', ');
  const movieContainer = document.getElementById('movie-container');

  if (images.backdrops || images.backdrops.length < 1) {
    const backdrops = images.backdrops.slice(0, 5).map(backdrop => `${IMAGE_BASE_URL}original${backdrop.file_path}`);

    const backdropImages = backdrops.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

    await Promise.all(backdropImages.map(img => img.decode()));

    movieContainer.innerHTML = `
      <div class="poster-container">
        <picture>
          <source srcset="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}" media="(min-width: 768px)">
          <img src="${IMAGE_BASE_URL}w342${urlImg}" alt="${title}">
        </picture>
        <img class="logo" src="${logoUrl}" alt="logo">
      </div>
      <div class="movie-details">
        <h1>${title}</h1>
        <p><strong>Géneros:</strong> ${genresNames}</p>
        <p><strong>Duración:</strong> ${runtime} min</p>
        <p><strong>Sinopsis:</strong> ${overview}</p>
      </div>
      <div id="backdrop"></div>
    `;

    rotateBackdrops(backdrops, 5);
  } else {
    movieContainer.innerHTML = `
      <div class="poster-container">
        <picture>
          <source srcset="${IMAGE_BASE_URL}w500${urlImg}" alt="${title}" media="(min-width: 768px)">
          <img src="${IMAGE_BASE_URL}w342${urlImg}" alt="${title}">
        </picture>
        <img class="logo" src="${logoUrl}" alt="logo">
      </div>
      <div class="movie-details">
        <h1>${title}</h1>
        <p><strong>Géneros:</strong> ${genresNames}</p>
        <p><strong>Duración:</strong> ${runtime} min</p>
        <p><strong>Sinopsis:</strong> ${overview}</p>
      </div>
    `;
  }
}