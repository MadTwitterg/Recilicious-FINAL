import { recipeService } from './recipe-service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const toggleFilters = document.getElementById('toggleFilters');
    const filtersPanel = document.getElementById('filtersPanel');
    const timeFilter = document.getElementById('timeFilter');
    const healthFilter = document.getElementById('healthFilter');
    const timeValue = document.getElementById('timeValue');
    const healthValue = document.getElementById('healthValue');

    // Toggle filters panel visibility
    toggleFilters.addEventListener('click', () => {
        filtersPanel.classList.toggle('active');
    });

    // Update range filter display values and slider backgrounds
    timeFilter.addEventListener('input', () => {
        timeValue.textContent = `${timeFilter.value} min`;
        updateSliderBackground(timeFilter);
    });

    healthFilter.addEventListener('input', () => {
        healthValue.textContent = healthFilter.value;
        updateSliderBackground(healthFilter);
    });

    // Update slider background gradient based on value
    function updateSliderBackground(slider) {
        // Calculate percentage of slider value
        const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        // Set gradient background to show progress
        slider.style.background = `linear-gradient(to right, var(--gradient-start) 0%, var(--gradient-start) ${value}%, var(--background-color) ${value}%, var(--background-color) 100%)`;
    }

    // Initialize slider backgrounds on page load
    updateSliderBackground(timeFilter);
    updateSliderBackground(healthFilter);

    // Handle search button click with animation
    searchButton.addEventListener('click', () => {
        searchButton.classList.add('spinning');
        setTimeout(() => {
            searchButton.classList.remove('spinning');
        }, 500);

        performSearch();
    });

    // Allow search on Enter key press
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Main search function
    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Collect all filter values
        const filters = {
            cuisine: document.getElementById('cuisineFilter').value,
            diet: document.getElementById('dietFilter').value,
            maxTime: parseInt(timeFilter.value),
            minHealth: parseInt(healthFilter.value)
        };
    
        try {
            // Show loading state
            searchResults.innerHTML = `
                <div class="message-container">
                    <img src="https://media.giphy.com/media/3o7bu8sRnYpTOG1p8k/giphy.gif" alt="Cooking" class="message-gif">
                    <h3>Cooking up your results... 🍳</h3>
                    <p>Our chefs are working their magic!</p>
                </div>
            `;
    
            // Fetch filtered recipes
            const recipes = await recipeService.searchRecipes(query, filters);
    
            // Handle no results
            if (!recipes || recipes.length === 0) {
                searchResults.innerHTML = `
                    <div class="message-container">
                        <img src="https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif" alt="Empty plate" class="message-gif">
                        <h3>Oops! No recipes found</h3>
                        <p>Even our chef couldn't find what you're looking for! 👨‍🍳</p>
                        <p>Try adjusting your filters or search for something else</p>
                    </div>
                `;
                return;
            }
    
            // Display results in grid
            searchResults.innerHTML = recipes.map(recipe => `
                <div class="recipe-card" onclick="window.location.href='recipe.html?id=${recipe.id}'">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image"
                         onerror="this.src='recipe_placeholder.jpg'">
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <div class="recipe-meta">
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span class="meta-label">Time</span>
                                <span class="meta-value">${recipe.readyInMinutes} min</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user"></i>
                                <span class="meta-label">Servings</span>
                                <span class="meta-value">${recipe.servings}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-heart"></i>
                                <span class="meta-label">Health</span>
                                <span class="meta-value">${recipe.healthScore || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
    
        } catch (error) {
            // Handle errors
            console.error('Search error:', error);
            searchResults.innerHTML = `
                <div class="error-message">
                    <p>Error searching recipes: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
                </div>`;
        }
    }
});    