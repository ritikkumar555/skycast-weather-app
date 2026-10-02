const API_KEY = window.APP_CONFIG && window.APP_CONFIG.API_KEY;
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

const form = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityName");
const locationBtn = document.querySelector("#locationBtn");
const statusEl = document.querySelector("#status");
const resultEl = document.querySelector("#result");

const els = {
  icon: document.querySelector("#icon"),
  temp: document.querySelector("#temp"),
  city: document.querySelector("#city"),
  condition: document.querySelector("#condition"),
  feels: document.querySelector("#feels"),
  wind: document.querySelector("#wind"),
  humidity: document.querySelector("#humidity"),
  pressure: document.querySelector("#pressure"),
};

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  statusEl.hidden = false;
  resultEl.hidden = true;
}

// Maps the API's condition id to one of the sky themes in style.css
function themeFor(id) {
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800) return "clear";
  return "clouds";
}

async function fetchWeather(params) {
  if (!API_KEY) {
    showStatus("Add your OpenWeatherMap API key to config.js to get started.", true);
    return;
  }

  showStatus("Loading weather…");

  try {
    const query = new URLSearchParams({ ...params, appid: API_KEY, units: "metric" });
    const response = await fetch(`${API_URL}?${query}`);
    const data = await response.json();

    if (!response.ok) {
      const message = response.status === 404
        ? "City not found. Check the spelling and try again."
        : "Couldn't load the weather. Please try again in a moment.";
      showStatus(message, true);
      return;
    }

    displayWeather(data);
    localStorage.setItem("lastCity", data.name);
  } catch (err) {
    showStatus("Network error. Check your connection and try again.", true);
  }
}

function displayWeather(data) {
  const weather = data.weather[0];

  els.icon.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
  els.temp.textContent = `${Math.round(data.main.temp)}°C`;
  els.city.textContent = `${data.name}, ${data.sys.country}`;
  els.condition.textContent = weather.description;
  els.feels.textContent = `${Math.round(data.main.feels_like)}°C`;
  els.wind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // API returns m/s
  els.humidity.textContent = `${data.main.humidity}%`;
  els.pressure.textContent = `${data.main.pressure} hPa`;

  document.body.dataset.theme = themeFor(weather.id);
  document.body.dataset.night = weather.icon.endsWith("n");

  statusEl.hidden = true;
  resultEl.hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) fetchWeather({ q: city });
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("Your browser doesn't support location access.", true);
    return;
  }
  showStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => fetchWeather({ lat: coords.latitude, lon: coords.longitude }),
    () => showStatus("Location access was blocked. Allow it in your browser or search by city.", true)
  );
});

// Reopen with the last searched city
const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
  cityInput.value = lastCity;
  fetchWeather({ q: lastCity });
}
