export interface Location {
  name: string;
  country: string;
  countryEmoji: string;
  cityEmoji: string;
  timezone: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  aliases: string[];
} 