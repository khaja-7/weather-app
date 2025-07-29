// Weather App JavaScript Logic
class WeatherApp {
    constructor() {
        // OpenWeatherMap API configuration
        this.API_KEY = '1c22ec21c4071df5f19be7d4152b92de'; // User's actual API key
        this.API_BASE = 'https://api.openweathermap.org/data/2.5/weather';

        // DOM elements
        this.form = document.getElementById('weatherForm');
        this.cityInput = document.getElementById('cityInput');
        this.locationBtn = document.getElementById('locationBtn');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.weatherCard = document.getElementById('weatherCard');
        this.errorMessage = document.getElementById('errorMessage');

        // Location tracking
        this.userLocation = null;

        // Initialize the app
        this.init();
        // Show demo data if API key is not set
        this.showDemoData();
    }

    /**
     * Initialize the weather app
     * Set up event listeners and initial state
     */
    init() {
        // Add form submit event listener
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Add location button event listener
        this.locationBtn.addEventListener('click', () => {
            this.getCurrentLocationWeather();
        });

        // Add enter key support for input
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Automatically get location weather on page load
        this.autoFetchLocationWeather();
    }

    /**
     * Handle the weather search
     * Validate input and fetch weather data
     */
    async handleSearch() {
        const city = this.cityInput.value.trim();

        // Validate input
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        // API key check removed; will use provided key

        try {
            this.showLoading();
            const weatherData = await this.fetchWeatherDataByCity(city);
            this.displayWeatherData(weatherData);
        } catch (error) {
            console.error('Weather fetch error:', error);
            this.showError(error.message);
        }
    }

    /**
     * Fetch weather data by city name from OpenWeatherMap API
     * @param {string} city - City name to search for
     * @returns {Promise<Object>} Weather data object
     */
    async fetchWeatherDataByCity(city) {
        const url = `${this.API_BASE}?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=metric`;
        return await this.makeWeatherRequest(url);
    }

    /**
     * Fetch weather data by coordinates from OpenWeatherMap API
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Weather data object
     */
    async fetchWeatherDataByCoords(lat, lon) {
        const url = `${this.API_BASE}?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
        return await this.makeWeatherRequest(url);
    }

    /**
     * Make API request to OpenWeatherMap
     * @param {string} url - API URL
     * @returns {Promise<Object>} Weather data object
     */
    async makeWeatherRequest(url) {
        const response = await fetch(url);

        if (!response.ok) {
            // Handle different error types
            switch (response.status) {
                case 404:
                    throw new Error('Location not found. Please check and try again.');
                case 401:
                    throw new Error('Invalid API key. Please check your OpenWeatherMap API configuration.');
                case 429:
                    throw new Error('Too many requests. Please try again later.');
                default:
                    throw new Error(`Weather service error (${response.status}). Please try again later.`);
            }
        }

        const data = await response.json();
        return data;
    }

    /**
     * Automatically fetch weather for user's current location on page load
     */
    async autoFetchLocationWeather() {
        // API key check removed; will use provided key

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser. Please search for a city manually.');
            return;
        }

        try {
            this.showLoading();

            // Get user's location with timeout
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;

            this.userLocation = { lat: latitude, lon: longitude };

            // Fetch weather data for current location
            const weatherData = await this.fetchWeatherDataByCoords(latitude, longitude);
            this.displayWeatherData(weatherData);

        } catch (error) {
            console.error('Auto location fetch error:', error);

            // Show appropriate error message based on error type
            if (error.code === 1) {
                this.showError('Location access denied. Please search for a city manually or click "My Location" to try again.');
            } else if (error.code === 2) {
                this.showError('Location unavailable. Please search for a city manually.');
            } else if (error.code === 3) {
                this.showError('Location request timeout. Please search for a city manually.');
            } else {
                this.showError('Unable to get your location. Please search for a city manually.');
            }
        }
    }

    /**
     * Get user's current location weather (manual button click)
     */
    async getCurrentLocationWeather() {
        // API key check removed; will use provided key

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        try {
            this.showLoading();

            // Update button to show loading state
            this.locationBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Getting...';
            this.locationBtn.disabled = true;

            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;

            this.userLocation = { lat: latitude, lon: longitude };

            const weatherData = await this.fetchWeatherDataByCoords(latitude, longitude);
            this.displayWeatherData(weatherData);

        } catch (error) {
            console.error('Location weather fetch error:', error);

            if (error.code === 1) {
                this.showError('Location access denied. Please allow location access and try again.');
            } else if (error.code === 2) {
                this.showError('Location unavailable. Please try again or search manually.');
            } else if (error.code === 3) {
                this.showError('Location request timeout. Please try again.');
            } else {
                this.showError(error.message || 'Unable to get your location weather.');
            }
        } finally {
            // Reset button state
            this.locationBtn.innerHTML = '<i class="bi bi-geo-alt"></i> My Location';
            this.locationBtn.disabled = false;
        }
    }

    /**
     * Get current position with Promise wrapper
     * @returns {Promise<GeolocationPosition>} Position object
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true, // Request high accuracy
                timeout: 10000, // 10 second timeout
                maximumAge: 300000 // Accept cached position up to 5 minutes old
            };

            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    /**
     * Display weather data in the UI
     * @param {Object} data - Weather data from API
     */
    displayWeatherData(data) {
        // Hide loading and error states
        this.hideAllStates();

        // Extract weather information
        const {
            name: cityName,
            main: { temp, feels_like, humidity, pressure },
            weather: [{ description, icon }],
            wind: { speed },
            visibility,
            sys: { country }
        } = data;

        // Update DOM elements with weather data
        document.getElementById('cityName').textContent = `${cityName}, ${country}`;
        document.getElementById('weatherDescription').textContent = description;
        document.getElementById('temperature').textContent = `${Math.round(temp)}°C`;
        document.getElementById('feelsLike').textContent = `${Math.round(feels_like)}°C`;
        document.getElementById('humidity').textContent = `${humidity}%`;
        document.getElementById('windSpeed').textContent = `${Math.round(speed * 3.6)} km/h`;
        document.getElementById('pressure').textContent = `${pressure} hPa`;
        document.getElementById('visibility').textContent = `${Math.round(visibility / 1000)} km`;

        // Set weather icon
        this.setWeatherIcon(icon, description);

        // Show weather card with animation
        this.weatherCard.classList.remove('hidden');

        // Clear input field
        this.cityInput.value = '';
    }

    /**
     * Set appropriate weather icon based on weather condition
     * @param {string} iconCode - Weather icon code from API
     * @param {string} description - Weather description
     */
    setWeatherIcon(iconCode, description) {
        const iconElement = document.getElementById('weatherIcon');

        // Map weather conditions to Bootstrap icons
        const iconMap = {
            '01d': '☀️', // clear sky day
            '01n': '🌙', // clear sky night
            '02d': '⛅', // few clouds day
            '02n': '☁️', // few clouds night
            '03d': '☁️', // scattered clouds
            '03n': '☁️',
            '04d': '☁️', // broken clouds
            '04n': '☁️',
            '09d': '🌧️', // shower rain
            '09n': '🌧️',
            '10d': '🌦️', // rain day
            '10n': '🌧️', // rain night
            '11d': '⛈️', // thunderstorm
            '11n': '⛈️',
            '13d': '❄️', // snow
            '13n': '❄️',
            '50d': '🌫️', // mist
            '50n': '🌫️'
        };

        iconElement.textContent = iconMap[iconCode] || '🌤️';
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.hideAllStates();
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
    }

    /**
     * Hide all state elements (loading, error, weather card)
     */
    hideAllStates() {
        this.loadingState.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.weatherCard.classList.add('hidden');
    }


    showDemoData() {
        if (this.API_KEY === 'YOUR_API_KEY_HERE') {
            // Create mock weather data for demonstration
            const demoData = {
                name: 'London',
                main: {
                    temp: 22,
                    feels_like: 24,
                    humidity: 65,
                    pressure: 1012
                },
                weather: [{
                    description: 'partly cloudy',
                    icon: '02d'
                }],
                wind: { speed: 4.2 },
                visibility: 10000,
                sys: { country: 'GB' }
            };

            // Display demo data after a short delay
            setTimeout(() => {
                this.displayWeatherData(demoData);

                // Show a note about demo data
                const demoNote = document.createElement('div');
                demoNote.className = 'alert alert-info mt-3';
                demoNote.style.background = 'rgba(13, 202, 240, 0.2)';
                demoNote.style.border = '1px solid rgba(13, 202, 240, 0.3)';
                demoNote.style.borderRadius = '15px';
                demoNote.style.color = 'white';
                demoNote.innerHTML = `
                            <i class="bi bi-info-circle"></i> 
                            This is demo data. To get live weather updates, please:
                            <br>1. Get a free API key from <a href="https://openweathermap.org/api" target="_blank" style="color: #87CEEB;">OpenWeatherMap</a>
                            <br>2. Replace 'YOUR_API_KEY_HERE' in the JavaScript code with your actual API key
                        `;

                this.weatherCard.appendChild(demoNote);
            }, 1000);
        }
    }
}

// Initialize the weather app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Additional utility functions for enhanced user experience

/**
 * Convert temperature units
 * @param {number} temp - Temperature value
 * @param {string} from - Source unit (C, F, K)
 * @param {string} to - Target unit (C, F, K)
 * @returns {number} Converted temperature
 */
function convertTemperature(temp, from, to) {
    if (from === to) return temp;

    // Convert to Celsius first
    let celsius = temp;
    if (from === 'F') celsius = (temp - 32) * 5 / 9;
    if (from === 'K') celsius = temp - 273.15;

    // Convert from Celsius to target
    if (to === 'F') return celsius * 9 / 5 + 32;
    if (to === 'K') return celsius + 273.15;
    return celsius;
}

/**
 * Format date and time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date/time string
 */
function formatDateTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Check if user has granted location permission before
 * @returns {Promise<string>} Permission state
 */
async function checkLocationPermission() {
    if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state; // 'granted', 'denied', or 'prompt'
    }
    return 'unknown';
}