import type { NextApiRequest, NextApiResponse } from 'next';
import type { WeatherData } from '../../src/types/weather';

interface ErrorResponse {
  error: string;
}

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeatherData | ErrorResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon } = req.query;

  // Validate latitude and longitude
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || isNaN(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid latitude or longitude values' });
  }

  if (!OPENWEATHER_API_KEY) {
    console.error('OpenWeather API key is not configured');
    return res.status(500).json({ error: 'Weather service is not configured' });
  }

  try {
    const apiUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
    apiUrl.searchParams.append('lat', latitude.toString());
    apiUrl.searchParams.append('lon', longitude.toString());
    apiUrl.searchParams.append('appid', OPENWEATHER_API_KEY);
    apiUrl.searchParams.append('units', 'metric');

    console.log('Fetching weather data from:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid response from OpenWeather API' }));
      console.error('OpenWeather API error:', errorData);
      throw new Error(errorData.message || 'Weather data not available');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch weather data' });
  }
} 