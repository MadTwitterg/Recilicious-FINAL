import { makeApiRequest } from './config.js';

class RecipeService {
    constructor() {
        this.baseUrl = `${BASE_URL}/recipes`;
        this.apiKey = API_KEY;
    }

    async getRandomRecipes(count = 12) {
        try {
            const response = await fetch(
                `${this.baseUrl}/random?apiKey=${this.apiKey}&number=${count}&addRecipeInformation=true`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Failed to fetch recipes');
            }
            
            const data = await response.json();
            return data.recipes;
        } catch (error) {
            console.error('Error fetching random recipes:', error);
            throw error;
        }
    }

    async getRecipeById(id) {
        try {
            const response = await fetch(
                `${this.baseUrl}/${id}/information?apiKey=${this.apiKey}`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Recipe not found');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            throw error;
        }
    }

    async searchRecipes(query, filters = {}) {
        try {
            const response = await makeApiRequest('/recipes/complexSearch', {
                method: 'GET',
                params: {
                    query,
                    ...filters
                }
            });
            return response.results;
        } catch (error) {
            console.error('Error searching recipes:', error);
            throw error;
        }
    }
}

export const recipeService = new RecipeService(); 