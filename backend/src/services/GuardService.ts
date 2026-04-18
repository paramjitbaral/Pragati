import admin, { adminDb } from '../config/firebase-admin.js';
import { FraudEngine } from './FraudEngine.js';

interface Location {
  lat: number;
  lon: number;
  timestamp: number;
}

interface GuardSession {
  id: string;
  userId: string;
  status: 'active' | 'ended';
  startTime: string;
  endTime?: string;
  lastLocation: Location;
  checkpoints: Location[];
  fraudScore: number;
  suspiciousFlags: string[];
  verificationRequired: boolean;
  verificationType?: 'photo' | 'otp';
}

export class GuardService {
  private static MAX_SPEED_KPH = 80; // Realistic delivery speed
  private static MIN_MOVEMENT_METERS = 5; // To flag "no movement"
  private static TELEPORT_THRESHOLD_KM = 5; // Max jump between pings (e.g. 1 min)

  public static async startSession(userId: string, initialLocation: Location) {
    const sessionData: any = {
      userId,
      status: 'active',
      startTime: new Date().toISOString(),
      lastLocation: initialLocation,
      checkpoints: [initialLocation],
      fraudScore: 0,
      suspiciousFlags: [],
      verificationRequired: false,
    };

    const docRef = await adminDb.collection('guard_sessions').add(sessionData);
    return { id: docRef.id, ...sessionData };
  }

  public static async pingSession(sessionId: string, currentLocation: Location) {
    const sessionRef = adminDb.collection('guard_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists || sessionDoc.data()?.status === 'ended') {
      throw new Error('Session not active');
    }

    const data = sessionDoc.data() as GuardSession;
    const lastLoc = data.lastLocation;
    const suspiciousFlags: string[] = [...data.suspiciousFlags];
    let fraudScore = data.fraudScore;

    // 1. Validate Movement
    const distanceKm = this.calculateDistance(lastLoc.lat, lastLoc.lon, currentLocation.lat, currentLocation.lon);
    const timeDiffHours = (currentLocation.timestamp - lastLoc.timestamp) / (1000 * 60 * 60);
    const speedKph = timeDiffHours > 0 ? distanceKm / timeDiffHours : 0;

    // Flag: Teleportation
    if (distanceKm > this.TELEPORT_THRESHOLD_KM && timeDiffHours < 0.02) { // 5km in < 1.2 min
       suspiciousFlags.push(`Teleport detected: ${distanceKm.toFixed(2)}km jump`);
       fraudScore += 40;
    }

    // Flag: Unrealistic Speed
    if (speedKph > this.MAX_SPEED_KPH) {
       suspiciousFlags.push(`Unrealistic speed: ${speedKph.toFixed(1)} km/h`);
       fraudScore += 30;
    }

    // Flag: No movement for long duration (e.g. if we get multiple pings with 0 distance)
    // Simplified: Check if last 3 checkpoints are same place.
    const lastCheckpoints = data.checkpoints.slice(-3);
    if (lastCheckpoints.length === 3 && lastCheckpoints.every(cp => cp.lat === currentLocation.lat && cp.lon === currentLocation.lon)) {
       // Only flag if session has been active for a while
       suspiciousFlags.push('Stagnant position detected');
       fraudScore += 10;
    }

    // 2. Zone Validation (Mock: Central Delhi)
    const isInZone = this.checkZone(currentLocation.lat, currentLocation.lon);
    if (!isInZone) {
       suspiciousFlags.push('Exited assigned delivery zone');
       fraudScore += 20;
    }

    // 3. Smart Verification Trigger
    let verificationRequired = false;
    let verificationType: 'photo' | 'otp' | undefined;

    // Random ~20% or if fraudScore > 50
    const shouldVerify = Math.random() < 0.1 || fraudScore >= 50;
    if (shouldVerify && !data.verificationRequired) {
       verificationRequired = true;
       verificationType = Math.random() > 0.5 ? 'photo' : 'otp';
    }

    const updates: any = {
      lastLocation: currentLocation,
      checkpoints: admin.firestore.FieldValue.arrayUnion(currentLocation),
      fraudScore: Math.min(100, fraudScore),
      suspiciousFlags: Array.from(new Set(suspiciousFlags)),
      verificationRequired: verificationRequired || data.verificationRequired,
    };

    if (verificationType || data.verificationType) {
      updates.verificationType = verificationType || data.verificationType;
    }

    await sessionRef.update(updates);
    
    // Also update User Trust Score in profile
    await this.updateUserTrust(data.userId, fraudScore);

    return { 
      success: true, 
      fraudScore: updates.fraudScore, 
      verificationRequired: updates.verificationRequired,
      verificationType: updates.verificationType
    };
  }

  public static async endSession(sessionId: string) {
    const sessionRef = adminDb.collection('guard_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) throw new Error('Session not found');
    
    const data = sessionDoc.data() as GuardSession;
    
    // If session was clean (fraudScore < 10), boost user trust
    if (data.fraudScore < 10) {
      const userRef = adminDb.collection('users').doc(data.userId);
      await userRef.update({
        reliabilityIndex: admin.firestore.FieldValue.increment(2),
        updatedAt: new Date().toISOString()
      });
    }

    await sessionRef.update({
      status: 'ended',
      endTime: new Date().toISOString()
    });

    return { success: true };
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static checkZone(lat: number, lon: number) {
    // Mock Zone: Delhi Central (Approx 28.5 to 28.7 lat, 77.1 to 77.3 lon)
    return lat >= 28.5 && lat <= 28.8 && lon >= 77.0 && lon <= 77.4;
  }

  private static async updateUserTrust(userId: string, fraudScore: number) {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return;

    const currentScore = userSnap.data()?.behavioralTrustScore || 0;
    
    // Decrement trust if fraud score is high
    if (fraudScore > 40) {
       await userRef.update({
          behavioralTrustScore: Math.max(0, currentScore - 5),
          reliabilityIndex: admin.firestore.FieldValue.increment(-2),
          updatedAt: new Date().toISOString()
       });
    }
  }
}
