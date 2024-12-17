import { API_KEY as SPOONACULAR_API_KEY, BASE_URL as SPOONACULAR_BASE_URL } from './config.js';

class RecipeTimeManager {
    constructor() {
        this.STORAGE_KEY = 'daily_recipes';
        this.LAST_UPDATE_KEY = 'last_recipe_update';
        this.IST_OFFSET = 5.5; // IST is UTC+5:30 (5.5 hours)
    }

    async checkAndUpdateRecipes() {
        const istDate = this.getISTDate();
        const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY);
        const storedRecipes = localStorage.getItem(this.STORAGE_KEY);

        // Check if we need to update recipes (new day in IST or no stored recipes)
        if (istDate !== lastUpdate || !storedRecipes) {
            console.log('Fetching new daily recipes...');
            try {
                const recipes = await this.fetchDailyRecipes();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
                localStorage.setItem(this.LAST_UPDATE_KEY, istDate);
                return recipes;
            } catch (error) {
                console.error('Error fetching daily recipes:', error);
                if (storedRecipes) {
                    return JSON.parse(storedRecipes);
                }
                throw error;
            }
        } else {
            console.log('Using cached daily recipes');
            return JSON.parse(storedRecipes);
        }
    }

    // Get current date in IST
    getISTDate() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utc + (3600000 * this.IST_OFFSET));
        return istTime.toISOString().split('T')[0];
    }

    // Get time until next update (midnight IST)
    getTimeUntilNextUpdate() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utc + (3600000 * this.IST_OFFSET));
        
        // Set to next midnight IST
        const tomorrow = new Date(istTime);
        tomorrow.setHours(24, 0, 0, 0);
        
        return tomorrow - istTime;
    }

    async fetchDailyRecipes() {
        try {
            console.log('Fetching recipes with nutrition data...');
            
            const response = await fetch(
                `${SPOONACULAR_BASE_URL}/recipes/random?apiKey=${SPOONACULAR_API_KEY}&number=10&addRecipeInformation=true&includeNutrition=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Failed to fetch recipes');
            }

            const data = await response.json();
            
            if (!data || !data.recipes) {
                throw new Error('Invalid response format');
            }

            // Store in localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.recipes));
            return data.recipes;

        } catch (error) {
            console.error('Error fetching recipes:', error);
            
            // Try to get cached recipes if fetch fails
            const cachedRecipes = localStorage.getItem(this.STORAGE_KEY);
            if (cachedRecipes) {
                console.log('Using cached recipes');
                return JSON.parse(cachedRecipes);
            }
            
            throw error;
        }
    }

    scheduleNextUpdate() {
        const timeUntilNextUpdate = this.getTimeUntilNextUpdate();
        const hours = Math.floor(timeUntilNextUpdate / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilNextUpdate % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log(`Next recipe update in ${hours} hours and ${minutes} minutes (at midnight IST)`);
        
        setTimeout(() => {
            this.checkAndUpdateRecipes()
                .then(() => {
                    window.dispatchEvent(new CustomEvent('recipesUpdated'));
                    this.scheduleNextUpdate();
                })
                .catch(console.error);
        }, timeUntilNextUpdate);
    }
}

export const recipeTimeManager = new RecipeTimeManager(); 