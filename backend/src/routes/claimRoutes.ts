import express from 'express';
import { WeatherService } from '../services/WeatherService.js';
import { FraudEngine } from '../services/FraudEngine.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import { FRAUD_THRESHOLDS } from '../config/thresholds.js';
import { adminDb } from '../config/firebase-admin.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const { userId, gpsLat, gpsLong, proofUrl } = req.body;
    const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // 1. Fetch or Sync User Data (Ensure MySQL is in sync with Firebase)
    const [user] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        id: userId,
        email: 'user@example.com', // In production, pass email from context
        trustScore: 80, // Start with a reasonable trust score
        activePlanId: 'standard-pro' // Default for now
      }
    });

    // 2. Fetch Verified Weather (Accuracy Check)
    const weather = await WeatherService.getVerifiedWeather(gpsLat, gpsLong);

    // 3. Verify Location Authenticity (Anti-Spoofing)
    const locationVerify = await FraudEngine.verifyLocationAuthenticity({
      gpsLat,
      gpsLong,
      ipAddr: typeof ipAddr === 'string' ? ipAddr : (Array.isArray(ipAddr) ? ipAddr[0] || '127.0.0.1' : '127.0.0.1'),
    });

    // 4. Check Weather Thresholds
    const thresholdCheck = FraudEngine.isThresholdExceeded(weather);

    // 5. Calculate Trust Score
    const trustScore = FraudEngine.calculateTrustScore(
      locationVerify.isAuthentic,
      weather.consensusReached,
      user.trustScore,
      thresholdCheck.severity
    );

    // 6. Determine Success/Status
    let status: 'pending' | 'approved' | 'rejected' | 'flagged' = 'pending';
    let fraudNotes = locationVerify.notes;

    if (!thresholdCheck.exceeded) {
      status = 'rejected';
      fraudNotes += ' | Weather thresholds were not met.';
    } else if (trustScore >= FRAUD_THRESHOLDS.AUTO_APPROVE_TRUST_SCORE) {
      status = 'approved';
    } else if (trustScore < 50) {
      status = 'flagged';
      fraudNotes += ' | Extremely low trust score detected.';
    }

    // 7. Store Claim to MySQL
    const claim = await Claim.create({
      userId,
      disruptionType: thresholdCheck.reasons.rain ? 'rain' : (thresholdCheck.reasons.temp ? 'temp' : 'wind'),
      status,
      trustScore,
      gpsLat,
      gpsLong,
      ipLat: locationVerify.ipLat,
      ipLong: locationVerify.ipLong,
      weatherDataJson: JSON.stringify(weather),
      fraudNotes,
      proofUrl,
    });

    // 8. ALSO Push to Firestore activity_logs to make UI update INSTANTLY
    await adminDb.collection('activity_logs').add({
      id: `LOG-${claim.id}`, // Required by rules
      userId,
      title: status === 'approved' ? `Payout Approved (${claim.disruptionType})` : `Provision Claim (${status})`,
      date: new Date().toISOString(),
      amount: status === 'approved' ? `+$${(thresholdCheck.severity * 50).toFixed(2)}` : 'Reviewing', // Mock payout amount based on severity
      status: status === 'approved' ? 'Confirmed' : 'Pending',
      type: status === 'approved' ? 'payout' : 'alert',
      claimId: claim.id
    });

    // If it's a major disruption, let's trigger an alert in Firestore too
    if (thresholdCheck.exceeded) {
      await adminDb.collection('alerts').add({
        id: `ALT-${Date.now()}`, // Required by rules
        type: claim.disruptionType,
        message: `Disruption Triggered: ${thresholdCheck.reasons.rain || thresholdCheck.reasons.temp || thresholdCheck.reasons.wind}`,
        payoutAmount: thresholdCheck.severity * 50,
        timestamp: new Date().toISOString(),
        status: status === 'approved' ? 'resolved' : 'active',
      });
    }

    res.json({
      success: true,
      claimId: claim.id,
      status: claim.status,
      trustScore: claim.trustScore,
      verificationResult: {
        location: locationVerify,
        weather: {
          temp: weather.avgTemp,
          rain: weather.avgRain,
          wind: weather.avgWind,
          consensus: weather.consensusReached,
        },
        thresholds: thresholdCheck,
      }
    });

  } catch (error) {
    console.error('Claim Submission Error: ', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
  }
});

export default router;
