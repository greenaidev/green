import { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { WeatherData } from '@/types/weather';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function GET(request: NextRequest) {
  // Handle both location name and coordinates
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!OPENWEATHER_API_KEY) {
    console.error('OpenWeather API key is not configured');
    return NextResponse.json(
      { error: 'Weather service is not configured' },
      { status: 500 }
    );
  }

  try {
    const apiUrl = new URL('https://api.openweathermap.org/data/2.5/weather');

    if (lat && lon) {
      // Validate latitude and longitude
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude) || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: 'Invalid latitude or longitude values' },
          { status: 400 }
        );
      }

      apiUrl.searchParams.append('lat', latitude.toString());
      apiUrl.searchParams.append('lon', longitude.toString());
    } else if (location) {
      apiUrl.searchParams.append('q', location);
    } else {
      return NextResponse.json(
        { error: 'Either location or coordinates (lat/lon) are required' },
        { status: 400 }
      );
    }

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

    const data: WeatherData = await response.json();

    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 