// Shopping List JavaScript
class ShoppingList {
    constructor() {
        this.shoppingList = this.loadShoppingList();
        this.init();
    }

    init() {
        this.renderShoppingList();
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Add item form
        document.getElementById('add-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addItem();
        });

        // Clear all button
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearList();
        });

        // Print button
        document.getElementById('print-list').addEventListener('click', () => {
            this.printList();
        });

        // Export CSV button
        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Clear purchased button
        document.getElementById('clear-purchased').addEventListener('click', () => {
            this.clearPurchased();
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) {
                this.removeItem(e.target.dataset.id);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                this.toggleItem(e.target.dataset.id);
            }
        });

        // Handle editable item names
        document.addEventListener('blur', (e) => {
            if (e.target.classList.contains('item-name')) {
                this.updateItemName(e.target.dataset.id, e.target.textContent);
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('item-name') && e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    loadShoppingList() {
        const saved = localStorage.getItem('shoppingList');
        return saved ? JSON.parse(saved) : [];
    }

    saveShoppingList() {
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
    }

    // Unit normalization and conversion
    normalizeUnit(unit) {
        const unitMap = {
            // Volume units
            'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
            'l': 'l', 'liter': 'l', 'liters': 'l', 'litre': 'l', 'litres': 'l',
            'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
            'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
            'cup': 'cup', 'cups': 'cup',
            'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',

            // Weight units
            'g': 'g', 'gram': 'g', 'grams': 'g',
            'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
            'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
            'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',

            // Count units
            'count': 'count', 'piece': 'count', 'pieces': 'count', 'item': 'count', 'items': 'count',
            'bunch': 'bunch', 'bunches': 'bunch',
            'pack': 'pack', 'packs': 'pack', 'package': 'pack', 'packages': 'pack'
        };

        return unitMap[unit.toLowerCase()] || unit.toLowerCase();
    }

    convertUnit(amount, fromUnit, toUnit) {
        const normalizedFrom = this.normalizeUnit(fromUnit);
        const normalizedTo = this.normalizeUnit(toUnit);

        if (normalizedFrom === normalizedTo) return amount;

        // Convert to base units first
        let baseAmount = this.toBaseUnit(amount, normalizedFrom);
        if (baseAmount === null) return null;

        // Convert from base to target unit
        return this.fromBaseUnit(baseAmount, normalizedTo);
    }

    toBaseUnit(amount, unit) {
        const conversions = {
            // Volume (ml as base)
            'ml': amount,
            'l': amount * 1000,
            'tsp': amount * 4.93,
            'tbsp': amount * 14.79,
            'cup': amount * 236.59,
            'fl oz': amount * 29.57,

            // Weight (g as base)
            'g': amount,
            'kg': amount * 1000,
            'oz': amount * 28.35,
            'lb': amount * 453.59,

            // Count (no conversion)
            'count': amount,
            'bunch': amount,
            'pack': amount
        };

        return conversions[unit] || null;
    }

    fromBaseUnit(baseAmount, unit) {
        const conversions = {
            // Volume (ml as base)
            'ml': baseAmount,
            'l': baseAmount / 1000,
            'tsp': baseAmount / 4.93,
            'tbsp': baseAmount / 14.79,
            'cup': baseAmount / 236.59,
            'fl oz': baseAmount / 29.57,

            // Weight (g as base)
            'g': baseAmount,
            'kg': baseAmount / 1000,
            'oz': baseAmount / 28.35,
            'lb': baseAmount / 453.59,

            // Count (no conversion)
            'count': baseAmount,
            'bunch': baseAmount,
            'pack': baseAmount
        };

        return conversions[unit] || baseAmount;
    }

    canConvert(fromUnit, toUnit) {
        const normalizedFrom = this.normalizeUnit(fromUnit);
        const normalizedTo = this.normalizeUnit(toUnit);

        if (normalizedFrom === normalizedTo) return true;

        // Check if both are volume units
        const volumeUnits = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz'];
        if (volumeUnits.includes(normalizedFrom) && volumeUnits.includes(normalizedTo)) {
            return true;
        }

        // Check if both are weight units
        const weightUnits = ['g', 'kg', 'oz', 'lb'];
        if (weightUnits.includes(normalizedFrom) && weightUnits.includes(normalizedTo)) {
            return true;
        }

        // Check if both are count units
        const countUnits = ['count', 'bunch', 'pack'];
        if (countUnits.includes(normalizedFrom) && countUnits.includes(normalizedTo)) {
            return true;
        }

        return false;
    }

    aggregateItems() {
        const aggregated = {};

        this.shoppingList.forEach(item => {
            const key = `${item.name.toLowerCase().trim()}_${this.normalizeUnit(item.unit)}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    name: item.name,
                    amount: 0,
                    unit: item.unit,
                    category: item.category,
                    checked: item.checked,
                    id: item.id
                };
            }

            // Try to convert and add amounts
            const normalizedUnit = this.normalizeUnit(item.unit);
            const baseUnit = this.normalizeUnit(aggregated[key].unit);

            if (this.canConvert(normalizedUnit, baseUnit)) {
                const convertedAmount = this.convertUnit(item.amount, normalizedUnit, baseUnit);
                if (convertedAmount !== null) {
                    aggregated[key].amount += convertedAmount;
                    aggregated[key].unit = baseUnit;
                } else {
                    aggregated[key].amount += item.amount;
                }
            } else {
                // If conversion not possible, just add as separate items
                aggregated[key].amount += item.amount;
            }

            // If any item is checked, mark aggregated as checked
            if (item.checked) {
                aggregated[key].checked = true;
            }
        });

        return Object.values(aggregated);
    }

    renderShoppingList() {
        const container = document.getElementById('shopping-list-container');
        const aggregatedItems = this.aggregateItems();

        if (aggregatedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Your shopping list is empty</h3>
                    <p>Add items to get started, or generate a list from your meal plan.</p>
                </div>
            `;
            return;
        }

        const groupedItems = this.groupByCategory(aggregatedItems);

        container.innerHTML = Object.entries(groupedItems).map(([category, items]) => `
            <div class="shopping-category">
                <h3 class="category-title">${category}</h3>
                <div class="category-items">
                    ${items.map(item => this.createItemElement(item)).join('')}
                </div>
            </div>
        `).join('');
    }

    groupByCategory(items) {
        const grouped = {};
        items.forEach(item => {
            const category = item.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });
        return grouped;
    }

    createItemElement(item) {
        const id = item.id || this.generateId();
        const displayAmount = this.formatAmount(item.amount, item.unit);

        return `
            <div class="shopping-item ${item.checked ? 'checked' : ''}" data-id="${id}">
                <label class="item-checkbox">
                    <input type="checkbox" class="item-checkbox-input" data-id="${id}" ${item.checked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="item-content">
                    <div class="item-name" contenteditable="true" data-id="${id}">${item.name}</div>
                    <div class="item-quantity">${displayAmount}</div>
                </div>
                <button class="remove-item" data-id="${id}" aria-label="Remove item">×</button>
            </div>
        `;
    }

    formatAmount(amount, unit) {
        // Round to reasonable precision
        let roundedAmount = amount;
        if (amount >= 1) {
            roundedAmount = Math.round(amount * 100) / 100;
        } else {
            roundedAmount = Math.round(amount * 1000) / 1000;
        }

        // Remove trailing zeros
        const formatted = roundedAmount.toString().replace(/\.?0+$/, '');

        return `${formatted} ${unit}`;
    }

    addItem() {
        const nameInput = document.getElementById('item-name');
        const quantityInput = document.getElementById('item-quantity');
        const categoryInput = document.getElementById('item-category');

        const name = nameInput.value.trim();
        const quantity = parseFloat(quantityInput.value) || 1;
        const category = categoryInput.value || 'Other';

        if (!name) return;

        const item = {
            id: this.generateId(),
            name: name,
            amount: quantity,
            unit: 'count',
            category: category,
            checked: false
        };

        this.shoppingList.push(item);
        this.saveShoppingList();
        this.renderShoppingList();
        this.updateStats();

        // Clear form
        nameInput.value = '';
        quantityInput.value = '1';
        categoryInput.value = '';
        nameInput.focus();
    }

    removeItem(id) {
        this.shoppingList = this.shoppingList.filter(item => item.id !== id);
        this.saveShoppingList();
        this.renderShoppingList();
        this.updateStats();
    }

    toggleItem(id) {
        const item = this.shoppingList.find(item => item.id === id);
        if (item) {
            item.checked = !item.checked;
            this.saveShoppingList();
            this.updateStats();
        }
    }

    updateItemName(id, newName) {
        const item = this.shoppingList.find(item => item.id === id);
        if (item && newName.trim()) {
            item.name = newName.trim();
            this.saveShoppingList();
        }
    }

    clearPurchased() {
        if (confirm('Remove all checked items from the list?')) {
            this.shoppingList = this.shoppingList.filter(item => !item.checked);
            this.saveShoppingList();
            this.renderShoppingList();
            this.updateStats();
        }
    }

    clearList() {
        if (confirm('Are you sure you want to clear all items?')) {
            this.shoppingList = [];
            this.saveShoppingList();
            this.renderShoppingList();
            this.updateStats();
        }
    }

    updateStats() {
        const totalItems = this.shoppingList.length;
        const checkedItems = this.shoppingList.filter(item => item.checked).length;
        const remainingItems = totalItems - checkedItems;

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('checked-items').textContent = checkedItems;
        document.getElementById('remaining-items').textContent = remainingItems;

        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }

    calculateEstimatedCost() {
        // Simple cost estimation based on categories
        const categoryCosts = {
            'Produce': 2.50,
            'Protein': 8.00,
            'Dairy': 4.00,
            'Grains': 3.00,
            'Pantry': 1.50,
            'Other': 2.00
        };

        const aggregatedItems = this.aggregateItems();
        let totalCost = 0;

        aggregatedItems.forEach(item => {
            const baseCost = categoryCosts[item.category] || 2.00;
            totalCost += baseCost * item.amount;
        });

        return totalCost;
    }

    printList() {
        const aggregatedItems = this.aggregateItems();
        const groupedItems = this.groupByCategory(aggregatedItems);

        let printContent = `
            <html>
            <head>
                <title>Shopping List</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .category { margin-bottom: 20px; }
                    .category-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .item { margin: 5px 0; }
                    .checked { text-decoration: line-through; color: #999; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <h1>Shopping List</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
        `;

        Object.entries(groupedItems).forEach(([category, items]) => {
            printContent += `
                <div class="category">
                    <div class="category-title">${category}</div>
                    ${items.map(item => `
                        <div class="item ${item.checked ? 'checked' : ''}">
                            □ ${item.name} - ${this.formatAmount(item.amount, item.unit)}
                        </div>
                    `).join('')}
                </div>
            `;
        });

        printContent += `
                <div class="no-print">
                    <p>Estimated cost: $${this.calculateEstimatedCost().toFixed(2)}</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    exportToCSV() {
        const aggregatedItems = this.aggregateItems();
        const headers = ['Category', 'Name', 'Quantity', 'Unit', 'Status'];
        const rows = aggregatedItems.map(item => [
            item.category,
            item.name,
            item.amount,
            item.unit,
            item.checked ? 'Purchased' : 'Pending'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize shopping list when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShoppingList();
});
