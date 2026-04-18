import { adminDb } from '../config/firebase-admin.js';
import { WeatherService } from './WeatherService.js';

export class TelemetryService {
  private static intervalId: NodeJS.Timeout | null = null;

  public static async updateGlobalTelemetry() {
    try {
      // For Demo/Dev: Using a default location (e.g., Delhi/Gurgaon Area as per user context)
      // Lat/Lon for New Delhi: 28.6139, 77.2090
      const lat = 28.6139;
      const lon = 77.2090;

      console.log(`📡 Fetching real telemetry for ${lat}, ${lon}...`);
      const weather = await WeatherService.getVerifiedWeather(lat, lon);

      console.log(`✅ REAL TEMPERATURE FETCHED: ${weather.avgTemp.toFixed(1)}°C`);

      const telemetryUpdate = {
        id: `TEL-${Date.now()}`,
        rainIntensity: weather.avgRain,
        ambientTemp: weather.avgTemp,
        windVelocity: weather.avgWind,
        timestamp: new Date().toISOString(),
        source: weather.sources.join(' + '),
        isVerified: weather.consensusReached,
      };

      // Push to Firestore to make the Frontend Gauges move!
      await adminDb.collection('telemetry').add(telemetryUpdate);
      
      console.log('✅ Real-time Telemetry Synced to Firestore.');
    } catch (e) {
      console.error('❌ Failed to update telemetry:', e);
    }
  }

  public static startPolling(intervalMs: number = 300000) { // Every 5 minutes
    if (this.intervalId) clearInterval(this.intervalId);
    
    // Initial update
    this.updateGlobalTelemetry();
    
    this.intervalId = setInterval(() => {
      this.updateGlobalTelemetry();
    }, intervalMs);
  }
}
