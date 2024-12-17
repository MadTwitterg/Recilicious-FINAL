// Social media sharing functionality class to handle sharing recipes across platforms
class SocialMediaSharing {
    constructor() {
        // Initialize with saved recipes from localStorage
        this.savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || {};
    }

    // Generate dynamic sharing text based on user's saved recipes count
    getShareText() {
        const recipeCount = Object.keys(this.savedRecipes).length;
        return `Check out my cookbook on Recilicious! I have saved ${recipeCount} amazing recipes!`;
    }

    // Get properly encoded URL for social media sharing
    getShareUrl() {
        return encodeURIComponent(window.location.origin);
    }

    // Share cookbook to Twitter with custom message
    shareToTwitter() {
        const shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.getShareText())}&url=${this.getShareUrl()}`;
        this.openShareWindow(shareLink);
    }

    // Share cookbook to Facebook with custom message
    shareToFacebook() {
        const shareLink = `https://www.facebook.com/sharer/sharer.php?u=${this.getShareUrl()}&quote=${encodeURIComponent(this.getShareText())}`;
        this.openShareWindow(shareLink);
    }

    // Manual Instagram sharing since they don't support direct URL sharing
    shareToInstagram() {
        alert('To share on Instagram, please screenshot your cookbook and share it manually.');
    }

    // Helper method to open sharing popup window
    openShareWindow(url) {
        window.open(url, '_blank', 'width=600,height=400');
    }

    // Main sharing method that handles different social platforms
    share(platform) {
        switch(platform) {
            case 'twitter':
                this.shareToTwitter();
                break;
            case 'facebook':
                this.shareToFacebook();
                break;
            case 'instagram':
                this.shareToInstagram();
                break;
            default:
                console.error('Unsupported platform');
        }
    }
}


// Create single instance of sharing functionality
const socialMedia = new SocialMediaSharing();

// Export sharing function for use in HTML
function shareTo(platform) {
    socialMedia.share(platform);
}

// Handle image upload and convert to base64 for storage
export async function handleImageUpload(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result); // Returns base64 encoded image
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

// Validate image files before upload
export function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // Maximum size: 5MB

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image (JPEG, PNG, or GIF).');
    }

    if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 5MB.');
    }

    return true;
} 