import { timestampPT } from './generalUtils';

const buildings = require('./buildings_10_2023.json');
const firebase = require('firebase');
require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_APIKEY,
  authDomain: process.env.REACT_APP_AUTHDOMAIN,
  databaseURL: process.env.REACT_APP_DB,
  projectId: process.env.REACT_APP_PID,
  storageBucket: process.env.REACT_APP_SB,
  messagingSenderId: process.env.REACT_APP_SID,
  appId: process.env.REACT_APP_APPID,
  measurementId: process.env.REACT_APP_MID
};

// I AM CONFUSED ABOUT HOW THIS WORKS WITH NOTHING IN THE .ENV, does Exported overwrite?

firebase.initializeApp(firebaseConfig);
let countWritten = 0;
let countUpdated = 0;
const db = firebase.firestore();

/*
  https://firebase.google.com/docs/firestore/manage-data/add-data#set_a_document
  If the document does not exist, it will be created.
  If the document does exist, its contents will be overwritten with the newly provided data.

  All data are strings except lat, lng which must be a number for mapping.
*/
buildings.forEach(function(obj) {
  const buildingData = {
    buildingID: obj.buildingID,
    IDEnd: obj.IDEnd,
    IDWithEnd: obj.IDWithEnd,
    buildingName: obj.buildingName,
    phone: obj.phone,
    phone2: obj.phone2,
    residentialTargetedArea: obj.residentialTargetedArea,
    totalRestrictedUnits: obj.totalRestrictedUnits,
    sedu: (obj.sedu === "0") ? 0 : obj.sedu,
    studioUnits: (obj.studioUnits === "0") ? 0 : obj.studioUnits,
    oneBedroomUnits: (obj.oneBedroomUnits === "0") ? 0 : obj.oneBedroomUnits,
    twoBedroomUnits: (obj.twoBedroomUnits === "0") ? 0 : obj.twoBedroomUnits,
    threePlusBedroomUnits: (obj.threePlusBedroomUnits === "0") ? 0 : obj.threePlusBedroomUnits,
    urlForBuilding: obj.urlForBuilding,
    lat: Number(obj.lat),
    lng: Number(obj.lng),
    streetNum: obj.streetNum,
    street: obj.street,
    city: obj.city,
    state: obj.state,
    zip: obj.zip,
    updatedTimestamp: timestampPT
  }

  db.collection("buildings")
  .doc(buildingData.buildingID)
  .set(buildingData)
  .then(function(docRef) {
  //   console.log("Document written with ID: ", docRef.id);
    countWritten += 1;
    console.log("Count written: ", countWritten);
    console.log("Building ID: ", buildingData.buildingID);
    console.log("ID With End: ", buildingData.IDWithEnd);

    // const currentBuilding = db.collection("buildings_ANYA_TEST").doc(docRef.id);

    // return currentBuilding.update({
    //   docRefID: docRef.id
    })
    // .then(() => {
    //   console.log("Document successfully updated with id: ", docRef.id);
    //   countUpdated += 1;
    //   console.log("Count updated: ", countUpdated);
    // })
    // .catch((error) => {
    //   console.error("Error updating document: ", error);
    // });
  // })
  .catch(function(error) {
    console.error("Error adding document: ", error);
  });
});