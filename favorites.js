// Favorites Page JavaScript
class FavoritesManager {
    constructor() {
        this.favorites = this.loadFavorites();
        this.allRecipes = [];
        this.filteredRecipes = [];
        this.selectedRecipe = null;
        this.isListView = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAllRecipes();
        this.renderFavorites();
        this.updateStats();
    }

    // Skeleton loading functions
    showSkeletons(count = 6) {
        const skeletonGrid = document.getElementById('skeleton-grid');
        const favoritesResults = document.getElementById('favorites-results');
        const emptyFavorites = document.getElementById('empty-favorites');

        skeletonGrid.innerHTML = '';
        skeletonGrid.style.display = 'grid';
        favoritesResults.style.display = 'none';
        emptyFavorites.style.display = 'none';

        for (let i = 0; i < count; i++) {
            const skeletonCard = this.createSkeletonCard();
            skeletonGrid.appendChild(skeletonCard);
        }
    }

    hideSkeletons() {
        const skeletonGrid = document.getElementById('skeleton-grid');
        const favoritesResults = document.getElementById('favorites-results');

        skeletonGrid.style.display = 'none';
        favoritesResults.style.display = 'grid';
    }

    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-recipe-card';

        if (this.isListView) {
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

    setupEventListeners() {
        // Filter and sort elements
        const filterCategory = document.getElementById('filter-category');
        const filterArea = document.getElementById('filter-area');
        const filterLocal = document.getElementById('filter-local');
        const sortBy = document.getElementById('sort-by');
        const viewToggleBtn = document.getElementById('view-toggle-btn');

        // Filter and sort events
        [filterCategory, filterArea, filterLocal, sortBy].forEach(el => {
            el && el.addEventListener('change', () => this.applyFiltersAndSort());
        });

        // View toggle
        viewToggleBtn && viewToggleBtn.addEventListener('click', () => this.toggleView());

        // Quick actions
        document.getElementById('export-favorites').addEventListener('click', () => this.exportFavorites());
        document.getElementById('clear-favorites').addEventListener('click', () => this.clearAllFavorites());
        document.getElementById('add-to-meal-plan').addEventListener('click', () => this.addToMealPlan());

        // Modal events
        document.getElementById('recipe-modal-close').addEventListener('click', () => this.closeModal('recipe-modal'));
        document.getElementById('meal-plan-modal-close').addEventListener('click', () => this.closeModal('meal-plan-modal'));
        document.getElementById('cancel-add-meal').addEventListener('click', () => this.closeModal('meal-plan-modal'));
        document.getElementById('meal-plan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecipeToMealPlan();
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(e.target.closest('.modal').id);
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    loadFavorites() {
        try {
            return new Set(JSON.parse(localStorage.getItem('cooki:favorites') || '[]'));
        } catch {
            return new Set();
        }
    }

    saveFavorites() {
        localStorage.setItem('cooki:favorites', JSON.stringify(Array.from(this.favorites)));
    }

    async loadAllRecipes() {
        // Show skeletons while loading
        this.showSkeletons(6);

        // Load local Nigerian recipes
        try {
            const response = await fetch('./data/nigeria.json');
            const localRecipes = await response.json();
            this.allRecipes = localRecipes.map(recipe => ({
                ...recipe,
                isLocal: true
            }));
        } catch (error) {
            console.error('Error loading local recipes:', error);
            this.allRecipes = [];
        }

        // Load API recipes for favorites that aren't local
        const apiFavorites = Array.from(this.favorites).filter(id =>
            !this.allRecipes.find(recipe => recipe.idMeal === id)
        );

        if (apiFavorites.length > 0) {
            try {
                const promises = apiFavorites.map(async (id) => {
                    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
                    const data = await response.json();
                    return data.meals ? data.meals[0] : null;
                });
                const apiRecipes = await Promise.all(promises);
                this.allRecipes.push(...apiRecipes.filter(recipe => recipe !== null));
            } catch (error) {
                console.error('Error loading API recipes:', error);
            }
        }

        // Hide skeletons and render results
        this.hideSkeletons();
        this.populateFilters();
        this.applyFiltersAndSort();
    }

    populateFilters() {
        const categories = [...new Set(this.allRecipes.map(recipe => recipe.strCategory).filter(Boolean))];
        const areas = [...new Set(this.allRecipes.map(recipe => recipe.strArea).filter(Boolean))];

        const categorySelect = document.getElementById('filter-category');
        const areaSelect = document.getElementById('filter-area');

        // Populate category filter
        categorySelect.innerHTML = '<option value="">All Categories</option>';
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        // Populate area filter
        areaSelect.innerHTML = '<option value="">All Areas</option>';
        areas.sort().forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        });
    }

    applyFiltersAndSort() {
        const category = document.getElementById('filter-category').value;
        const area = document.getElementById('filter-area').value;
        const localOnly = document.getElementById('filter-local').checked;
        const sortBy = document.getElementById('sort-by').value;

        // Filter recipes
        this.filteredRecipes = this.allRecipes.filter(recipe => {
            if (!this.favorites.has(recipe.idMeal)) return false;
            if (category && recipe.strCategory !== category) return false;
            if (area && recipe.strArea !== area) return false;
            if (localOnly && !recipe.isLocal) return false;
            return true;
        });

        // Sort recipes
        this.filteredRecipes.sort((a, b) => {
            switch (sortBy) {
                case 'az':
                    return a.strMeal.localeCompare(b.strMeal);
                case 'za':
                    return b.strMeal.localeCompare(a.strMeal);
                case 'local':
                    if (a.isLocal && !b.isLocal) return -1;
                    if (!a.isLocal && b.isLocal) return 1;
                    return a.strMeal.localeCompare(b.strMeal);
                case 'category':
                    const catCompare = a.strCategory.localeCompare(b.strCategory);
                    return catCompare !== 0 ? catCompare : a.strMeal.localeCompare(b.strMeal);
                case 'recent':
                default:
                    // For recent, we'll use the order they appear in favorites (FIFO)
                    return 0;
            }
        });

        this.renderFavorites();
    }

    renderFavorites() {
        const container = document.getElementById('favorites-results');
        const emptyState = document.getElementById('empty-favorites');
        const skeletonGrid = document.getElementById('skeleton-grid');

        // Hide skeleton grid if it's showing
        skeletonGrid.style.display = 'none';

        if (this.filteredRecipes.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = this.filteredRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
    }

    createRecipeCard(recipe) {
        const isLocal = recipe.isLocal || false;
        const imageUrl = recipe.strMealThumb || this.getFallbackImage();

        return `
            <div class="recipe-card" data-id="${recipe.idMeal}">
                <div class="recipe-image">
                    <img src="${imageUrl}" alt="${recipe.strMeal}" 
                         onerror="this.src='data:image/svg+xml,${encodeURIComponent(this.getFallbackSVG())}'">
                    ${isLocal ? '<span class="recipe-local-badge">Local</span>' : ''}
                    <button class="favorite-btn btn-fav btn-fav--active" data-id="${recipe.idMeal}" aria-label="Remove from favorites">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.strMeal}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-category">${recipe.strCategory}</span>
                        <span class="recipe-area">${recipe.strArea}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="btn btn-primary view-recipe" data-id="${recipe.idMeal}">View Recipe</button>
                        <button class="btn btn-secondary add-to-plan" data-id="${recipe.idMeal}">Add to Plan</button>
                    </div>
                </div>
            </div>
        `;
    }

    getFallbackImage() {
        return 'data:image/svg+xml,' + encodeURIComponent(this.getFallbackSVG());
    }

    getFallbackSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
            <rect width="300" height="200" fill="#f3f4f6"/>
            <text x="150" y="100" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
                Recipe Image
            </text>
        </svg>`;
    }

    toggleView() {
        const container = document.getElementById('favorites-results');
        const viewToggleBtn = document.getElementById('view-toggle-btn');

        this.isListView = !this.isListView;

        if (this.isListView) {
            container.classList.add('list-view');
            viewToggleBtn.textContent = 'Grid View';
            viewToggleBtn.setAttribute('aria-pressed', 'true');
        } else {
            container.classList.remove('list-view');
            viewToggleBtn.textContent = 'List View';
            viewToggleBtn.setAttribute('aria-pressed', 'false');
        }
    }

    updateStats() {
        const totalFavorites = this.favorites.size;
        const localFavorites = this.allRecipes.filter(recipe =>
            this.favorites.has(recipe.idMeal) && recipe.isLocal
        ).length;
        const categories = new Set(
            this.allRecipes
                .filter(recipe => this.favorites.has(recipe.idMeal))
                .map(recipe => recipe.strCategory)
        ).size;

        document.getElementById('total-favorites').textContent = totalFavorites;
        document.getElementById('local-favorites').textContent = localFavorites;
        document.getElementById('categories-count').textContent = categories;
    }

    exportFavorites() {
        const headers = ['Name', 'Category', 'Area', 'Type', 'Image URL'];
        const rows = this.filteredRecipes.map(recipe => [
            recipe.strMeal,
            recipe.strCategory,
            recipe.strArea,
            recipe.isLocal ? 'Local' : 'API',
            recipe.strMealThumb || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `favorites-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.announce('Favorites exported successfully');
    }

    clearAllFavorites() {
        if (confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
            this.favorites.clear();
            this.saveFavorites();
            this.allRecipes = this.allRecipes.filter(recipe => !this.favorites.has(recipe.idMeal));
            this.applyFiltersAndSort();
            this.updateStats();
            this.announce('All favorites cleared');
        }
    }

    addToMealPlan() {
        if (this.filteredRecipes.length === 0) {
            this.announce('No recipes to add to meal plan');
            return;
        }

        // For now, just redirect to meal planner
        window.location.href = 'meal-planner.html';
    }

    async openRecipeModal(recipeId) {
        const recipe = this.allRecipes.find(r => r.idMeal === recipeId);
        if (!recipe) return;

        this.selectedRecipe = recipe;
        const modal = document.getElementById('recipe-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = recipe.strMeal;

        // If it's a local recipe, use the data directly
        if (recipe.isLocal) {
            modalBody.innerHTML = this.createRecipeModalContent(recipe);
        } else {
            // For API recipes, fetch detailed info
            try {
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
                const data = await response.json();
                const detailedRecipe = data.meals?.[0];
                if (detailedRecipe) {
                    modalBody.innerHTML = this.createRecipeModalContent(detailedRecipe);
                }
            } catch (error) {
                console.error('Error fetching recipe details:', error);
                modalBody.innerHTML = '<p>Error loading recipe details.</p>';
            }
        }

        this.openModal('recipe-modal');
    }

    createRecipeModalContent(recipe) {
        const imageUrl = recipe.strMealThumb || this.getFallbackImage();
        const ingredients = [];

        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push({
                    ingredient: ingredient.trim(),
                    measure: measure ? measure.trim() : ''
                });
            }
        }

        const instructions = recipe.strInstructions ?
            recipe.strInstructions.split('\n').filter(line => line.trim()) : [];

        return `
            <div class="recipe-modal-content">
                <div class="recipe-modal-image">
                    <img src="${imageUrl}" alt="${recipe.strMeal}" 
                         onerror="this.src='data:image/svg+xml,${encodeURIComponent(this.getFallbackSVG())}'">
                </div>
                <div class="recipe-modal-info">
                    <div class="recipe-modal-meta">
                        <span class="recipe-category">${recipe.strCategory}</span>
                        <span class="recipe-area">${recipe.strArea}</span>
                        ${recipe.isLocal ? '<span class="recipe-local-badge">Local Recipe</span>' : ''}
                    </div>
                    
                    ${ingredients.length > 0 ? `
                        <div class="recipe-ingredients">
                            <h3>Ingredients</h3>
                            <ul>
                                ${ingredients.map(item => `
                                    <li><strong>${item.measure}</strong> ${item.ingredient}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${instructions.length > 0 ? `
                        <div class="recipe-instructions">
                            <h3>Instructions</h3>
                            <ol>
                                ${instructions.map(instruction => `
                                    <li>${instruction}</li>
                                `).join('')}
                            </ol>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    addRecipeToMealPlan() {
        if (!this.selectedRecipe) return;

        const day = document.getElementById('meal-day').value;
        const mealType = document.getElementById('meal-type').value;
        const servings = parseInt(document.getElementById('servings').value);

        const meal = {
            id: this.selectedRecipe.idMeal,
            name: this.selectedRecipe.strMeal,
            image: this.selectedRecipe.strMealThumb || this.getFallbackImage(),
            category: this.selectedRecipe.strCategory,
            area: this.selectedRecipe.strArea,
            servings: servings
        };

        // Save to localStorage for meal planner
        const mealPlan = JSON.parse(localStorage.getItem('mealPlan') || '{}');
        const currentWeek = this.getCurrentWeekKey();

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
        localStorage.setItem('mealPlan', JSON.stringify(mealPlan));

        this.closeModal('meal-plan-modal');
        this.announce('Recipe added to meal plan!');
    }

    getCurrentWeekKey() {
        const now = new Date();
        const startOfWeek = this.getStartOfWeek(now);
        return startOfWeek.toISOString().split('T')[0];
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    announce(message) {
        const live = document.getElementById('aria-live');
        if (live) {
            live.textContent = '';
            setTimeout(() => live.textContent = message, 0);
        }
    }
}

// Event delegation for dynamic content
document.addEventListener('click', (e) => {
    const favoritesManager = window.favoritesManager;

    if (e.target.classList.contains('view-recipe')) {
        e.preventDefault();
        favoritesManager.openRecipeModal(e.target.dataset.id);
    }

    if (e.target.classList.contains('add-to-plan')) {
        e.preventDefault();
        favoritesManager.selectedRecipe = favoritesManager.allRecipes.find(r => r.idMeal === e.target.dataset.id);
        favoritesManager.openModal('meal-plan-modal');
    }

    if (e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('favorite-btn') ? e.target : e.target.closest('.favorite-btn');
        const recipeId = btn.dataset.id;

        favoritesManager.favorites.delete(recipeId);
        favoritesManager.saveFavorites();
        favoritesManager.allRecipes = favoritesManager.allRecipes.filter(r => r.idMeal !== recipeId);
        favoritesManager.applyFiltersAndSort();
        favoritesManager.updateStats();
        favoritesManager.announce('Recipe removed from favorites');
    }
});

// Initialize favorites manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.favoritesManager = new FavoritesManager();
});
