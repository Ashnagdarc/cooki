// Meal Planner JavaScript
class MealPlanner {
    constructor() {
        this.currentWeek = new Date();
        this.mealPlan = this.loadMealPlan();
        this.selectedRecipe = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.updateWeekDisplay();
    }

    setupEventListeners() {
        // Week navigation
        document.getElementById('prev-week').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('next-week').addEventListener('click', () => this.navigateWeek(1));

        // Quick actions
        document.getElementById('generate-shopping-list').addEventListener('click', () => this.generateShoppingList());
        document.getElementById('clear-week').addEventListener('click', () => this.clearWeek());

        // Print and share actions
        document.getElementById('print-plan').addEventListener('click', () => this.printMealPlan());
        document.getElementById('share-plan').addEventListener('click', () => this.openShareModal());
        document.getElementById('import-plan').addEventListener('click', () => this.openImportModal());
        document.getElementById('keyboard-nav').addEventListener('click', () => this.openKeyboardNavModal());

        // Quick add recipe
        const quickSearch = document.getElementById('quick-recipe-search');
        quickSearch.addEventListener('input', this.debounce(() => this.searchRecipes(quickSearch.value), 300));

        // Modal events
        document.getElementById('recipe-search-modal-close').addEventListener('click', () => this.closeModal('recipe-search-modal'));
        document.getElementById('meal-plan-modal-close').addEventListener('click', () => this.closeModal('meal-plan-modal'));
        document.getElementById('share-modal-close').addEventListener('click', () => this.closeModal('share-modal'));
        document.getElementById('import-modal-close').addEventListener('click', () => this.closeModal('import-modal'));
        document.getElementById('keyboard-nav-modal-close').addEventListener('click', () => this.closeModal('keyboard-nav-modal'));
        document.getElementById('confirm-add-meal').addEventListener('click', () => this.addRecipeToPlan());
        document.getElementById('cancel-add-meal').addEventListener('click', () => this.closeModal('meal-plan-modal'));

        // Share modal events
        document.getElementById('copy-link').addEventListener('click', () => this.copyShareLink());
        document.getElementById('download-json').addEventListener('click', () => this.downloadMealPlan());

        // Import modal events
        document.getElementById('upload-file').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
        document.getElementById('import-from-url').addEventListener('click', () => this.importFromUrl());
        document.getElementById('confirm-import').addEventListener('click', () => this.confirmImport());
        document.getElementById('cancel-import').addEventListener('click', () => this.cancelImport());

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
            this.handleKeyboardNavigation(e);
        });

        // Check for shared plan in URL on page load
        this.checkForSharedPlan();
    }

    // Keyboard navigation handler
    handleKeyboardNavigation(e) {
        // Don't handle shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
            return;
        }

        // Don't handle shortcuts when modals are open (except for Escape)
        if (e.key !== 'Escape' && document.querySelector('.modal.active')) {
            return;
        }

        switch (e.key) {
            case 'Escape':
                this.closeAllModals();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.navigateWeek(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.navigateWeek(1);
                break;
            case 'Home':
                e.preventDefault();
                this.goToCurrentWeek();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
                e.preventDefault();
                this.navigateToDay(parseInt(e.key));
                break;
            case 'b':
            case 'B':
                e.preventDefault();
                this.highlightMealType('breakfast');
                break;
            case 'l':
            case 'L':
                e.preventDefault();
                this.highlightMealType('lunch');
                break;
            case 'd':
            case 'D':
                e.preventDefault();
                this.highlightMealType('dinner');
                break;
            case 's':
            case 'S':
                e.preventDefault();
                this.highlightMealType('snack');
                break;
            case ' ':
                e.preventDefault();
                this.openModal('recipe-search-modal');
                break;
            case 'g':
            case 'G':
                e.preventDefault();
                this.generateShoppingList();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.printMealPlan();
                break;
            case '?':
                e.preventDefault();
                this.openKeyboardNavModal();
                break;
        }
    }

    // Navigate to specific day
    navigateToDay(dayNumber) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const day = days[dayNumber - 1];

        // Scroll to the day column
        const dayElement = document.querySelector(`[data-day="${day}"]`);
        if (dayElement) {
            dayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            dayElement.classList.add('keyboard-focus');
            setTimeout(() => dayElement.classList.remove('keyboard-focus'), 2000);
        }

        this.showToast(`Navigated to ${day.charAt(0).toUpperCase() + day.slice(1)}`);
    }

    // Highlight meal type
    highlightMealType(mealType) {
        const mealSlots = document.querySelectorAll(`[data-meal="${mealType}"]`);
        mealSlots.forEach(slot => {
            slot.classList.add('keyboard-focus');
            setTimeout(() => slot.classList.remove('keyboard-focus'), 2000);
        });

        this.showToast(`Highlighted ${mealType} slots`);
    }

    // Go to current week
    goToCurrentWeek() {
        const now = new Date();
        this.currentWeek = this.getStartOfWeek(now);
        this.updateWeekDisplay();
        this.renderCalendar();
        this.showToast('Navigated to current week');
    }

    // Open keyboard navigation modal
    openKeyboardNavModal() {
        this.openModal('keyboard-nav-modal');
    }

    navigateWeek(direction) {
        this.currentWeek.setDate(this.currentWeek.getDate() + (direction * 7));
        this.updateWeekDisplay();
        this.renderCalendar();
    }

    updateWeekDisplay() {
        const startOfWeek = this.getStartOfWeek(this.currentWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const options = { month: 'long', day: 'numeric' };
        const startStr = startOfWeek.toLocaleDateString('en-US', options);
        const endStr = endOfWeek.toLocaleDateString('en-US', options);

        document.getElementById('current-week').textContent = `${startStr} - ${endStr}`;
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    renderCalendar() {
        const calendar = document.getElementById('meal-calendar');
        const startOfWeek = this.getStartOfWeek(this.currentWeek);

        calendar.innerHTML = '';

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

        // Create header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = '<div class="time-slot"></div>';
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <div class="day-name">${day}</div>
                <div class="day-date">${this.getDayDate(startOfWeek, days.indexOf(day))}</div>
            `;
            header.appendChild(dayHeader);
        });
        calendar.appendChild(header);

        // Create meal type rows
        mealTypes.forEach(mealType => {
            const row = document.createElement('div');
            row.className = 'calendar-row';

            // Meal type label
            const mealLabel = document.createElement('div');
            mealLabel.className = 'meal-type-label';
            mealLabel.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
            row.appendChild(mealLabel);

            // Day slots
            days.forEach(day => {
                const slot = document.createElement('div');
                slot.className = 'meal-slot';
                slot.dataset.day = day.toLowerCase();
                slot.dataset.mealType = mealType;
                slot.dataset.meal = mealType; // Add for keyboard navigation

                const weekKey = this.getWeekKey();
                const meals = this.mealPlan[weekKey]?.[day.toLowerCase()]?.[mealType] || [];

                meals.forEach(meal => {
                    const mealCard = this.createMealCard(meal);
                    slot.appendChild(mealCard);
                });

                // Add drop zone functionality
                slot.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    slot.classList.add('drag-over');
                });

                slot.addEventListener('dragleave', () => {
                    slot.classList.remove('drag-over');
                });

                slot.addEventListener('drop', (e) => {
                    e.preventDefault();
                    slot.classList.remove('drag-over');
                    this.handleDrop(e, slot);
                });

                row.appendChild(slot);
            });

            calendar.appendChild(row);
        });
    }

    getDayDate(startOfWeek, dayIndex) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + dayIndex);
        return date.getDate();
    }

    getWeekKey() {
        const startOfWeek = this.getStartOfWeek(this.currentWeek);
        return startOfWeek.toISOString().split('T')[0];
    }

    createMealCard(meal) {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.draggable = true;
        card.dataset.recipeId = meal.id;
        card.dataset.servings = meal.servings;

        card.innerHTML = `
            <div class="meal-card-content">
                <img src="${meal.image}" alt="${meal.name}" class="meal-image">
                <div class="meal-info">
                    <h4 class="meal-name">${meal.name}</h4>
                    <span class="meal-servings">${meal.servings} servings</span>
                </div>
                <button class="meal-remove" aria-label="Remove meal">×</button>
            </div>
        `;

        // Add drag functionality
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(meal));
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        // Remove meal functionality
        card.querySelector('.meal-remove').addEventListener('click', () => {
            this.removeMeal(meal);
        });

        return card;
    }

    handleDrop(e, slot) {
        const mealData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const day = slot.dataset.day;
        const mealType = slot.dataset.mealType;

        this.addMealToSlot(mealData, day, mealType);
    }

    addMealToSlot(meal, day, mealType) {
        const weekKey = this.getWeekKey();

        if (!this.mealPlan[weekKey]) {
            this.mealPlan[weekKey] = {};
        }
        if (!this.mealPlan[weekKey][day]) {
            this.mealPlan[weekKey][day] = {};
        }
        if (!this.mealPlan[weekKey][day][mealType]) {
            this.mealPlan[weekKey][day][mealType] = [];
        }

        this.mealPlan[weekKey][day][mealType].push(meal);
        this.saveMealPlan();
        this.renderCalendar();
    }

    removeMeal(meal) {
        const weekKey = this.getWeekKey();

        Object.keys(this.mealPlan[weekKey] || {}).forEach(day => {
            Object.keys(this.mealPlan[weekKey][day] || {}).forEach(mealType => {
                this.mealPlan[weekKey][day][mealType] = this.mealPlan[weekKey][day][mealType].filter(m => m.id !== meal.id);
            });
        });

        this.saveMealPlan();
        this.renderCalendar();
    }

    async searchRecipes(query) {
        if (!query.trim()) {
            document.getElementById('quick-search-results').innerHTML = '';
            return;
        }

        // Show skeletons while searching
        this.showSkeletons(4);

        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
            const data = await response.json();

            // Hide skeletons
            this.hideSkeletons();

            const resultsContainer = document.getElementById('modal-results');
            resultsContainer.innerHTML = '';

            if (data.meals && data.meals.length > 0) {
                data.meals.slice(0, 8).forEach(meal => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'recipe-card';
                    resultItem.innerHTML = `
                        <div class="recipe-image">
                            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" 
                                 onerror="this.src='data:image/svg+xml,${encodeURIComponent(this.getFallbackSVG())}'">
                        </div>
                        <div class="recipe-content">
                            <h3 class="recipe-title">${meal.strMeal}</h3>
                            <div class="recipe-meta">
                                <span class="recipe-category">${meal.strCategory}</span>
                                <span class="recipe-area">${meal.strArea}</span>
                            </div>
                            <div class="recipe-actions">
                                <button class="btn btn-primary add-to-plan" data-id="${meal.idMeal}">Add to Plan</button>
                            </div>
                        </div>
                    `;

                    resultItem.addEventListener('click', (e) => {
                        if (e.target.classList.contains('add-to-plan')) {
                            this.selectRecipe(meal);
                        }
                    });

                    resultsContainer.appendChild(resultItem);
                });
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Error searching recipes:', error);
            this.hideSkeletons();
            this.showNoResults();
        }
    }

    getFallbackSVG() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
            <rect width="300" height="200" fill="#f3f4f6"/>
            <text x="150" y="100" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
                Recipe Image
            </text>
        </svg>`;
    }

    selectRecipe(recipe) {
        this.selectedRecipe = {
            id: recipe.idMeal,
            name: recipe.strMeal,
            image: recipe.strMealThumb,
            category: recipe.strCategory,
            area: recipe.strArea
        };

        this.openModal('meal-plan-modal');
    }

    addRecipeToPlan() {
        if (!this.selectedRecipe) return;

        const day = document.getElementById('meal-day').value;
        const mealType = document.getElementById('meal-type').value;
        const servings = parseInt(document.getElementById('servings').value);

        const meal = {
            ...this.selectedRecipe,
            servings: servings
        };

        this.addMealToSlot(meal, day, mealType);
        this.closeModal('meal-plan-modal');
        this.selectedRecipe = null;
    }

    // Parse measure string to {amount, unit}
    parseMeasure(measureRaw) {
        if (!measureRaw) return { amount: 1, unit: 'count' };
        const measure = String(measureRaw).trim().toLowerCase();
        const parts = measure.match(/([\d\.\/]+)\s*(.*)/);
        let amount = 1; let unit = 'count';
        if (parts) {
            const numStr = parts[1];
            // handle fractions like 1/2
            if (numStr.includes('/')) {
                const [a, b] = numStr.split('/').map(Number);
                amount = b ? (a / b) : Number(numStr) || 1;
            } else {
                amount = Number(numStr) || 1;
            }
            unit = (parts[2] || '').trim();
        }
        // normalize some unit aliases
        unit = unit.replace(/teaspoons?/, 'tsp')
            .replace(/tablespoons?/, 'tbsp')
            .replace(/litres?|liters?/, 'l')
            .replace(/grams?/, 'g')
            .replace(/kilograms?/, 'kg')
            .replace(/ounces?/, 'oz')
            .replace(/pounds?/, 'lb')
            .replace(/cups?/, 'cup');
        if (!unit) unit = 'count';
        return { amount, unit };
    }

    async generateShoppingList() {
        const weekKey = this.getWeekKey();
        const weekMeals = this.mealPlan[weekKey] || {};

        const items = [];

        // Collect and parse ingredients per meal via API lookup
        const fetches = [];
        Object.values(weekMeals).forEach(day => {
            Object.values(day).forEach(meals => {
                meals.forEach(meal => {
                    fetches.push((async () => {
                        try {
                            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.id}`);
                            const data = await res.json();
                            const recipe = data?.meals?.[0];
                            if (!recipe) return;
                            for (let i = 1; i <= 20; i++) {
                                const ing = recipe[`strIngredient${i}`];
                                const meas = recipe[`strMeasure${i}`];
                                if (ing && ing.trim()) {
                                    const { amount, unit } = this.parseMeasure(meas);
                                    items.push({
                                        name: ing.trim(),
                                        amount: amount * (meal.servings || 1),
                                        unit: unit,
                                        category: this.categorizeIngredient(ing),
                                        checked: false
                                    });
                                }
                            }
                        } catch { /* ignore */ }
                    })());
                });
            });
        });

        await Promise.all(fetches);

        // Save to localStorage for shopping list page
        localStorage.setItem('shoppingList', JSON.stringify(items));

        // Navigate to shopping list
        window.location.href = 'shopping-list.html';
    }

    categorizeIngredient(ingredient) {
        const categories = {
            'Produce': ['onion', 'garlic', 'tomato', 'lettuce', 'carrot', 'potato', 'lemon', 'herbs', 'vegetables', 'pepper', 'spinach', 'ginger'],
            'Protein': ['beef', 'chicken', 'fish', 'pork', 'eggs', 'beans', 'tofu', 'lamb'],
            'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream'],
            'Grains': ['rice', 'pasta', 'bread', 'flour', 'cereal', 'noodles', 'oats'],
            'Pantry': ['oil', 'sauce', 'spices', 'sugar', 'salt', 'vinegar', 'stock', 'broth', 'tomato paste']
        };

        const lowerIngredient = ingredient.toLowerCase();
        for (const [category, items] of Object.entries(categories)) {
            if (items.some(item => lowerIngredient.includes(item))) {
                return category;
            }
        }
        return 'Other';
    }

    clearWeek() {
        if (confirm('Are you sure you want to clear all meals for this week?')) {
            const weekKey = this.getWeekKey();
            delete this.mealPlan[weekKey];
            this.saveMealPlan();
            this.renderCalendar();
        }
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

    loadMealPlan() {
        const saved = localStorage.getItem('mealPlan');
        return saved ? JSON.parse(saved) : {};
    }

    saveMealPlan() {
        localStorage.setItem('mealPlan', JSON.stringify(this.mealPlan));
    }

    debounce(func, wait) {
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

    // Skeleton loading functions
    showSkeletons(count = 4) {
        const skeletonGrid = document.getElementById('modal-skeleton-grid');
        const modalResults = document.getElementById('modal-results');
        const noResults = document.getElementById('modal-no-results');

        skeletonGrid.innerHTML = '';
        skeletonGrid.style.display = 'grid';
        modalResults.style.display = 'none';
        noResults.style.display = 'none';

        for (let i = 0; i < count; i++) {
            const skeletonCard = this.createSkeletonCard();
            skeletonGrid.appendChild(skeletonCard);
        }
    }

    hideSkeletons() {
        const skeletonGrid = document.getElementById('modal-skeleton-grid');
        const modalResults = document.getElementById('modal-results');

        skeletonGrid.style.display = 'none';
        modalResults.style.display = 'block';
    }

    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-recipe-card';
        card.style.height = '100px';
        card.style.display = 'flex';

        card.innerHTML = `
            <div class="skeleton-recipe-image skeleton" style="width: 100px; height: 100px; flex-shrink: 0;"></div>
            <div class="skeleton-recipe-content" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div class="skeleton-recipe-title skeleton"></div>
                <div class="skeleton-recipe-meta skeleton"></div>
                <div class="skeleton-recipe-actions">
                    <div class="skeleton-btn skeleton" style="width: 80px;"></div>
                </div>
            </div>
        `;

        return card;
    }

    showLoadingSpinner() {
        const loadingSpinner = document.getElementById('modal-loading-spinner');
        const noResults = document.getElementById('modal-no-results');

        loadingSpinner.style.display = 'inline-block';
        noResults.style.display = 'none';
    }

    hideLoadingSpinner() {
        const loadingSpinner = document.getElementById('modal-loading-spinner');
        loadingSpinner.style.display = 'none';
    }

    showNoResults() {
        const noResults = document.getElementById('modal-no-results');
        const loadingSpinner = document.getElementById('modal-loading-spinner');

        noResults.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }

    // Toast notification system
    showToast(message, duration = 3000) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close notification">×</button>
            </div>
        `;

        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            word-wrap: break-word;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // Add to page
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);

        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    }
}

// Initialize meal planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MealPlanner();
});
