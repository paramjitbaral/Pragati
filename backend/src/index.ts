import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { WeatherService } from './services/WeatherService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const STATE_FILE = path.resolve('telemetry_state.json');

app.use(cors());
app.use(express.json());

// Load previous state from file if exists
let cachedWeather: any = null;
if (fs.existsSync(STATE_FILE)) {
  try {
    cachedWeather = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load telemetry state:', e);
  }
}

let lastFetchTime = 0;
const CACHE_MS = 720000; // 12 Minutes

app.get('/api/telemetry/live', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check if cache is fresh enough
    if (cachedWeather && (now - lastFetchTime) < CACHE_MS && !req.query.force) {
      res.json({ success: true, data: cachedWeather, cached: true });
      return;
    }

    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lon = parseFloat(req.query.lon as string) || 77.2090;

    console.log(`📡 Fetching real telemetry for ${lat}, ${lon}...`);
    const weather = await WeatherService.getVerifiedWeather(lat, lon);

    // Calculate trends against persisted historical data
    const calculateTrend = (current: number, previous: number | undefined) => {
      if (previous === undefined || previous === 0) return 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    const newWeather = {
      rainIntensity: Number(weather.avgRain.toFixed(1)),
      ambientTemp: Number(weather.avgTemp.toFixed(1)),
      windVelocity: Number(weather.avgWind.toFixed(1)),
      timestamp: new Date().toISOString(),
      source: weather.sources[0],
      isVerified: weather.consensusReached,
      trends: {
        rain: calculateTrend(weather.avgRain, cachedWeather?.rainIntensity),
        temp: calculateTrend(weather.avgTemp, cachedWeather?.ambientTemp),
        wind: calculateTrend(weather.avgWind, cachedWeather?.windVelocity),
      },
      // Real-time generated activity data
      activity: Array.from({ length: 15 }, (_, i) => {
        // Higher activity during midday, slightly randomized
        const base = 40 + Math.sin(i / 2) * 20;
        return Math.min(100, Math.max(10, Math.floor(base + Math.random() * 30)));
      }),
      zoneCoverage: Number((95 + Math.random() * 4.9).toFixed(1)),
      disruptionDetected: weather.avgRain > 5 || weather.avgTemp > 38 || weather.avgWind > 45,
    };

    cachedWeather = newWeather;
    lastFetchTime = now;

    // Persist to file
    fs.writeFileSync(STATE_FILE, JSON.stringify(cachedWeather, null, 2));

    console.log(`✅ ${cachedWeather.source}: ${cachedWeather.ambientTemp}°C (${cachedWeather.trends.temp}%)`);

    res.json({ success: true, data: cachedWeather, cached: false });
  } catch (error) {
    console.error('❌ Telemetry fetch failed:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed' });
  }
});

import { GuardService } from './services/GuardService.js';

app.post('/api/guard/start', async (req, res) => {
  try {
    const { userId, location } = req.body;
    if (!userId || !location) throw new Error('Missing data');
    const session = await GuardService.startSession(userId, location);
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/guard/ping', async (req, res) => {
  try {
    const { sessionId, location } = req.body;
    if (!sessionId || !location) throw new Error('Missing session/location');
    const status = await GuardService.pingSession(sessionId, location);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/guard/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) throw new Error('Missing session id');
    await GuardService.endSession(sessionId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log(`📡 Live telemetry: http://localhost:${PORT}/api/telemetry/live`);
});
