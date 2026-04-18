import axios from 'axios';
import { FRAUD_THRESHOLDS, WEATHER_THRESHOLDS } from '../config/thresholds.js';

interface VerifyLocationProps {
  gpsLat: number;
  gpsLong: number;
  ipAddr: string;
}

export class FraudEngine {
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public static async verifyLocationAuthenticity({ gpsLat, gpsLong, ipAddr }: VerifyLocationProps) {
    let lat: number | null = null;
    let lon: number | null = null;
    let sourceUsed = 'Unknown';

    // 1. Try Primary: IPGeolocation
    try {
      const resp = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_KEY}&ip=${ipAddr}`);
      lat = parseFloat(resp.data.latitude);
      lon = parseFloat(resp.data.longitude);
      sourceUsed = 'IPGeolocation';
    } catch (e) {
      console.warn('IPGeolocation failed, trying fallback: ', (e as any).message);
      
      // 2. Try Fallback: ip-api.com
      try {
        const resp = await axios.get(`http://ip-api.com/json/${ipAddr}`);
        lat = resp.data.lat;
        lon = resp.data.lon;
        sourceUsed = 'ip-api.com';
      } catch (e2) {
        console.error('All IP Location APIs failed.');
      }
    }

    if (lat === null || lon === null) {
      return {
        isAuthentic: true, // Fail-safe: don't reject if we can't verify
        distanceMismatchKm: 0,
        notes: 'IP Geolocation APIs unavailable. Skipping distance check.',
      };
    }

    const distance = this.calculateDistance(gpsLat, gpsLong, lat, lon);

    return {
      isAuthentic: distance <= FRAUD_THRESHOLDS.MAX_GPS_IP_DISTANCE_KM,
      distanceMismatchKm: distance,
      notes: distance > FRAUD_THRESHOLDS.MAX_GPS_IP_DISTANCE_KM ? `Distance mismatch of ${distance.toFixed(2)}km detected via ${sourceUsed}!` : `Location verified via ${sourceUsed}.`,
      ipLat: lat,
      ipLong: lon,
    };
  }

  public static calculateTrustScore(
    locationAuthentic: boolean,
    weatherConsensus: boolean,
    userTrustScore: number,
    disruptionSeverity: number // How much it exceeded threshold (0 to 1)
  ) {
    let score = 100;

    if (!locationAuthentic) score -= 50;
    if (!weatherConsensus) score -= 30;
    if (userTrustScore < 50) score -= 20;

    // Bonus for high severity disruptions
    score += Math.min(20, disruptionSeverity * 20);

    return Math.max(0, Math.min(100, score));
  }

  public static isThresholdExceeded(weatherData: { avgTemp: number; avgRain: number; avgWind: number }) {
    const isRainy = weatherData.avgRain > WEATHER_THRESHOLDS.RAIN_MM_PER_HOUR;
    const isHot = weatherData.avgTemp > WEATHER_THRESHOLDS.TEMP_CELSIUS;
    const isWindy = weatherData.avgWind > WEATHER_THRESHOLDS.WIND_KM_PER_HOUR;

    return {
      exceeded: isRainy || isHot || isWindy,
      reasons: {
        rain: isRainy ? `Rain intensity ${weatherData.avgRain}mm/hr exceeds threshold.` : null,
        temp: isHot ? `Temperature ${weatherData.avgTemp}°C exceeds threshold.` : null,
        wind: isWindy ? `Wind speed ${weatherData.avgWind}km/h exceeds threshold.` : null,
      },
      severity: Math.max(
        isRainy ? weatherData.avgRain / WEATHER_THRESHOLDS.RAIN_MM_PER_HOUR : 0,
        isHot ? weatherData.avgTemp / WEATHER_THRESHOLDS.TEMP_CELSIUS : 0,
        isWindy ? weatherData.avgWind / WEATHER_THRESHOLDS.WIND_KM_PER_HOUR : 0
      )
    };
  }
}
