import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BUILDING_COLLECTION = 'buildings';
const BACKUP_COLLECTION = `${BUILDING_COLLECTION}-bkp-${new Date().toISOString()}`;

const firebaseApp = initializeApp({
  credential: applicationDefault(),
  databaseURL: "https://mfte-simple-92c08-default-rtdb.firebaseio.com"
});

const db = getFirestore(firebaseApp);
const buildingCollection = db.collection(BUILDING_COLLECTION);
const destination = db.collection(BACKUP_COLLECTION);

const allBuildings = await buildingCollection.get();

const batchWrite = db.batch();

for (const bldg of allBuildings.docs) {
  const backupBldgRef = destination.doc(bldg.ref.id);
  batchWrite.set(backupBldgRef, bldg.data());
}

await batchWrite.commit();
console.log('Backup complete.');
