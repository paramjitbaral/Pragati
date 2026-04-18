import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : null;

const app = serviceAccount ? admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }) : admin.initializeApp({
    projectId: 'ai-studio-applet-webapp-24ad3'
  });

// CRITICAL: Must use the specific database ID as seen in firebase-applet-config.json!
export const adminDb = getFirestore(app, 'ai-studio-0a501940-bdfc-4534-a933-ada40736beb6');
export default admin;
