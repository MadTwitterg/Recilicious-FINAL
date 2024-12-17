import { recipeService } from './recipe-service.js';
import { recipeTimeManager } from './time.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadDailyRecipes();
    
    // Schedule next update at midnight
    recipeTimeManager.scheduleNextUpdate();
    
    // Listen for recipe updates
    window.addEventListener('recipesUpdated', async () => {
        await loadDailyRecipes();
    });
});

async function loadDailyRecipes() {
    const recipeGrid = document.getElementById('recipeGrid');
    recipeGrid.innerHTML = `
        <div class="message-container">
            <img src="https://media.giphy.com/media/3o7bu8sRnYpTOG1p8k/giphy.gif" alt="Loading" class="message-gif">
            <h3>Setting up your kitchen... 🍳</h3>
            <p>Preparing some delicious recipes for you!</p>
        </div>
    `;
    
    try {
        // Use RecipeTimeManager to get recipes
        const recipes = await recipeTimeManager.checkAndUpdateRecipes();
        
        if (!recipes || recipes.length === 0) {
            throw new Error('No recipes available');
        }

        recipeGrid.innerHTML = recipes.map(recipe => `
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
        console.error('Error loading daily recipes:', error);
        recipeGrid.innerHTML = `
            <div class="message-container">
                <img src="https://media.giphy.com/media/3o7TKEP6YngkCKFofC/giphy.gif" alt="Error" class="message-gif">
                <h3>Oops! Kitchen troubles 🔧</h3>
                <p>We're having some technical difficulties.</p>
                <button onclick="loadDailyRecipes()" class="btn btn-primary">
                    Try Again
                </button>
            </div>`;
    }
}

// Make loadDailyRecipes available globally for the Try Again button
window.loadDailyRecipes = loadDailyRecipes;