import { collection, doc, getDocs, setDoc, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const seedInitialData = async () => {
  try {
    // Check if plans already exist
    const plansSnap = await getDocs(query(collection(db, 'plans'), limit(1)));
    if (plansSnap.empty) {
      console.log('Seeding initial insurance plans...');
      const plans = [
        {
          id: 'basic-plan',
          name: 'Basic Parametric',
          description: 'Essential coverage for peace of mind.',
          premium: 8.00,
          coverage: 40,
          tier: 'Basic'
        },
        {
          id: 'standard-plan',
          name: 'Standard Parametric',
          description: 'Optimal protection for professional couriers.',
          premium: 14.50,
          coverage: 70,
          tier: 'Pro'
        },
        {
          id: 'elite-plan',
          name: 'Elite Parametric',
          description: 'Unmatched security with maximum yield.',
          premium: 22.00,
          coverage: 100,
          tier: 'Elite'
        }
      ];

      for (const plan of plans) {
        await setDoc(doc(db, 'plans', plan.id), plan);
      }
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      // Silently ignore permission errors during seeding as they are expected for non-admins
      return;
    }
    console.error('Error seeding initial data:', error);
  }
};
