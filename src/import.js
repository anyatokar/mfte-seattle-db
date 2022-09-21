import * as fs from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const DESTINATION_COLLECTION = 'buildings-2022-01';
const DATABASE_TO_IMPORT = './db/buildings-2022-01-31.json';

const buildings = JSON.parse(fs.readFileSync(DATABASE_TO_IMPORT));

const firebaseApp = initializeApp({
  credential: applicationDefault(),
  databaseURL: "https://mfte-simple-92c08-default-rtdb.firebaseio.com"
});

let countWritten = 0;
let countIdGend = 0;
let countUpdated = 0;
let countDeleted = 0;
const db = getFirestore(firebaseApp);

// This is the current set of fields the app expects in the database for each building,
// not including the buildingID, but also adding on a revision field the app doesn't currently
// look for.
const extractFields = (bldg, revision = 0) => {
  const extractedFields = {
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
  };

  if ('buildingID' in bldg) {
    extractedFields.buildingID = bldg.buildingID;
  }

  return extractedFields;
};

const buildingNeedsUpdate = (existingBldg, newBldg) => {
  // Existing building needs an update if any field it has is different from a field that newBldg has.
  for (let [key, value] of Object.entries(existingBldg)) {
    if (key in newBldg && newBldg[key] !== value) {
      return true;
    }
  }

  return false;
}

const buildingCollection = db.collection(DESTINATION_COLLECTION);
const allBuildings = await buildingCollection.get();

for await (const existingBuilding of allBuildings.docs) {
  const existingBldgData = existingBuilding.data();
  const bldgWithThisName = buildings.find(b => b.buildingName === existingBldgData.buildingName);

  // For each existing building:
  // 1. If it's not in the JSON for the buildings, delete the ref.
  // 2. If it is, mark it as existing (by adding the document id) in the buildings list
  // 3. See if it needs updating and increment its revision if we do update it.

  if (!bldgWithThisName) {
    console.log(`Removing building ${existingBuilding.ref.id}, which is not in the new db`);
    await existingBuilding.ref.delete();
    countDeleted += 1;
  } else {
    // Building exists. Mark it with the buildingID.
    bldgWithThisName.buildingID = existingBldgData.buildingID;

    // If something is different, update and increment revision.
    if (buildingNeedsUpdate(existingBldgData, bldgWithThisName)) {
      const newBuildingData = extractFields(bldgWithThisName, existingBldgData.revision + 1);
      await existingBuilding.ref.set(newBuildingData);
      console.log(`Successfully updated building ${existingBuilding.ref.id}, revision ${newBuildingData.revision}`);
      countUpdated += 1;
    } else {
      console.log(`Building ${existingBuilding.ref.id} is already up to date.`);
    }
  }
}

// Any buildings that aren't marked as in firestore yet need to be added.
const newBuildings = buildings.filter(b => !('buildingID' in b));
for await (const bldg of newBuildings) {
  let docRef
  try {
    docRef = await buildingCollection.add(extractFields(bldg));
  } catch(error) {
    console.error("Error adding building: ", error);
  }

  console.log("Building added with ID: ", docRef.id);
  countWritten += 1;

  const currentBuilding = buildingCollection.doc(docRef.id);

  try {
    await currentBuilding.update({ buildingID: docRef.id });
    console.log("buildingID written back into building: ", docRef.id);
    countIdGend += 1;
  } catch (error) {
    console.error("Error updating building with new ID: ", error);
  }
}

console.log(`Added ${countWritten}, id generated for ${countIdGend}, deleted ${countDeleted}, updated ${countUpdated}`);
