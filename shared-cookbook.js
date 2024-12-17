import { dbService } from './db-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('id');

    if (!shareId) {
        showError('Invalid sharing link');
        return;
    }

    try {
        const sharedData = await dbService.getSharedCookbook(shareId);
        displaySharedRecipes(sharedData);
    } catch (error) {
        console.error('Error loading shared cookbook:', error);
        showError('Failed to load shared cookbook');
    }
});

function displaySharedRecipes(sharedData) {
    const recipesGrid = document.getElementById('sharedRecipes');
    const sharedByElement = document.querySelector('.shared-by');
    
    sharedByElement.textContent = `Shared by: ${sharedData.sharedBy}`;
    
    recipesGrid.innerHTML = sharedData.recipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-content" onclick="window.location.href='recipe.html?id=${recipe.recipeId}'">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image"
                     onerror="this.src='recipe_placeholder.jpg'">
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
                        <span class="meta-value">${recipe.healthScore}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showError(message) {
    const recipesGrid = document.getElementById('sharedRecipes');
    recipesGrid.innerHTML = `
        <div class="message-container">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="window.location.href='index.html'" class="btn btn-primary">
                Go Home
            </button>
        </div>
    `;
} 