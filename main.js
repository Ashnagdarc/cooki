// ===== DOM ELEMENTS =====
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchResult = document.getElementById("search-results");
const skeletonGrid = document.getElementById("skeleton-grid");
const loadingSpinner = document.getElementById("loading-spinner");
const endOfResults = document.getElementById("end-of-results");
const emptyState = document.getElementById("empty-state");

// Simple inline SVG fallback image (text-based, no asset needed)
const FALLBACK_IMG = "data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>\
  <defs>\
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>\
      <stop offset='0' stop-color='%23fff3e8'/>\
      <stop offset='1' stop-color='%23ffe4cc'/>\
    </linearGradient>\
  </defs>\
  <rect width='800' height='450' rx='16' fill='url(%23g)'/>\
  <g fill='%23ff6b35' font-family='Inter, Arial' font-weight='700' text-anchor='middle'>\
    <text x='400' y='232' font-size='42'>COOKI</text>\
    <text x='400' y='270' font-size='18' fill='%23555'>Image unavailable</text>\
  </g>\
</svg>";

// Modal elements
const modal = document.getElementById("recipe-modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalImg = document.getElementById("modal-img");
const modalCategory = document.getElementById("modal-category");
const modalArea = document.getElementById("modal-area");
const modalIngredients = document.getElementById("modal-ingredients");
const modalInstructions = document.getElementById("modal-instructions");
const modalSource = document.getElementById("modal-source");
const addToMealPlanBtn = document.getElementById("add-to-meal-plan");

// Meal Plan Modal elements
const mealPlanModal = document.getElementById("meal-plan-modal");
const mealPlanModalClose = document.getElementById("meal-plan-modal-close");
const mealDaySelect = document.getElementById("meal-day");
const mealTypeSelect = document.getElementById("meal-type");
const servingsInput = document.getElementById("servings");
const confirmAddMealBtn = document.getElementById("confirm-add-meal");
const cancelAddMealBtn = document.getElementById("cancel-add-meal");

// ===== FILTERS & PAGINATION STATE =====
let allMergedResults = []; // unfiltered
let filteredResults = []; // after filters
let pageIndex = 0; // current page for infinite scroll
const PAGE_SIZE = 12;

// Filter elements
const filtersBar = document.getElementById('filters-toolbar');
const filterCategory = document.getElementById('filter-category');
const filterArea = document.getElementById('filter-area');
const filterLocal = document.getElementById('filter-local');
const filterFavorites = document.getElementById('filter-favorites');
const filtersClear = document.getElementById("filters-clear");

const sortBy = document.getElementById('sort-by');
const viewToggleBtn = document.getElementById('view-toggle-btn');
let isListView = false;

// ===== STATE MANAGEMENT =====
let currentSearchQuery = "";
let searchResults = [];
let selectedRecipe = null;
let localRecipesCache = null; // loaded once
let isLoading = false;
let hasMoreResults = true;

// ===== EVENT LISTENERS =====
searchForm.addEventListener("submit", handleSearch);
modalClose.addEventListener("click", closeModal);
mealPlanModalClose.addEventListener("click", closeMealPlanModal);
cancelAddMealBtn.addEventListener("click", closeMealPlanModal);

// Add to meal plan button
addToMealPlanBtn.addEventListener("click", openMealPlanModal);

// Quick search suggestions
document.querySelectorAll('.suggestion-tag').forEach(tag => {
  tag.addEventListener('click', (e) => {
    e.preventDefault();
    const searchTerm = tag.dataset.search;
    searchInput.value = searchTerm;
    performSearch(searchTerm);
  });
});

// Clear filters button
document.getElementById('clear-filters').addEventListener('click', () => {
  filterCategory.value = '';
  filterArea.value = '';
  filterLocal.checked = false;
  filterFavorites.checked = false;
  sortBy.value = 'az';
  applyFiltersAndSort();
  updateResultsCount();
});

// Event delegation for recipe cards (including featured)
document.addEventListener('click', (e) => {
  // Handle favorite button clicks
  if (e.target.classList.contains('btn-fav')) {
    e.preventDefault();
    e.stopPropagation();
    const mealId = e.target.closest('[data-meal-id]')?.dataset.mealId;
    if (mealId) {
      toggleFavorite(mealId);
      updateFavoriteButton(e.target, mealId);
    }
  }

  // Handle view recipe button clicks
  if (e.target.classList.contains('view-recipe')) {
    e.preventDefault();
    e.stopPropagation();
    const mealId = e.target.dataset.mealId;
    if (mealId) {
      openRecipeModal(mealId);
    }
  }

  // Handle featured card clicks
  if (e.target.closest('.featured-card')) {
    const card = e.target.closest('.featured-card');
    const viewBtn = card.querySelector('.view-recipe');
    if (viewBtn && !e.target.classList.contains('btn-fav')) {
      const mealId = viewBtn.dataset.mealId;
      if (mealId) {
        openRecipeModal(mealId);
      }
    }
  }
});

// Close modals on overlay click
window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
  if (e.target === mealPlanModal) closeMealPlanModal();
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeMealPlanModal();
  }
});

// Update results count
function updateResultsCount() {
  const count = filteredResults.length;
  const countElement = document.querySelector('.results-count');
  if (countElement) {
    countElement.textContent = `${count} recipe${count !== 1 ? 's' : ''} found`;
  }
}

// ===== LOCAL DATA (Nigerian recipes) =====
async function loadLocalRecipes() {
  if (localRecipesCache) return localRecipesCache;
  try {
    const res = await fetch("./data/nigeria.json");
    if (!res.ok) throw new Error("failed to load local data");
    const list = await res.json();
    // tag as local for handling and UI
    localRecipesCache = Array.isArray(list)
      ? list.map((r) => ({ ...r, _isLocal: true }))
      : [];
  } catch (e) {
    console.warn("Local dataset not available:", e.message);
    localRecipesCache = [];
  }
  return localRecipesCache;
}

async function searchLocalRecipes(query) {
  const all = await loadLocalRecipes();
  const q = query.toLowerCase();
  return all.filter((r) => {
    const hay = [r.strMeal, r.strArea, r.strCategory]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function isLocalRecipe(meal) {
  return !!(meal && (meal._isLocal || String(meal.idMeal || "").startsWith("NIG-")));
}

// ===== SEARCH FUNCTIONALITY =====
async function handleSearch(e) {
  e.preventDefault();

  const query = searchInput.value.trim();
  if (!query) {
    showEmptyState("Please enter a search term.");
    return;
  }

  currentSearchQuery = query;
  await performSearch(query);
}

async function performSearch(query) {
  if (!query.trim()) {
    showEmptyState("Please enter a search term");
    return;
  }

  showLoadingState();
  pageIndex = 0;
  hasMoreResults = true;

  try {
    // Ensure local recipes are loaded
    if (!localRecipesCache) {
      await loadLocalRecipes();
    }

    console.log('Searching for:', query);
    console.log('Local recipes cache:', localRecipesCache ? localRecipesCache.length : 'null');

    // Search API
    const apiResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const apiData = await apiResponse.json();
    const apiResults = apiData.meals || [];

    console.log('API results:', apiResults.length);

    // Search local recipes
    const localResults = (localRecipesCache || []).filter(recipe =>
      recipe.strMeal.toLowerCase().includes(query.toLowerCase()) ||
      recipe.strCategory.toLowerCase().includes(query.toLowerCase()) ||
      recipe.strArea.toLowerCase().includes(query.toLowerCase())
    ).map(recipe => ({ ...recipe, isLocal: true }));

    console.log('Local results:', localResults.length);

    // Merge and deduplicate results
    const merged = [...localResults];
    apiResults.forEach(apiRecipe => {
      if (!localResults.find(local => local.idMeal === apiRecipe.idMeal)) {
        merged.push({ ...apiRecipe, isLocal: false });
      }
    });

    console.log('Total merged results:', merged.length);

    allMergedResults = merged;
    filteredResults = merged;
    buildFiltersOptions(allMergedResults);
    applyFiltersAndSort();
    hideLoadingState();
    updateResultsCount();

    // Scroll to results section after search
    setTimeout(() => {
      const resultsSection = document.querySelector('.main-content');
      if (resultsSection) {
        resultsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Add highlight effect to results section
        resultsSection.style.transition = 'all 0.3s ease';
        resultsSection.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.2)';
        setTimeout(() => {
          resultsSection.style.boxShadow = 'none';
        }, 2000);
      }
    }, 100);

    if (merged.length === 0) {
      showEmptyState(`No recipes found for "${query}"`);
    }
  } catch (error) {
    console.error('Search error:', error);
    showEmptyState('Error searching recipes. Please try again.');
    hideLoadingState();
  }
}

// ===== SKELETON LOADING FUNCTIONS =====
function showSkeletons(count = 6) {
  skeletonGrid.innerHTML = '';
  skeletonGrid.style.display = 'grid';
  searchResult.style.display = 'none';
  emptyState.style.display = 'none';

  for (let i = 0; i < count; i++) {
    const skeletonCard = createSkeletonCard();
    skeletonGrid.appendChild(skeletonCard);
  }
}

function hideSkeletons() {
  skeletonGrid.style.display = 'none';
  searchResult.style.display = 'grid';
}

function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-recipe-card';

  if (isListView) {
    card.style.display = 'flex';
    card.style.height = '120px';
  }

  card.innerHTML = `
        <div class="skeleton-recipe-image skeleton"></div>
        <div class="skeleton-recipe-content">
            <div class="skeleton-recipe-title skeleton"></div>
            <div class="skeleton-recipe-meta skeleton"></div>
            <div class="skeleton-recipe-actions">
                <div class="skeleton-btn skeleton"></div>
                <div class="skeleton-btn skeleton"></div>
            </div>
        </div>
    `;

  return card;
}

function showLoadingSpinner() {
  loadingSpinner.style.display = 'inline-block';
  endOfResults.style.display = 'none';
}

function hideLoadingSpinner() {
  loadingSpinner.style.display = 'none';
}

function showEndOfResults() {
  endOfResults.style.display = 'block';
  hasMoreResults = false;
}

function hideEndOfResults() {
  endOfResults.style.display = 'none';
  hasMoreResults = true;
}

// ===== UPDATED LOADING STATE FUNCTIONS =====
function showLoadingState() {
  showSkeletons(6);
  hideLoadingSpinner();
  hideEndOfResults();
}

function hideLoadingState() {
  hideSkeletons();
  hideLoadingSpinner();
}

function showEmptyState(message) {
  emptyState.style.display = "block";
  searchResult.innerHTML = "";
  hideSkeletons();
  hideLoadingSpinner();
  hideEndOfResults();

  const messageElement = emptyState.querySelector("p");
  if (messageElement) {
    messageElement.textContent = message;
  }
}

function displayResults(meals) {
  // Deprecated: replaced by filtered pagination rendering
  searchResult.innerHTML = "";
  emptyState.style.display = "none";
  meals.forEach((meal, index) => {
    const card = createRecipeCard(meal, index);
    searchResult.appendChild(card);
  });
}

function sortResults(list) {
  const mode = sortBy?.value || 'az';
  const byText = (a, b, prop) => (a[prop] || '').localeCompare(b[prop] || '');
  const copy = [...list];
  switch (mode) {
    case 'za': copy.sort((a, b) => byText(b, a, 'strMeal')); break;
    case 'category': copy.sort((a, b) => byText(a, b, 'strCategory') || byText(a, b, 'strMeal')); break;
    case 'area': copy.sort((a, b) => byText(a, b, 'strArea') || byText(a, b, 'strMeal')); break;
    default: copy.sort((a, b) => byText(a, b, 'strMeal'));
  }
  return copy;
}

sortBy && sortBy.addEventListener('change', () => { pageIndex = 0; filteredResults = sortResults(filteredResults); searchResult.innerHTML = ''; appendNextPage(); });

viewToggleBtn && viewToggleBtn.addEventListener('click', () => {
  isListView = !isListView;
  viewToggleBtn.setAttribute('aria-pressed', String(isListView));
  viewToggleBtn.textContent = isListView ? 'Grid View' : 'List View';
  searchResult.classList.toggle('list-view', isListView);
});

// ===== FAVORITES & PERSISTENCE =====
const STORAGE_KEYS = {
  favorites: 'cooki:favorites',
  toolbar: 'cooki:toolbar'
};
function loadFavorites() { try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]')); } catch { return new Set(); } }
function saveFavorites(set) { localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(set))); }
let favoriteIds = loadFavorites();
function isFavorite(id) { return favoriteIds.has(id); }
function toggleFavorite(id) { if (favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id); saveFavorites(favoriteIds); announce(`${favoriteIds.has(id) ? 'Saved' : 'Removed'} from favorites`); }

// remember toolbar state
function saveToolbarState() {
  const state = {
    cat: filterCategory?.value || '',
    area: filterArea?.value || '',
    local: !!filterLocal?.checked,
    favorites: !!filterFavorites?.checked,
    sort: sortBy?.value || 'az',
    list: isListView
  };
  localStorage.setItem(STORAGE_KEYS.toolbar, JSON.stringify(state));
}

function loadToolbarState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.toolbar) || '{}');
    if (filterCategory) filterCategory.value = s.cat || '';
    if (filterArea) filterArea.value = s.area || '';
    if (filterLocal) filterLocal.checked = !!s.local;
    if (filterFavorites) filterFavorites.checked = !!s.favorites;
    if (sortBy) sortBy.value = s.sort || 'az';
    if (s.list) {
      isListView = true;
      searchResult.classList.add('list-view');
      if (viewToggleBtn) {
        viewToggleBtn.textContent = 'Grid View';
        viewToggleBtn.setAttribute('aria-pressed', 'true');
      }
    }
  } catch { }
}

[filterCategory, filterArea, filterLocal, filterFavorites, sortBy].forEach(el => el && el.addEventListener('change', saveToolbarState));
viewToggleBtn && viewToggleBtn.addEventListener('click', saveToolbarState);

function announce(msg) { const live = document.getElementById('aria-live'); if (live) { live.textContent = ''; setTimeout(() => live.textContent = msg, 0); } }

// augment createRecipeCard with favorite button
function createRecipeCard(meal, index) {
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.style.animationDelay = `${index * 0.1}s`;
  const imgSrc = meal.strMealThumb || FALLBACK_IMG;
  const localBadge = isLocalRecipe(meal) ? '<span class="recipe-local">Local</span>' : "";
  const favActive = isFavorite(meal.idMeal) ? 'btn-fav--active' : '';
  card.innerHTML = `
    <img src="${imgSrc}" alt="${meal.strMeal}" class="recipe-image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
    <div class="recipe-content">
      <h3 class="recipe-title">${meal.strMeal}</h3>
      <div class="recipe-meta">
        <span class="recipe-category">${meal.strCategory || ''}</span>
        <span class="recipe-area">${meal.strArea || ''}</span>
        ${localBadge}
      </div>
      <div class="recipe-actions">
        <button class="btn btn-secondary btn-fav ${favActive}" aria-label="Toggle favorite" title="Save">❤</button>
        <button class="btn btn-primary view-recipe" data-meal-id="${meal.idMeal}">View Recipe</button>
      </div>
    </div>
  `;
  card.querySelector('.btn-fav').addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(meal.idMeal); e.currentTarget.classList.toggle('btn-fav--active'); });
  card.querySelector(".view-recipe").addEventListener("click", () => { openRecipeModal(meal); });
  return card;
}

// Load toolbar state on start
loadToolbarState();

// Build filter options from results
function buildFiltersOptions(results) {
  const categories = [...new Set(results.map(r => r.strCategory).filter(Boolean))].sort();
  const areas = [...new Set(results.map(r => r.strArea).filter(Boolean))].sort();

  // Populate category filter
  if (filterCategory) {
    const currentValue = filterCategory.value;
    filterCategory.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      filterCategory.appendChild(option);
    });
    filterCategory.value = currentValue;
  }

  // Populate area filter
  if (filterArea) {
    const currentValue = filterArea.value;
    filterArea.innerHTML = '<option value="">All Areas</option>';
    areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      filterArea.appendChild(option);
    });
    filterArea.value = currentValue;
  }
}

// integrate sorting in filters
function applyFiltersAndSort() {
  const category = filterCategory?.value || '';
  const area = filterArea?.value || '';
  const localOnly = filterLocal?.checked || false;
  const favoritesOnly = filterFavorites?.checked || false;
  const sortByValue = sortBy?.value || 'az';

  // Apply filters
  filteredResults = allMergedResults.filter(recipe => {
    if (category && recipe.strCategory !== category) return false;
    if (area && recipe.strArea !== area) return false;
    if (localOnly && !recipe.isLocal) return false;
    if (favoritesOnly && !isFavorite(recipe.idMeal)) return false;
    return true;
  });

  // Apply sorting
  filteredResults.sort((a, b) => {
    switch (sortByValue) {
      case 'za':
        return b.strMeal.localeCompare(a.strMeal);
      case 'favorites':
        const aFav = isFavorite(a.idMeal);
        const bFav = isFavorite(b.idMeal);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.strMeal.localeCompare(b.strMeal);
      case 'local':
        if (a.isLocal && !b.isLocal) return -1;
        if (!a.isLocal && b.isLocal) return 1;
        return a.strMeal.localeCompare(b.strMeal);
      case 'az':
      default:
        return a.strMeal.localeCompare(b.strMeal);
    }
  });

  // Reset pagination
  pageIndex = 0;
  hasMoreResults = true;
  hideEndOfResults();

  // Render results
  renderResultsPage();
  updateResultsCount();
}

// ===== RECIPE MODAL =====
async function openRecipeModal(meal) {
  try {
    let recipe = meal;

    if (!isLocalRecipe(meal)) {
      // Fetch detailed recipe information for remote items
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
      const data = await response.json();
      if (!data.meals || !data.meals[0]) {
        throw new Error("Recipe details not found");
      }
      recipe = data.meals[0];
    }

    selectedRecipe = recipe;

    // Populate modal with recipe details
    modalTitle.textContent = recipe.strMeal;
    modalImg.src = recipe.strMealThumb || FALLBACK_IMG;
    modalImg.alt = recipe.strMeal;
    modalImg.onerror = () => { modalImg.src = FALLBACK_IMG; };
    modalCategory.textContent = recipe.strCategory || "";
    modalArea.textContent = recipe.strArea || "";
    modalSource.href = recipe.strSource || "#";
    modalSource.style.display = recipe.strSource ? "inline-flex" : "none";

    // Generate ingredients list
    const ingredients = generateIngredientsList(recipe);
    modalIngredients.innerHTML = ingredients || '<li>No ingredients listed</li>';

    // Format instructions
    const instructions = (recipe.strInstructions || "")
      .split("\n")
      .filter((step) => step.trim())
      .map((step, index) => `<p><strong>${index + 1}.</strong> ${step.trim()}</p>`)
      .join("");
    modalInstructions.innerHTML = instructions || "<p>Instructions not available.</p>";

    // Show modal
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error opening recipe modal:", error);
    alert("Sorry, couldn't load recipe details. Please try again.");
  }
}

function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "";
  selectedRecipe = null;
}

// ===== MEAL PLAN MODAL =====
function openMealPlanModal() {
  if (!selectedRecipe) return;

  mealPlanModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMealPlanModal() {
  mealPlanModal.classList.remove("active");
  document.body.style.overflow = "";
}

// Add meal to plan
confirmAddMealBtn.addEventListener("click", () => {
  if (!selectedRecipe) return;

  const day = mealDaySelect.value;
  const mealType = mealTypeSelect.value;
  const servings = parseInt(servingsInput.value) || 2;

  // Create meal object
  const meal = {
    id: selectedRecipe.idMeal,
    name: selectedRecipe.strMeal,
    image: selectedRecipe.strMealThumb,
    category: selectedRecipe.strCategory,
    area: selectedRecipe.strArea,
    servings: servings
  };

  // Save to localStorage for meal planner
  const mealPlan = JSON.parse(localStorage.getItem("mealPlan") || "{}");
  const currentWeek = getCurrentWeekKey();

  if (!mealPlan[currentWeek]) {
    mealPlan[currentWeek] = {};
  }
  if (!mealPlan[currentWeek][day]) {
    mealPlan[currentWeek][day] = {};
  }
  if (!mealPlan[currentWeek][day][mealType]) {
    mealPlan[currentWeek][day][mealType] = [];
  }

  mealPlan[currentWeek][day][mealType].push(meal);
  localStorage.setItem("mealPlan", JSON.stringify(mealPlan));

  // Close modal and show success message
  closeMealPlanModal();

  // Show success feedback
  const successMessage = document.createElement("div");
  successMessage.className = "success-message";
  successMessage.textContent = `${meal.name} added to ${day} ${mealType}!`;
  successMessage.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(successMessage);

  setTimeout(() => {
    successMessage.remove();
  }, 3000);
});

// ===== UTILITY FUNCTIONS =====
function generateIngredientsList(recipe) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];

    if (ingredient && String(ingredient).trim()) {
      const measureText = measure ? String(measure).trim() : "";
      ingredients.push(`<li><strong>${measureText}</strong> ${String(ingredient).trim()}</li>`);
    }
  }

  return ingredients.join("");
}

function getCurrentWeekKey() {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  return startOfWeek.toISOString().split('T')[0];
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ===== DEBOUNCE FUNCTION =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadLocalRecipes();
  loadPreferences();
  loadFavorites();
  loadFeaturedRecipes();
  setupInfiniteScroll();
});

// Load featured recipes
async function loadFeaturedRecipes() {
  const featuredGrid = document.getElementById('featured-grid');
  if (!featuredGrid) return;

  try {
    // Featured recipe IDs (popular recipes)
    const featuredIds = [
      '52772', // Teriyaki Chicken Casserole
      '52959', // Baked salmon with fennel & tomatoes
      '53013', // Beef and Mustard Pie
      '52977'  // Corba
    ];

    const featuredRecipes = [];

    // Load featured recipes from API
    for (const id of featuredIds) {
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        if (data.meals && data.meals[0]) {
          featuredRecipes.push({ ...data.meals[0], isLocal: false });
        }
      } catch (error) {
        console.error(`Error loading featured recipe ${id}:`, error);
      }
    }

    // Add some local recipes if we have them
    if (localRecipesCache && localRecipesCache.length > 0) {
      const localFeatured = localRecipesCache.slice(0, 2).map(recipe => ({ ...recipe, isLocal: true }));
      featuredRecipes.push(...localFeatured);
    }

    // Render featured recipes
    featuredGrid.innerHTML = featuredRecipes.map(recipe => createFeaturedCard(recipe)).join('');

  } catch (error) {
    console.error('Error loading featured recipes:', error);
    featuredGrid.innerHTML = '<p class="text-center text-gray-500">Featured recipes will appear here</p>';
  }
}

// Create featured recipe card
function createFeaturedCard(recipe) {
  const imgSrc = recipe.strMealThumb || FALLBACK_IMG;
  const localBadge = recipe.isLocal ? '<span class="featured-badge">Local</span>' : '';
  const favActive = isFavorite(recipe.idMeal) ? 'btn-fav--active' : '';

  return `
        <div class="featured-card">
            <div class="featured-image">
                <img src="${imgSrc}" alt="${recipe.strMeal}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
                ${localBadge}
            </div>
            <div class="featured-content">
                <h3 class="featured-title">${recipe.strMeal}</h3>
                <div class="featured-meta">
                    <span class="featured-category">${recipe.strCategory || ''}</span>
                    <span class="featured-area">${recipe.strArea || ''}</span>
                </div>
                <div class="featured-actions">
                    <button class="btn btn-secondary btn-fav ${favActive}" aria-label="Toggle favorite" title="Save">❤</button>
                    <button class="btn btn-primary view-recipe" data-meal-id="${recipe.idMeal}">View Recipe</button>
                </div>
            </div>
        </div>
    `;
}

function renderResultsPage() {
  const startIndex = pageIndex * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageResults = filteredResults.slice(startIndex, endIndex);

  if (pageIndex === 0) {
    searchResult.innerHTML = '';
  }

  pageResults.forEach(recipe => {
    const recipeCard = createRecipeCard(recipe);
    searchResult.appendChild(recipeCard);
  });

  // Check if we have more results
  if (endIndex >= filteredResults.length) {
    hasMoreResults = false;
    showEndOfResults();
  }

  updateResultsCount();
}
