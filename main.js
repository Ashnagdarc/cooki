// --- DOM Elements ---
const searchForm = document.querySelector("form");
const searchResultDiv = document.querySelector(".search-result");
const container = document.querySelector(".container");
const loadMoreContainer = document.querySelector("#load-more-container");
const favoritesBtn = document.querySelector("#favorites-btn");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");
const modal = document.querySelector("#recipe-modal");
const modalCloseBtn = document.querySelector(".modal-close-btn");
const modalTitle = document.querySelector("#modal-title");
const modalImage = document.querySelector("#modal-image");
const modalIngredients = document.querySelector("#modal-ingredients");
const modalSourceLink = document.querySelector("#modal-source-link");
const saveFavoriteBtn = document.querySelector("#save-favorite-btn");
const toastContainer = document.querySelector("#toast-container");
const filterPanel = document.querySelector("#filter-panel");
const filterOverlay = document.querySelector("#filter-overlay");
const filterToggleBtn = document.querySelector("#filter-toggle-btn");
const filterCloseBtn = document.querySelector("#filter-close-btn");
const applyFiltersBtn = document.querySelector("#apply-filters-btn");
const clearFiltersBtn = document.querySelector("#clear-filters-btn");
const healthFiltersDiv = document.querySelector("#health-filters");
const cuisineFilter = document.querySelector("#cuisine-filter");
const mealFilter = document.querySelector("#meal-filter");
const minCaloriesInput = document.querySelector("#min-calories");
const maxCaloriesInput = document.querySelector("#max-calories");


// --- App State ---
const state = {
    searchQuery: "",
    nextPageUrl: "",
    recipeHits: [],
    currentRecipeUri: "",
    theme: "light",
};

// --- Constants ---
const APP_ID = "4c502aed";
const APP_key = "9a3222b9fe5c26bb3bb8f7754ecb0f2d";

// --- Event Listeners ---
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.searchQuery = e.target.querySelector("input").value;
  if (state.searchQuery) {
    applyFiltersAndSearch();
  }
});

favoritesBtn.addEventListener("click", () => loadFavorites());
themeToggleBtn.addEventListener("click", toggleTheme);
filterToggleBtn.addEventListener("click", openFilterPanel);
filterCloseBtn.addEventListener("click", closeFilterPanel);
filterOverlay.addEventListener("click", closeFilterPanel);
applyFiltersBtn.addEventListener("click", () => {
    state.searchQuery = document.querySelector("form input").value;
    if (state.searchQuery) {
        applyFiltersAndSearch();
    } else {
        showToast("Please enter a search query first.", "error");
    }
});
clearFiltersBtn.addEventListener("click", clearFilters);

searchResultDiv.addEventListener("click", (e) => {
  if (e.target.classList.contains("view-button")) {
    const recipeUri = e.target.dataset.recipeUri;
    if (recipeUri) openModal(recipeUri);
  }
});

modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

saveFavoriteBtn.addEventListener("click", () => {
    toggleFavorite(state.currentRecipeUri);
});

// --- Filter Logic ---
function openFilterPanel() {
    filterPanel.classList.add("active");
    filterOverlay.classList.add("active");
}

function closeFilterPanel() {
    filterPanel.classList.remove("active");
    filterOverlay.classList.remove("active");
}

function getAppliedFilters() {
    const filters = {};

    // Health filters
    const healthCheckboxes = healthFiltersDiv.querySelectorAll('input[type="checkbox"]:checked');
    if (healthCheckboxes.length > 0) {
        filters.health = Array.from(healthCheckboxes).map(cb => cb.value);
    }

    // Cuisine filter
    if (cuisineFilter.value) {
        filters.cuisineType = cuisineFilter.value;
    }

    // Meal filter
    if (mealFilter.value) {
        filters.mealType = mealFilter.value;
    }

    // Calories filter
    const minCal = minCaloriesInput.value;
    const maxCal = maxCaloriesInput.value;
    if (minCal || maxCal) {
        filters.calories = `${minCal || 0}-${maxCal || 9999}`;
    }

    return filters;
}

function applyFiltersAndSearch() {
    const filters = getAppliedFilters();
    favoritesBtn.classList.remove('active');
    fetchAPI(true, filters);
    closeFilterPanel();
}

function clearFilters() {
    cuisineFilter.value = "";
    mealFilter.value = "";
    minCaloriesInput.value = "";
    maxCaloriesInput.value = "";
    healthFiltersDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    showToast("Filters cleared", "success");
}

// --- API and Rendering ---
async function fetchAPI(isNewSearch, filters = {}) {
  let url = "";
  if (isNewSearch) {
    state.recipeHits = [];
    let baseURL = `https://api.edamam.com/api/recipes/v2?type=public&q=${state.searchQuery}&app_id=${APP_ID}&app_key=${APP_key}`;

    // Append filters to the URL
    for (const key in filters) {
        if (Array.isArray(filters[key])) {
            filters[key].forEach(value => {
                baseURL += `&${key}=${value}`;
            });
        } else {
            baseURL += `&${key}=${filters[key]}`;
        }
    }
    url = baseURL;
  } else {
    url = state.nextPageUrl;
  }

  if (isNewSearch) {
    searchResultDiv.innerHTML = '<div class="spinner"></div>';
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.recipeHits = state.recipeHits.concat(data.hits);
    generateHTML(data.hits, !isNewSearch);

    if (data._links && data._links.next && data._links.next.href) {
      state.nextPageUrl = data._links.next.href;
      showLoadMoreButton();
    } else {
      hideLoadMoreButton();
    }
  } catch (error) {
    searchResultDiv.innerHTML = `<p class="error-message">Something went wrong: ${error.message}</p>`;
    hideLoadMoreButton();
  }
}

function generateHTML(results, append = false) {
  container.classList.remove("initial");

  let generatedHTML = "";
  if (results && results.length > 0) {
    results.forEach((result) => {
      const recipe = result.recipe ? result.recipe : result;
      generatedHTML += `
      <div class="item">
          <img src="${recipe.image}" alt="${recipe.label}">
          <div class="flex-container">
            <h1 class="title">${recipe.label}</h1>
            <button class="btn btn-item view-button" data-recipe-uri="${recipe.uri}">View Recipe</button>
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
    generatedHTML = `<p class="error-message">No recipes found. Try different keywords or filters.</p>`;
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
    loadMoreBtn.classList.add("btn");
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
  let recipeHit = state.recipeHits.find(hit => hit.recipe.uri === recipeUri);
  if (!recipeHit) {
      const favorites = getFavorites();
      const favoriteRecipe = favorites.find(recipe => recipe.uri === recipeUri);
      if (favoriteRecipe) {
          recipeHit = { recipe: favoriteRecipe };
      }
  }

  if (!recipeHit) return;

  const recipe = recipeHit.recipe;
  state.currentRecipeUri = recipe.uri;

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
  state.currentRecipeUri = "";
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
        showToast("Recipe removed from favorites.", "error");
    } else {
        const recipeHit = state.recipeHits.find(hit => hit.recipe.uri === recipeUri);
        if (recipeHit) {
            favorites.push(recipeHit.recipe);
            saveFavorites(favorites);
            showToast("Recipe saved to favorites!", "success");
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
        saveFavoriteBtn.classList.remove("btn-success");
        saveFavoriteBtn.classList.add("btn-danger");
    } else {
        saveFavoriteBtn.textContent = "Save to Favorites";
        saveFavoriteBtn.classList.remove("btn-danger");
        saveFavoriteBtn.classList.add("btn-success");
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

// --- Toast Notification ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- Theme Logic ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme(state.theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.theme = savedTheme;
    }
    applyTheme(state.theme);
}

// --- Initial Load ---
loadTheme();
