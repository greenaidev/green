import { useState } from 'react';
import type { Location } from '../types/location';
import type { WeatherData } from '../types/weather';
import locationData from '../data/locations.json';

interface WeatherHookReturn {
  getLocalWeather: () => Promise<string>;
  getLocationWeather: (location: string) => Promise<string>;
  loading: boolean;
}

interface LocationData {
  locations: Location[];
}

const useWeather = (): WeatherHookReturn => {
  const [loading, setLoading] = useState(false);

  const findLocation = (query: string): Location | null => {
    const normalizedQuery = query.toLowerCase().trim();
    const data = locationData as LocationData;
    const location = data.locations.find((loc: Location) => 
      loc.name.toLowerCase() === normalizedQuery ||
      loc.aliases.some(alias => alias.toLowerCase() === normalizedQuery)
    );
    return location || null;
  };

  const findNearestCity = (latitude: number, longitude: number): Location | null => {
    let nearestCity: Location | null = null;
    let shortestDistance = Infinity;

    const data = locationData as LocationData;
    data.locations.forEach((loc: Location) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        loc.coordinates.lat,
        loc.coordinates.lon
      );
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = loc;
      }
    });

    return nearestCity;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const getWeatherEmoji = (weatherId: number): string => {
    // Weather condition codes: https://openweathermap.org/weather-conditions
    if (weatherId >= 200 && weatherId < 300) return '⛈️';  // Thunderstorm
    if (weatherId >= 300 && weatherId < 400) return '🌧️';  // Drizzle
    if (weatherId >= 500 && weatherId < 600) return '🌧️';  // Rain
    if (weatherId >= 600 && weatherId < 700) return '❄️';  // Snow
    if (weatherId >= 700 && weatherId < 800) return '🌫️';  // Atmosphere (fog, mist, etc.)
    if (weatherId === 800) return '☀️';                    // Clear sky
    if (weatherId > 800) return '☁️';                      // Clouds
    return '🌡️';  // Default
  };

  const formatWeatherData = (data: WeatherData, location: Location): string => {
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const weatherEmoji = getWeatherEmoji(data.weather[0].id);
    const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h

    return `*Weather in ${location.cityEmoji} ${location.name}, ${location.countryEmoji} ${location.country}:*
*${weatherEmoji} ${data.weather[0].description}*
*🌡️ Temperature: ${temp}°C*
*🤔 Feels like: ${feelsLike}°C*
*💧 Humidity: ${data.main.humidity}%*
*💨 Wind: ${windSpeed} km/h*`;
  };

  const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Invalid response from server' }));
      throw new Error(errorData.error || 'Weather data not available');
    }
    
    return response.json().catch(() => {
      throw new Error('Invalid JSON response from server');
    });
  };

  const getLocalWeather = async (): Promise<string> => {
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });

        const nearestCity = findNearestCity(position.coords.latitude, position.coords.longitude);
        if (nearestCity) {
          const weatherData = await fetchWeather(position.coords.latitude, position.coords.longitude);
          return formatWeatherData(weatherData, nearestCity);
        }
      }
      return 'Unable to get local weather. Please allow location access or specify a city.';
    } catch (error) {
      console.error('Weather error:', error);
      if (error instanceof Error) {
        return `Error getting weather data: ${error.message}`;
      }
      return 'Error getting weather data. Please try again.';
    }
  };

  const getLocationWeather = async (locationQuery: string): Promise<string> => {
    setLoading(true);
    try {
      if (locationQuery.toLowerCase() === 'now') {
        return getLocalWeather();
      }

      const location = findLocation(locationQuery);
      if (!location) {
        return 'Location not found. Try one of our supported cities (e.g., New York, London, Tokyo) or use "now" for local weather.';
      }

      const weatherData = await fetchWeather(location.coordinates.lat, location.coordinates.lon);
      return formatWeatherData(weatherData, location);
    } catch (error) {
      console.error('Error getting location weather:', error);
      if (error instanceof Error) {
        return `Error getting weather data: ${error.message}`;
      }
      return 'Error getting weather data. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  return {
    getLocalWeather,
    getLocationWeather,
    loading
  };
};

export default useWeather; 