import buildings from "./db/buildings_2024_02.json" assert { type: "json" };
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

/*
  https://firebase.google.com/docs/firestore/manage-data/add-data#set_a_document
  If the document does not exist, it will be created.
  If the document does exist, its contents will be overwritten with the newly provided data.

  All data are strings except lat, lng which must be a number for mapping.
*/
buildings.map(async function (obj) {
  const buildingData = {
    buildingID: obj.buildingID,
    dateCode: obj.dateCode,
    IDWithDataCode: obj.IDWithDateCode,
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
    lat: Number(obj.lat),
    lng: Number(obj.lng),
    streetNum: obj.streetNum,
    street: obj.street,
    city: obj.city,
    state: obj.state,
    zip: obj.zip,
    updatedTimestamp: new Date(),
  };

  try {
    await setDoc(doc(db, "buildings", buildingData.buildingID), buildingData);
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
});
