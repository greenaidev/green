import { useState } from 'react';
import type { Location } from '../types/location';
import locationData from '../data/locations.json';

interface TimeHookReturn {
  getLocalTime: () => Promise<string>;
  getLocationTime: (location: string) => Promise<string>;
  loading: boolean;
}

const useTime = (): TimeHookReturn => {
  const [loading, setLoading] = useState(false);

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  const findLocation = (query: string): Location | null => {
    const normalizedQuery = query.toLowerCase().trim();
    const location = (locationData as any).locations.find((loc: Location) => 
      loc.name.toLowerCase() === normalizedQuery ||
      loc.aliases.some(alias => alias.toLowerCase() === normalizedQuery)
    );
    return location || null;
  };

  const findNearestCity = (latitude: number, longitude: number): Location | null => {
    let nearestCity: Location | null = null;
    let shortestDistance = Infinity;

    (locationData as any).locations.forEach((loc: Location) => {
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

  // Haversine formula to calculate distance between two points on Earth
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
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

  const getLocalTime = async (): Promise<string> => {
    const now = new Date();
    const formattedTime = formatTime(now);

    try {
      // Check if geolocation is supported
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });

        const nearestCity = findNearestCity(position.coords.latitude, position.coords.longitude);
        if (nearestCity) {
          return `*Current local time 🏠 (near ${nearestCity.cityEmoji} ${nearestCity.name}, ${nearestCity.countryEmoji} ${nearestCity.country}):*\n*${formattedTime}*`;
        }
      }
    } catch (error) {
      console.error('Geolocation error:', error);
    }

    // Fallback if geolocation fails or is not available
    return `*Current local time 🏠:*\n*${formattedTime}*`;
  };

  const getLocationTime = async (locationQuery: string): Promise<string> => {
    setLoading(true);
    try {
      if (locationQuery.toLowerCase() === 'now') {
        return getLocalTime();
      }

      const location = findLocation(locationQuery);
      if (!location) {
        return 'Location not found. Try one of our supported cities (e.g., New York, London, Tokyo) or use "now" for local time.';
      }

      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: location.timezone,
        timeZoneName: 'short'
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const formattedTime = formatter.format(now);
      
      return `*Current time in ${location.cityEmoji} ${location.name}, ${location.countryEmoji} ${location.country}:*\n*${formattedTime}*`;
    } catch (error) {
      console.error('Error getting location time:', error);
      return 'Error getting time for this location. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  return {
    getLocalTime,
    getLocationTime,
    loading
  };
};

export default useTime; 