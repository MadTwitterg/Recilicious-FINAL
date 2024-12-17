// Array of API keys for automatic rotation and fallback
const API_KEYS = [
    'primary_key_here',
    'backup_key_1_here',
    'backup_key_2_here',
    // Add more keys as needed
];

let currentKeyIndex = 0;

// Get current API key
function getCurrentKey() {
    return API_KEYS[currentKeyIndex];
}

// Rotate to next available API key
function rotateToNextKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return getCurrentKey();
}

// Handle API requests with automatic key rotation on 402 errors
async function makeApiRequest(endpoint, options = {}) {
    const maxAttempts = API_KEYS.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`https://api.spoonacular.com${endpoint}`, {
                ...options,
                headers: {
                    ...options.headers,
                    'x-api-key': getCurrentKey()
                }
            });

            // If we get a 402 (quota exceeded), try next key
            if (response.status === 402) {
                console.log('API quota exceeded, trying next key...');
                rotateToNextKey();
                attempts++;
                continue;
            }

            // For other errors, throw them
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            // If we've tried all keys, throw the error
            if (attempts === maxAttempts - 1) {
                throw new Error('All API keys exhausted or invalid');
            }
            attempts++;
            rotateToNextKey();
        }
    }
}

export { makeApiRequest };