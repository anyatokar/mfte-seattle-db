import * as fs from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const DESTINATION_COLLECTION = 'buildings-2022-01';
const DATABASE_TO_IMPORT = './db/buildings-2022-01-31.json';

const buildings = JSON.parse(fs.readFileSync(DATABASE_TO_IMPORT)).slice(0,2);

const firebaseApp = initializeApp({
  credential: applicationDefault(),
  databaseURL: "https://mfte-simple-92c08-default-rtdb.firebaseio.com"
});

let countWritten = 0;
let countUpdated = 0;
const db = getFirestore(firebaseApp);


// Import each building in the JSON file
const extractFields = (bldg, revision = 0) => ({
  buildingName: bldg.buildingName,
  phone: bldg.phone,
  phone2: bldg.phone2,
  residentialTargetedArea: bldg.residentialTargetedArea,
  totalRestrictedUnits: bldg.totalRestrictedUnits,
  sedu: bldg.sedu,
  studioUnits: bldg.studioUnits,
  oneBedroomUnits: bldg.oneBedroomUnits,
  twoBedroomUnits: bldg.twoBedroomUnits,
  threePlusBedroomUnits: bldg.threePlusBedroomUnits,
  urlForBuilding: bldg.urlForBuilding,
  lat: bldg.lat,
  lng: bldg.lng,
  streetNum: bldg.streetNum,
  street: bldg.street,
  city: bldg.city,
  state: bldg.state,
  zip: bldg.zip,
  revision
});

for await (const bldg of buildings) {
  const buildingCollection = db.collection(DESTINATION_COLLECTION);
  const buildingsWithThisName = await buildingCollection.where('buildingName', '==', bldg.buildingName).get();

  // If the building exists...
  if (!buildingsWithThisName.empty) {
    // Warn if there are duplicates
    if (buildingsWithThisName.size > 1) {
      console.error(`WARNING: multiple buildings exist in the DB with the name "${bldg.buildingName}"`);
    }
    const bldgToUpdate = buildingsWithThisName.docs.at(0);

    // The building exists; check if it needs to be updated w/ a revision.
    const currentBuildingData = bldgToUpdate.data();
    const newBuildingData = extractFields(bldg, currentBuildingData.revision);

    if (JSON.stringify(currentBuildingData) === JSON.stringify(newBuildingData)) {
      // No changes; no revision needed.
      continue;
    }

    // Something changed. Increment the revision and set the new building data.
    newBuildingData.revision += 1;
    await bldgToUpdate.ref.set(newBuildingData);
    console.log(`Successfully updated doc with id ${bldgToUpdate.ref.id}, revision ${nextRevision}`);
    countUpdated += 1;
    continue;
  }

  // Otherwise, if the building does not exist...
  let docRef
  try {
    docRef = await buildingCollection.add(extractFields(bldg));
  } catch(error) {
    console.error("Error adding document: ", error);
  }

  console.log("Document added with ID: ", docRef.id);
  countWritten += 1;

  const currentBuilding = buildingCollection.doc(docRef.id);

  try {
    await currentBuilding.update({ buildingID: docRef.id });
    console.log("Document successfully updated with id: ", docRef.id);
    countUpdated += 1;
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}

console.log("Count added: ", countWritten);
console.log("Count updated: ", countUpdated);
