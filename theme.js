// Theme management for light/dark mode
class ThemeManager {
    constructor() {
        // Constants and initial state
        this.THEME_KEY = 'recilicious-theme';
        this.isDark = localStorage.getItem(this.THEME_KEY) === 'dark';
        this.init();
    }

    // Initialize theme toggle button and apply initial theme
    init() {
        const navLinks = document.querySelector('.nav-links');
        const themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle';
        
        // Set initial icon based on current theme
        themeButton.innerHTML = this.isDark ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        // Add click handler with animation
        themeButton.addEventListener('click', () => {
            themeButton.classList.add('spinning');
            
            setTimeout(() => {
                themeButton.classList.remove('spinning');
            }, 500);

            this.toggleTheme();
        });
        
        // Add button to navigation
        navLinks.appendChild(themeButton);
        this.applyTheme();
    }

    // Toggle between light and dark themes
    toggleTheme() {
        this.isDark = !this.isDark;
        localStorage.setItem(this.THEME_KEY, this.isDark ? 'dark' : 'light');
        this.applyTheme();
    }

    // Apply theme to document and update button icon
    applyTheme() {
        document.documentElement.classList.toggle('dark-theme', this.isDark);
        
        // Update theme toggle button icon
        const themeButton = document.querySelector('.theme-toggle');
        if (themeButton) {
            themeButton.innerHTML = this.isDark ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
        }
    }
}

// Create and export theme manager instance
const themeManager = new ThemeManager();
export default themeManager; 