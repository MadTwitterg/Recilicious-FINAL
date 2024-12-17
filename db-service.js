class DBService {
    constructor() {
        this.dbName = 'ReciliciousDB';
        this.dbVersion = 2;
        this.db = null;
        this.COOKBOOK_STORAGE_KEY = 'user_cookbook';
        this.dbInitialized = this.init();
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            console.log('Initializing database...');
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                console.log('Database opened successfully');
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Upgrading database...');
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                const transaction = event.target.transaction;

                // If this is a fresh database (version 0)
                if (oldVersion < 1) {
                    console.log('Creating users store...');
                    const userStore = db.createObjectStore('users', { keyPath: 'email' });
                    userStore.createIndex('username', 'username', { unique: true });

                    console.log('Creating savedRecipes store...');
                    const recipeStore = db.createObjectStore('savedRecipes', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    recipeStore.createIndex('userEmail', 'userEmail', { unique: false });
                    recipeStore.createIndex('recipeId', 'recipeId', { unique: false });
                    recipeStore.createIndex('userRecipe', ['userEmail', 'recipeId'], { unique: true });
                }

                // Add any new version upgrades here
                if (oldVersion < 2) {
                    // Version 2 upgrades
                    console.log('Upgrading to version 2...');
                    // Add any new indexes or stores here
                }
            };
        });
    }

    async registerUser(userData) {
        await this.dbInitialized;
        console.log('Starting registration for:', userData.email);
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['users'], 'readwrite');
                const userStore = transaction.objectStore('users');

                // Add timestamp and initial data
                const userDataWithDefaults = {
                    email: userData.email,
                    username: userData.username,
                    password: userData.password,
                    profilePicture: 'default-profile.jpg',
                    memberSince: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    savedRecipes: [],
                    recipesCooked: 0
                };

                console.log('Storing user data:', userDataWithDefaults);

                const request = userStore.add(userDataWithDefaults);

                request.onsuccess = async () => {
                    console.log('User added to database');
                    
                    // Immediately verify the user was stored
                    const verifyRequest = userStore.get(userData.email);
                    verifyRequest.onsuccess = () => {
                        const storedUser = verifyRequest.result;
                        console.log('Verification check:', storedUser);
                        
                        if (storedUser) {
                            localStorage.setItem('currentUser', JSON.stringify({
                                email: storedUser.email,
                                username: storedUser.username
                            }));
                            console.log('User registration complete');
                            resolve(storedUser);
                        } else {
                            console.error('User verification failed');
                            reject('Failed to store user data');
                        }
                    };
                };

                request.onerror = (event) => {
                    console.error('Registration error:', event.target.error);
                    reject('Registration failed');
                };

                transaction.oncomplete = () => {
                    console.log('Registration transaction completed');
                };

                transaction.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                };

            } catch (error) {
                console.error('Registration error:', error);
                reject(error.message);
            }
        });
    }

    async loginUser(email, password) {
        await this.dbInitialized;
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['users'], 'readwrite');
                const userStore = transaction.objectStore('users');
                const request = userStore.get(email);

                request.onsuccess = () => {
                    const user = request.result;
                    console.log('Found user:', user);
                    
                    if (user && user.password === password) {
                        // Update last login
                        user.lastLogin = new Date().toISOString();
                        userStore.put(user);
                        
                        // Store minimal user data in localStorage
                        const publicUserData = {
                            email: user.email,
                            username: user.username
                        };
                        localStorage.setItem('currentUser', JSON.stringify(publicUserData));
                        resolve(user);
                    } else {
                        reject('Invalid credentials');
                    }
                };

                request.onerror = (event) => {
                    console.error('Login error:', event.target.error);
                    reject('Login failed');
                };
            } catch (error) {
                console.error('Login error:', error);
                reject(error.message);
            }
        });
    }

    async updateLastLogin(email) {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const userStore = transaction.objectStore('users');
        const request = userStore.get(email);

        request.onsuccess = () => {
            const user = request.result;
            user.lastLogin = new Date().toISOString();
            userStore.put(user);
        };
    }

    async saveRecipe(userEmail, recipe) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readwrite');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userRecipe');

            // First check if recipe already exists
            const query = index.get([userEmail, recipe.id.toString()]);

            query.onsuccess = (event) => {
                if (event.target.result) {
                    // Recipe exists, so remove it (toggle off)
                    store.delete(event.target.result.id).onsuccess = () => {
                        resolve({ saved: false });
                    };
                } else {
                    // Recipe doesn't exist, so add it (toggle on)
                    const recipeData = {
                        userEmail,
                        recipeId: recipe.id.toString(),
                        title: recipe.title,
                        image: recipe.image,
                        readyInMinutes: recipe.readyInMinutes,
                        servings: recipe.servings,
                        healthScore: recipe.healthScore,
                        savedDate: new Date().toISOString()
                    };

                    store.add(recipeData).onsuccess = () => {
                        resolve({ saved: true });
                    };
                }
            };

            query.onerror = () => reject('Error checking for existing recipe');
        });
    }

    async getUserSavedRecipes(userEmail) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userEmail');
            const request = index.getAll(userEmail);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error fetching saved recipes');
        });
    }

    async updateUserProfile(email, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const userStore = transaction.objectStore('users');
            const request = userStore.get(email);

            request.onsuccess = () => {
                const user = request.result;
                const updatedUser = { ...user, ...updates };
                const putRequest = userStore.put(updatedUser);

                putRequest.onsuccess = () => {
                    resolve(updatedUser);
                };

                putRequest.onerror = () => {
                    reject('Error updating profile');
                };
            };

            request.onerror = () => {
                reject('Error accessing database');
            };
        });
    }

    async getUserProfile(email) {
        try {
            await this.dbInitialized;
            console.log('Getting user profile for:', email);
            
            const transaction = this.db.transaction(['users'], 'readonly');
            const userStore = transaction.objectStore('users');
            
            return new Promise((resolve, reject) => {
                const request = userStore.get(email);

                request.onsuccess = () => {
                    const user = request.result;
                    console.log('User profile result:', user);
                    if (user) {
                        resolve(user);
                    } else {
                        reject('User not found');
                    }
                };

                request.onerror = (event) => {
                    console.error('Error fetching user profile:', event.target.error);
                    reject('Error fetching user profile');
                };
            });
        } catch (error) {
            console.error('getUserProfile error:', error);
            throw error;
        }
    }

    async getUserStats(email) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const recipeStore = transaction.objectStore('savedRecipes');
            const userIndex = recipeStore.index('userEmail');
            const request = userIndex.getAll(email);

            request.onsuccess = () => {
                const savedRecipes = request.result;
                resolve({
                    savedRecipesCount: savedRecipes.length,
                    recipesShared: savedRecipes.filter(recipe => recipe.shared).length
                });
            };

            request.onerror = () => reject('Error fetching user stats');
        });
    }

    async getRecentActivity(email) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const recipeStore = transaction.objectStore('savedRecipes');
            const userIndex = recipeStore.index('userEmail');
            const request = userIndex.getAll(email);

            request.onsuccess = () => {
                const savedRecipes = request.result;
                // Sort by savedDate and get the most recent 5 activities
                const recentActivity = savedRecipes
                    .sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate))
                    .slice(0, 5);
                resolve(recentActivity);
            };

            request.onerror = () => reject('Error fetching recent activity');
        });
    }

    async removeRecipe(userEmail, recipeId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readwrite');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userRecipe');

            // First get the key for this user-recipe combination
            const getRequest = index.getKey([userEmail, recipeId.toString()]);
            
            getRequest.onsuccess = (event) => {
                const key = event.target.result;
                if (key) {
                    // Delete using the found key
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = () => {
                        console.log(`Recipe ${recipeId} removed successfully`);
                        resolve();
                    };
                    deleteRequest.onerror = () => reject('Error deleting recipe');
                } else {
                    reject('Recipe not found');
                }
            };

            getRequest.onerror = () => reject('Error finding recipe to remove');
        });
    }

    async searchRecipes(query, filters = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const recipeStore = transaction.objectStore('savedRecipes');
            const request = recipeStore.getAll();

            request.onsuccess = () => {
                let recipes = request.result;
                
                // Apply search query
                if (query) {
                    recipes = recipes.filter(recipe => 
                        recipe.title.toLowerCase().includes(query.toLowerCase())
                    );
                }

                // Apply filters
                if (filters.cuisine) {
                    recipes = recipes.filter(recipe => 
                        recipe.cuisine === filters.cuisine
                    );
                }
                if (filters.diet) {
                    recipes = recipes.filter(recipe => 
                        recipe.diet === filters.diet
                    );
                }
                if (filters.time) {
                    recipes = recipes.filter(recipe => 
                        parseInt(recipe.cookTime) <= parseInt(filters.time)
                    );
                }

                resolve(recipes);
            };

            request.onerror = () => {
                reject('Error searching recipes');
            };
        });
    }

    async syncCookbookToStorage(userEmail) {
        const transaction = this.db.transaction(['savedRecipes'], 'readonly');
        const recipeStore = transaction.objectStore('savedRecipes');
        const userIndex = recipeStore.index('userEmail');
        const request = userIndex.getAll(userEmail);

        request.onsuccess = () => {
            const recipes = request.result;
            localStorage.setItem(`${this.COOKBOOK_STORAGE_KEY}_${userEmail}`, JSON.stringify(recipes));
            console.log('Cookbook synced to storage');
        };

        request.onerror = () => console.error('Error syncing cookbook to storage');
    }

    clearCookbookData(userEmail) {
        localStorage.removeItem(`${this.COOKBOOK_STORAGE_KEY}_${userEmail}`);
    }

    async clearCookbook(userEmail) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readwrite');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userEmail');
            
            // Get all recipes for this user
            const request = index.getAllKeys(userEmail);
            
            request.onsuccess = () => {
                const keys = request.result;
                // Delete all recipes for this user
                keys.forEach(key => store.delete(key));
                console.log('Cookbook cleared successfully');
                resolve();
            };
            
            request.onerror = () => reject('Error clearing cookbook');
        });
    }

    async shareCookbook(userEmail) {
        try {
            // Get all user's saved recipes
            const recipes = await this.getUserSavedRecipes(userEmail);
            
            // Generate a unique sharing ID (timestamp + random string)
            const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Store the shared cookbook in localStorage (temporary solution)
            localStorage.setItem(`shared_cookbook_${shareId}`, JSON.stringify({
                sharedBy: userEmail,
                sharedDate: new Date().toISOString(),
                recipes: recipes
            }));
            
            // Return the sharing URL
            const shareUrl = `${window.location.origin}/shared-cookbook.html?id=${shareId}`;
            return shareUrl;
        } catch (error) {
            console.error('Error sharing cookbook:', error);
            throw error;
        }
    }

    async getSharedCookbook(shareId) {
        try {
            const sharedData = localStorage.getItem(`shared_cookbook_${shareId}`);
            if (!sharedData) {
                throw new Error('Shared cookbook not found');
            }
            return JSON.parse(sharedData);
        } catch (error) {
            console.error('Error getting shared cookbook:', error);
            throw error;
        }
    }
}

export const dbService = new DBService();

if (!window.indexedDB) {
    console.log("Your browser doesn't support IndexedDB. Supported browsers include:");
    console.log("- Chrome 24+");
    console.log("- Firefox 16+");
    console.log("- Safari 10+");
    console.log("- Edge (all versions)");
    console.log("- Opera 15+");
    console.log("Please upgrade your browser to use this application.");
}