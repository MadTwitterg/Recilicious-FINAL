// Voice recognition functionality for recipe search
class VoiceRecognition {
    constructor() {
        // Initialize class properties
        this.recognition = null;
        this.isRecording = false;
        this.voiceButton = document.getElementById('voiceButton');
        this.searchInput = document.getElementById('searchInput');
        
        // Set up voice recognition
        this.initializeRecognition();
        this.setupEventListeners();
    }

    // Initialize speech recognition with browser support check
    initializeRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.setupRecognitionOptions();
        } else {
            console.error('Speech recognition not supported');
            this.voiceButton.style.display = 'none'; // Hide button if not supported
        }
    }

    // Configure speech recognition settings and handlers
    setupRecognitionOptions() {
        // Configure recognition settings
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        // Handle successful voice recognition
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.searchInput.value = transcript;
            // Trigger search automatically
            document.getElementById('searchButton').click();
        };

        // Handle recognition errors
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopRecording();
            
            // Show user-friendly error message
            const searchInput = document.getElementById('searchInput');
            searchInput.placeholder = "Oops! My ears aren't working right now 🎤";
            
            // Reset placeholder after delay
            setTimeout(() => {
                searchInput.placeholder = "Search recipes...";
            }, 3000);
        };

        // Clean up when recording ends
        this.recognition.onend = () => {
            this.stopRecording();
        };
    }

    // Set up button click handlers
    setupEventListeners() {
        this.voiceButton.addEventListener('click', () => {
            if (!this.isRecording) {
                this.startRecording();
            } else {
                this.stopRecording();
            }
        });
    }

    // Start voice recording with visual feedback
    startRecording() {
        try {
            this.recognition.start();
            this.isRecording = true;
            this.voiceButton.classList.add('recording');
            
            // Add spin animation effect
            this.voiceButton.classList.add('spinning');
            setTimeout(() => {
                this.voiceButton.classList.remove('spinning');
            }, 500);
            
            // Change icon to stop button
            this.voiceButton.querySelector('i').className = 'fas fa-stop';
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    // Stop voice recording and reset UI
    stopRecording() {
        try {
            this.recognition.stop();
            this.isRecording = false;
            this.voiceButton.classList.remove('recording');
            
            // Add spin animation effect
            this.voiceButton.classList.add('spinning');
            setTimeout(() => {
                this.voiceButton.classList.remove('spinning');
            }, 500);
            
            // Change icon back to microphone
            this.voiceButton.querySelector('i').className = 'fas fa-microphone';
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    }
}

// Initialize voice recognition when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceRecognition();
});

export default VoiceRecognition; 