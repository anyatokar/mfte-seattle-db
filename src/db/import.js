const buildings = require('./buildings.json');
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

firebase.initializeApp(firebaseConfig);
let countWritten = 0;
let countUpdated = 0;
const db = firebase.firestore();

buildings.forEach(function(obj) {
  db.collection("buildings")
  .add({
    buildingName: obj.buildingName,
    phone: obj.phone,
    phone2: obj.phone2,
    residentialTargetedArea: obj.residentialTargetedArea,
    totalRestrictedUnits: obj.totalRestrictedUnits,
    sedu: obj.sedu,
    studioUnits: obj.studioUnits,
    oneBedroomUnits: obj.oneBedroomUnits,
    twoBedroomUnits: obj.twoBedroomUnits,
    threePlusBedroomUnits: obj.threePlusBedroomUnits,
    urlForBuilding: obj.urlForBuilding,
    lat: obj.lat,
    lng: obj.lng,
    streetNum: obj.streetNum,
    street: obj.street,
    city: obj.city,
    state: obj.state,
    zip: obj.zip
  }).then(function(docRef) {
    console.log("Document written with ID: ", docRef.id);
    countWritten += 1;
    console.log("Count written: ", countWritten);

    const currentBuilding = db.collection("buildings").doc(docRef.id);

    return currentBuilding.update({
      buildingID: docRef.id
    })
    .then(() => {
      console.log("Document successfully updated with id: ", docRef.id);
      countUpdated += 1;
      console.log("Count updated: ", countUpdated);
    })
    .catch((error) => {
      console.error("Error updating document: ", error);
    });
  })
  .catch(function(error) {
    console.error("Error adding document: ", error);
  });
});