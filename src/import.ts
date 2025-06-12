// README Step 5: Change this to the updated json
import buildings from "./BuildingJSONs/buildings_06_3_2025.json" assert { type: "json" };
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import { OriginalFields } from "./types_and_interfaces/OriginalFields";
import IBuilding, {
  AmiData,
  PercentAmi,
} from "./types_and_interfaces/IBuilding";
import { BedroomsKeyEnum } from "./types_and_interfaces/enums";

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

function formatAmiData(obj: OriginalFields): AmiData {
  const amiPercents: PercentAmi[] = [
    "30",
    "40",
    "50",
    "60",
    "65",
    "70",
    "75",
    "80",
    "85",
    "90",
  ];

  const unitSizes: BedroomsKeyEnum[] = [
    BedroomsKeyEnum.MICRO,
    BedroomsKeyEnum.STUDIO,
    BedroomsKeyEnum.ONE_BED,
    BedroomsKeyEnum.TWO_BED,
    BedroomsKeyEnum.THREE_PLUS,
  ];

  const amiData = {} as AmiData;

  for (let unitSize of unitSizes) {
    const existingPercents: PercentAmi[] = [];

    for (let percent of amiPercents) {
      const key = `ami_${percent}_${unitSize}`;

      if (obj[key] === "1") {
        existingPercents.push(percent);
      }
    }

    if (existingPercents.length > 0) {
      amiData[unitSize] = existingPercents;
    }
  }

  return amiData;
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
function convertToIBuilding(obj: OriginalFields): IBuilding {
  return {
    buildingID: obj.buildingID,
    dateCode: obj.dateCode,
    isEnding: !!obj.isEnding,
    isAgeRestricted: !!obj.isAgeRestricted,
    buildingName: obj.buildingName,
    address: {
      city: obj.city,
      state: obj.state,
      zip: obj.zip,
      neighborhood: obj.neighborhood,
      streetAddress: obj.streetAddress,
      lat: parseFloat(obj.lat),
      lng: parseFloat(obj.lng),
    },
    contact: {
      phone: obj.phone,
      phone2: obj.phone2,
      urlForBuilding: obj.urlForBuilding,
    },
    searchFields: {
      buildingName: obj.buildingName,
      neighborhood: obj.neighborhood,
      streetAddress: obj.streetAddress,
      zip: obj.zip,
    },

    updatedTimestamp: Timestamp.fromDate(new Date()),
    amiData: formatAmiData(obj),
  };
}

// Function to handle Firestore operations
async function processBuilding(buildingData: IBuilding) {
  try {
    await setDoc(doc(db, "buildings_5", buildingData.buildingID), buildingData);
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
async function processAllBuildings(buildings: OriginalFields[]): Promise<void> {
  const buildingPromises = buildings.map(async (obj) => {
    const buildingData = convertToIBuilding(obj);
    await processBuilding(buildingData);
  });
  await Promise.all(buildingPromises);
}

processAllBuildings(buildings).catch((error) =>
  console.error("Error processing buildings: ", error)
);
