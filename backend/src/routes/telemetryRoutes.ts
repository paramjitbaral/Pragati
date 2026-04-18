import express from 'express';
import { WeatherService } from '../services/WeatherService.js';

const router = express.Router();

// Cache the latest weather data in memory
let cachedWeather: any = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 180000; // 3 minutes

router.get('/live', async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if fresh enough
    if (cachedWeather && (now - lastFetchTime) < CACHE_DURATION_MS) {
      return res.json({ success: true, data: cachedWeather, cached: true });
    }

    // Fetch fresh weather data
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lon = parseFloat(req.query.lon as string) || 77.2090;

    console.log(`📡 Fetching real telemetry for ${lat}, ${lon}...`);
    const weather = await WeatherService.getVerifiedWeather(lat, lon);

    cachedWeather = {
      rainIntensity: weather.avgRain,
      ambientTemp: weather.avgTemp,
      windVelocity: weather.avgWind,
      timestamp: new Date().toISOString(),
      source: weather.sources.join(' + '),
      isVerified: weather.consensusReached,
    };
    lastFetchTime = now;

    console.log(`✅ REAL TEMPERATURE: ${weather.avgTemp.toFixed(1)}°C | Rain: ${weather.avgRain}mm | Wind: ${weather.avgWind.toFixed(1)}km/h`);

    res.json({ success: true, data: cachedWeather, cached: false });
  } catch (error) {
    console.error('❌ Telemetry fetch failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Weather fetch failed' 
    });
  }
});

export default router;
