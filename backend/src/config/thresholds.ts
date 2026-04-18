export const WEATHER_THRESHOLDS = {
  RAIN_MM_PER_HOUR: 15,    // > 15mm/hr
  TEMP_CELSIUS: 42,        // > 42°C
  WIND_KM_PER_HOUR: 50,    // > 50 km/h
};

export const FRAUD_THRESHOLDS = {
  MAX_GPS_IP_DISTANCE_KM: 5,        // Reject if > 5km difference
  AUTO_APPROVE_TRUST_SCORE: 80,     // If score > 80 → auto approve
  COOLDOWN_PERIOD_HRS: 24,          // Abuse prevention
};

export const LOCATION_VERIFICATION = {
  DISTANCE_MISMATCH_REJECT_KM: 5,
};
