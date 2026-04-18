import axios from 'axios';
import { WEATHER_THRESHOLDS } from '../config/thresholds.js';

interface WeatherData {
  temp: number;
  rain: number;
  wind: number;
  source: string;
}

export class WeatherService {
  private static async fetchFromWeatherAPI(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const resp = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHERAPI_KEY}&q=${lat},${lon}&days=1`);
      return {
        temp: resp.data.current.temp_c,
        rain: resp.data.current.precip_mm,
        wind: resp.data.current.wind_kph,
        source: 'WeatherAPI',
      };
    } catch (e) {
      console.error('WeatherAPI error: ', e);
      return null;
    }
  }

  private static async fetchFromOpenWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const resp = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHERMAP_KEY}&units=metric`);
      return {
        temp: resp.data.main.temp,
        rain: resp.data.rain ? resp.data.rain['1h'] || 0 : 0,
        wind: resp.data.wind.speed * 3.6, // Convert m/s to kph
        source: 'OpenWeatherMap',
      };
    } catch (e) {
      console.error('OpenWeatherMap error: ', e);
      return null;
    }
  }

  private static async fetchFromTomorrowIO(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const resp = await axios.get(`https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${process.env.TOMORROWIO_KEY}`);
      if (!resp.data?.data?.values) return null;
      
      const v = resp.data.data.values;
      return {
        temp: v.temperature,
        rain: v.precipitationIntensity || 0,
        wind: v.windSpeed * 3.6, // Convert m/s to kph (Tomorrow.io default is m/s)
        source: 'Tomorrow.io',
      };
    } catch (e) {
      console.error('Tomorrow.io error: ', e);
      return null;
    }
  }

  public static async getVerifiedWeather(lat: number, lon: number) {
    // Sequential fallback strategy
    const sources = [
      { name: 'Tomorrow.io', fetcher: () => this.fetchFromTomorrowIO(lat, lon) },
      { name: 'WeatherAPI', fetcher: () => this.fetchFromWeatherAPI(lat, lon) },
      { name: 'OpenWeatherMap', fetcher: () => this.fetchFromOpenWeather(lat, lon) },
    ];

    let result: WeatherData | null = null;
    let selectedSource = 'None';

    for (const source of sources) {
      try {
        result = await source.fetcher();
        if (result) {
          selectedSource = source.name;
          break;
        }
      } catch (e) {
        console.warn(`⚠️ Source ${source.name} failed, trying next...`);
      }
    }

    if (!result) {
      throw new Error('All weather data sources failed. Check your API keys and quotas.');
    }

    console.log(`✅ Weather data retrieved from ${selectedSource}`);

    return {
      avgTemp: result.temp,
      avgRain: result.rain,
      avgWind: result.wind,
      consensusReached: true, // In sequential mode, we trust the primary available source
      sources: [selectedSource],
      raw: [result]
    };
  }
}
