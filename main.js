const searchForm = document.querySelector("form");
const searchResultDiv = document.querySelector(".search-result");
const container = document.querySelector(".container");
const loadMoreContainer = document.querySelector("#load-more-container");
const dietFilter = document.querySelector("#diet-filter");
const favoritesBtn = document.querySelector("#favorites-btn");

const modal = document.querySelector("#recipe-modal");
const modalCloseBtn = document.querySelector(".modal-close-btn");
const modalTitle = document.querySelector("#modal-title");
const modalImage = document.querySelector("#modal-image");
const modalIngredients = document.querySelector("#modal-ingredients");
const modalSourceLink = document.querySelector("#modal-source-link");
const saveFavoriteBtn = document.querySelector("#save-favorite-btn");

let searchQuery = "";
let nextPageUrl = "";
let recipeHits = [];
let currentRecipeUri = "";

const APP_ID = "4c502aed";
const APP_key = "9a3222b9fe5c26bb3bb8f7754ecb0f2d";

// --- Event Listeners ---
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchQuery = e.target.querySelector("input").value;
  const diet = dietFilter.value;
  if (searchQuery) {
    favoritesBtn.classList.remove('active');
    fetchAPI(true, diet);
  }
});

favoritesBtn.addEventListener("click", () => {
    loadFavorites();
});

searchResultDiv.addEventListener("click", (e) => {
  if (e.target.classList.contains("view-button")) {
    const recipeUri = e.target.dataset.recipeUri;
    if (recipeUri) {
      openModal(recipeUri);
    }
  }
});

modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

saveFavoriteBtn.addEventListener("click", () => {
    toggleFavorite(currentRecipeUri);
});

// --- API and Rendering ---
async function fetchAPI(isNewSearch, diet = "") {
  let url = "";
  if (isNewSearch) {
    recipeHits = [];
    let baseURL = `https://api.edamam.com/api/recipes/v2?type=public&q=${searchQuery}&app_id=${APP_ID}&app_key=${APP_key}`;
    if (diet) {
      baseURL += `&diet=${diet}`;
    }
    url = baseURL;
  } else {
    url = nextPageUrl;
  }

  if (isNewSearch) {
    searchResultDiv.innerHTML = '<div class="spinner"></div>';
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    recipeHits = recipeHits.concat(data.hits);
    generateHTML(data.hits, !isNewSearch);

    if (data._links && data._links.next && data._links.next.href) {
      nextPageUrl = data._links.next.href;
      showLoadMoreButton();
    } else {
      hideLoadMoreButton();
    }
  } catch (error) {
    searchResultDiv.innerHTML = `<p class="error-message">Something went wrong, please try again!</p>`;
    hideLoadMoreButton();
  }
}

function generateHTML(results, append = false) {
  container.classList.remove("initial");

  let generatedHTML = "";
  if (results && results.length > 0) {
    results.forEach((result) => {
      const recipe = result.recipe ? result.recipe : result; // Handle both hit and direct recipe objects
      generatedHTML += `
      <div class="item">
          <img src="${recipe.image}" alt="img">
          <div class="flex-container">
            <h1 class="title">${recipe.label}</h1>
            <button class="view-button" data-recipe-uri="${recipe.uri}">View Recipe</button>
          </div>
          <p class="item-data">Calories: ${recipe.calories.toFixed(2)}</p>
          <p class="item-data">Diet label: ${
            recipe.dietLabels.length > 0
              ? recipe.dietLabels.join(", ")
              : "No Data Found"
          }</p>
      </div>
      `;
    });
  } else if (!append) {
    generatedHTML = `<p class="error-message">No recipes found.</p>`;
  }

  if (append) {
    const spinner = searchResultDiv.querySelector('.spinner');
    if(spinner) spinner.remove();
    searchResultDiv.innerHTML += generatedHTML;
  } else {
    searchResultDiv.innerHTML = generatedHTML;
  }
}


function showLoadMoreButton() {
    loadMoreContainer.innerHTML = '';
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "load-more-btn";
    loadMoreBtn.innerText = "Load More";
    loadMoreBtn.classList.add("view-button");
    loadMoreBtn.style.margin = "20px auto";
    loadMoreBtn.style.display = "block";
    loadMoreBtn.addEventListener("click", () => {
        loadMoreBtn.remove();
        loadMoreContainer.innerHTML = '<div class="spinner"></div>';
        fetchAPI(false);
    });
    loadMoreContainer.appendChild(loadMoreBtn);
}

function hideLoadMoreButton() {
    loadMoreContainer.innerHTML = '';
}

// --- Modal Logic ---
function openModal(recipeUri) {
  let recipeHit = recipeHits.find(hit => hit.recipe.uri === recipeUri);
  if (!recipeHit) {
      const favorites = getFavorites();
      const favoriteRecipe = favorites.find(recipe => recipe.uri === recipeUri);
      if (favoriteRecipe) {
          recipeHit = { recipe: favoriteRecipe };
      }
  }

  if (!recipeHit) return;

  const recipe = recipeHit.recipe;
  currentRecipeUri = recipe.uri;

  modalTitle.textContent = recipe.label;
  modalImage.src = recipe.image;
  modalIngredients.innerHTML = recipe.ingredientLines
    .map((line) => `<li>${line}</li>`)
    .join("");
  modalSourceLink.href = recipe.url;

  updateFavoriteButton(recipe.uri);
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  currentRecipeUri = "";
}

// --- Favorites Logic ---
function getFavorites() {
    return JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
}

function saveFavorites(favorites) {
    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
}

function isFavorite(recipeUri) {
    return getFavorites().some(recipe => recipe.uri === recipeUri);
}

function toggleFavorite(recipeUri) {
    const favorites = getFavorites();
    if (isFavorite(recipeUri)) {
        const updatedFavorites = favorites.filter(recipe => recipe.uri !== recipeUri);
        saveFavorites(updatedFavorites);
    } else {
        const recipeHit = recipeHits.find(hit => hit.recipe.uri === recipeUri);
        if (recipeHit) {
            favorites.push(recipeHit.recipe);
            saveFavorites(favorites);
        }
    }
    updateFavoriteButton(recipeUri);

    if(favoritesBtn.classList.contains('active')) {
        loadFavorites();
        closeModal();
    }
}

function updateFavoriteButton(recipeUri) {
    if (isFavorite(recipeUri)) {
        saveFavoriteBtn.textContent = "Remove from Favorites";
        saveFavoriteBtn.classList.add("favorited");
    } else {
        saveFavoriteBtn.textContent = "Save to Favorites";
        saveFavoriteBtn.classList.remove("favorited");
    }
}

function loadFavorites() {
    const favorites = getFavorites();
    searchResultDiv.innerHTML = "";
    hideLoadMoreButton();
    generateHTML(favorites);
    favoritesBtn.classList.add('active');
    container.classList.remove("initial");
    if(favorites.length === 0) {
        searchResultDiv.innerHTML = `<p class="error-message">You haven't saved any favorite recipes yet.</p>`;
    }
}
