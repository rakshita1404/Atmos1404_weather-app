// Wait until the HTML document is fully loaded before running our code
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Select DOM Elements ---
    // We grab elements from the HTML using their IDs so we can manipulate them
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherContainer = document.getElementById('weather-container');
    const errorContainer = document.getElementById('error-message');
    const loadingIndicator = document.getElementById('loading-indicator');

    // Elements where we will display the weather data
    const cityNameEl = document.getElementById('city-name');
    const dateEl = document.getElementById('current-date');
    const tempEl = document.getElementById('temperature');
    const weatherDescEl = document.getElementById('weather-description');
    const weatherIconEl = document.getElementById('weather-icon');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const feelsLikeEl = document.getElementById('feels-like');
    const errorTextEl = document.getElementById('error-text');

    // --- 2. Add Event Listeners ---
    // Listen for click on the search button
    searchBtn.addEventListener('click', handleSearch);

    // Listen for the 'Enter' key press in the input field
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // --- 3. Main Search Function ---
    // This is an 'async' function because it fetches data from the internet
    async function handleSearch() {
        const city = cityInput.value.trim(); // Get input value and remove extra spaces

        // If the input is empty, do nothing
        if (!city) return;

        // Reset UI: Hide weather and errors, show loading spinner
        weatherContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');

        try {
            // Step A: Get Coordinates (Latitude and Longitude) for the city name
            const geoData = await fetchGeocoding(city);

            // Check if we found any results
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`City "${city}" not found`);
            }

            // Extract the first result (closest match)
            const { name, latitude, longitude, country } = geoData.results[0];

            // Step B: Use coordinates to get the Weather Data
            const weatherData = await fetchWeather(latitude, longitude);

            // Step C: Update the screen with the new data
            updateUI(name, country, weatherData);

        } catch (error) {
            // If anything goes wrong, log it and show error message
            console.error('Error fetching weather:', error);
            showError(error.message);
        } finally {
            // This runs whether we succeed or fail: Hide the loading spinner
            loadingIndicator.classList.add('hidden');
        }
    }

    // --- 4. API Helper Functions ---

    // Function to search for a city's coordinates
    async function fetchGeocoding(city) {
        // We use encodeURIComponent to handle spaces and special characters in city names
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const response = await fetch(url);
        // Check if the network request was successful
        if (!response.ok) throw new Error('Geocoding service unavailable');
        return await response.json(); // Convert response text to JavaScript Object
    }

    // Function to get weather using lat/lon
    async function fetchWeather(lat, lon) {
        // We request specific data fields: temperature, humidity, apparent temp, weather code, wind speed
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather service unavailable');
        return await response.json();
    }

    // --- 5. UI Helper Functions ---

    // Function to take the data and put it into the HTML
    function updateUI(city, country, data) {
        const current = data.current; // The 'current' object holds the weather info

        // Update text content of elements
        cityNameEl.textContent = `${city}, ${country}`;
        // Create a nice date string (e.g., "Monday, Jan 3")
        dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        // Math.round removes decimals (e.g. 23.4 -> 23)
        tempEl.textContent = Math.round(current.temperature_2m);
        humidityEl.textContent = `${current.relative_humidity_2m}%`;
        windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
        feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°`;

        // Convert the numeric weather code into a description and icon
        const weatherInfo = getWeatherInfo(current.weather_code);
        weatherDescEl.textContent = weatherInfo.description;

        // Update the FontAwesome icon class
        weatherIconEl.className = `fa-solid ${weatherInfo.icon}`;

        // Finally, make the weather container visible
        weatherContainer.classList.remove('hidden');
    }

    // Helper to show error message
    function showError(message) {
        errorTextEl.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    // Helper to map WMO Weather Codes to text and icons
    // See: https://open-meteo.com/en/docs
    function getWeatherInfo(code) {
        let description = 'Unknown';
        let icon = 'fa-cloud';

        // 0: Clear Sky
        if (code === 0) {
            description = 'Clear Sky';
            icon = 'fa-sun';
        }
        // 1-3: Cloudy
        else if (code >= 1 && code <= 3) {
            description = 'Partly Cloudy';
            icon = 'fa-cloud-sun';
        }
        // 45, 48: Fog
        else if (code >= 45 && code <= 48) {
            description = 'Foggy';
            icon = 'fa-smog';
        }
        // 51-55: Drizzle
        else if (code >= 51 && code <= 55) {
            description = 'Drizzle';
            icon = 'fa-cloud-rain';
        }
        // 61-65: Rain
        else if (code >= 61 && code <= 65) {
            description = 'Rain';
            icon = 'fa-cloud-showers-heavy';
        }
        // 71-77: Snow
        else if (code >= 71 && code <= 77) {
            description = 'Snow Fall';
            icon = 'fa-snowflake';
        }
        // 80-82: Showers
        else if (code >= 80 && code <= 82) {
            description = 'Rain Showers';
            icon = 'fa-cloud-showers-water';
        }
        // 95-99: Thunderstorm
        else if (code >= 95 && code <= 99) {
            description = 'Thunderstorm';
            icon = 'fa-cloud-bolt';
        }

        return { description, icon };
    }
});
