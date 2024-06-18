// README Step 5: Change this to the updated json
import buildings from "./BuildingJSONs/buildings_2024_04_AMI.json" assert { type: "json" };
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import IBuilding, {
  amiDataType,
  originalFieldsType,
  percentBreakdownType,
} from "./types_and_interfaces/IBuilding";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_APIKEY,
  authDomain: process.env.REACT_APP_AUTHDOMAIN,
  databaseURL: process.env.REACT_APP_DB,
  projectId: process.env.REACT_APP_PID,
  storageBucket: process.env.REACT_APP_SB,
  messagingSenderId: process.env.REACT_APP_SID,
  appId: process.env.REACT_APP_APPID,
  measurementId: process.env.REACT_APP_MID,
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

let successCount = 0;
let errorCount = 0;
let totalCount = 0;

function formatAmiData(obj: originalFieldsType): amiDataType {
  const amiValues = [30, 40, 50, 60, 65, 70, 75, 80, 85, 90];
  const types = ["micro", "studio", "oneBed", "twoBed", "threePlusBed"];

  const result = types.reduce((acc, type) => {
    acc[type] = amiValues.reduce((innerAcc, val) => {
      const key = `ami_${val}_${type}`;
      innerAcc[val] = obj[key] ? Number(obj[key]) : null;
      return innerAcc;
    }, {} as percentBreakdownType);
    return acc;
  }, {} as amiDataType);

  console.log(result);
  return result;
}
/*
  https://firebase.google.com/docs/firestore/manage-data/add-data#set_a_document
  If the document does not exist, it will be created.
  If the document does exist, its contents will be overwritten with the newly provided data.

  All data are strings except:
  - if sedu/seduUnits/oneBedroomUnits etc is 0 (otherwise it's a string),
  - lat, lng which must be a number for mapping, and
  - amiData values.
*/
// Function to convert originalFieldsType to IBuilding
function convertToIBuilding(obj: originalFieldsType): IBuilding {
  return {
    buildingID: obj.buildingID,
    dateCode: obj.dateCode,
    IDWithDateCode: obj.IDWithDateCode,
    buildingName: obj.buildingName,
    phone: obj.phone,
    phone2: obj.phone2,
    residentialTargetedArea: obj.residentialTargetedArea,
    totalRestrictedUnits: obj.totalRestrictedUnits,
    sedu: obj.sedu === "0" ? 0 : obj.sedu,
    studioUnits: obj.studioUnits === "0" ? 0 : obj.studioUnits,
    oneBedroomUnits: obj.oneBedroomUnits === "0" ? 0 : obj.oneBedroomUnits,
    twoBedroomUnits: obj.twoBedroomUnits === "0" ? 0 : obj.twoBedroomUnits,
    threePlusBedroomUnits:
      obj.threePlusBedroomUnits === "0" ? 0 : obj.threePlusBedroomUnits,
    urlForBuilding: obj.urlForBuilding,
    lat: parseFloat(obj.lat),
    lng: parseFloat(obj.lng),
    streetNum: obj.streetNum,
    street: obj.street,
    city: obj.city,
    state: obj.state,
    zip: obj.zip,
    updatedTimestamp: Timestamp.fromDate(new Date()),
    amiData: formatAmiData(obj),
    streetAddress: obj.streetAddress,
  };
}

// Function to handle Firestore operations
async function processBuilding(buildingData: IBuilding) {
  try {
    await setDoc(
      doc(db, "buildingsTEST", buildingData.buildingID),
      buildingData
    );
    console.log(
      "Successfully set building doc with BuildingID: ",
      buildingData.buildingID
    );
    successCount += 1;
  } catch (error) {
    console.error(
      `Error adding document with buildingID ${buildingData.buildingID}: `,
      error
    );
    errorCount += 1;
  } finally {
    totalCount += 1;
    console.log(
      `Total successful writes: ${successCount} out of ${totalCount}`
    );
    console.log("---------");
  }
}

// Process all buildings
async function processAllBuildings(buildings: originalFieldsType[]) {
  const buildingPromises = buildings.map(async (obj) => {
    const buildingData = convertToIBuilding(obj);
    await processBuilding(buildingData);
  });
  await Promise.all(buildingPromises);
}

processAllBuildings(buildings).catch((error) =>
  console.error("Error processing buildings: ", error)
);
