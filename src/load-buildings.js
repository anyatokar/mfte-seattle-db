import * as xlsx from 'xlsx/xlsx.mjs';
import * as fs from 'node:fs';
xlsx.set_fs(fs);

// Current is the destination for this run. Previous is the existing data.
// The loading process is...
// 1. Load the previous database
// 2. Save the MFTE spreadsheet from the web into workbooks
// 3. Parse the spreadsheet and check if the date is different from latest
// 4. If the date is not different, stop; if the date is different, read the data as JSON
// 5. Load the previous database. Diff the sets of buildings to find whether any have been added or removed.
// 6. Apply corrections.
// 7. For any added buildings or corrected addresses, geocode the address.
// 8. Produce the final updated JSON data.
const LATEST_DATA = '2022-01-31';
const CURRENT_WORKBOOK = `./workbooks/MFTEParticipantContact-${LATEST_DATA}.xlsx`;
const CURRENT_DB_PATH = `./db/buildings-${LATEST_DATA}.json`;

const PREVIOUS_DATA = '2022-01-31';
const PREVIOUS_DB_PATH = `./db/buildings-${PREVIOUS_DATA}.json`;

const corrections = JSON.parse(fs.readFileSync('./src/buildings-corrections.json'));

// These rows and columns are based on the 2022-01-31 sheet's columns.
const FIRST_DATA_ROW = 5;
const COLUMNS = [
  'isNew',
  'buildingName',
  'street',
  'phone',
  'residentialTargetedArea',
  'expiration',
  'totalRestrictedUnits',
  'sedu.40ami',
  'sedu.50ami',
  'sedu.65ami',
  'studioUnits.40ami',
  'studioUnits.50ami',
  'studioUnits.60ami',
  'studioUnits.65ami',
  'studioUnits.70ami',
  'studioUnits.80ami',
  'oneBedroomUnits.50ami',
  'oneBedroomUnits.60ami',
  'oneBedroomUnits.70ami',
  'oneBedroomUnits.75ami',
  'oneBedroomUnits.80ami',
  'twoBedroomUnits.50ami',
  'twoBedroomUnits.60ami',
  'twoBedroomUnits.70ami',
  'twoBedroomUnits.80ami',
  'twoBedroomUnits.85ami',
  'twoBedroomUnits.90ami',
  'threePlusBedroomUnits.80ami',
  'threePlusBedroomUnits.85ami',
  'threePlusBedroomUnits.90ami',
  'additionalInformation'
];

// 1. Load the previous database
let db = [];

try {
  const existingDb = JSON.parse(fs.readFileSync(PREVIOUS_DB_PATH));
  db = existingDb;
} catch(err) {
  console.log(`Couldn't load previous DB from ${PREVIOUS_DB_PATH}.`);
}

// 2. Save the MFTE spreadsheet from web into workbooks

// 3. Parse the spreadsheet and check if the date is different from latest
const workbook = await xlsx.readFile(CURRENT_WORKBOOK, {});
const sheetRaw = workbook.Sheets[workbook.SheetNames[0]];

// 4a. If the date is not different, stop

// 4b. if the date is different, read the data as JSON
//     - Parse street into streetNum and street
//     - Combine all AMIs into their same category
//     - Extract buliding URL from the sheet
const rawMfteData = xlsx.utils.sheet_to_json(sheetRaw, { header: COLUMNS }).slice(FIRST_DATA_ROW);
const dbFormatMfteData = rawMfteData.map(building => {

  // Drop the '*' from the "is new" column
  delete building.isNew

  // Split the street into streetNum and street.
  const [_, streetNum, street] = building.street.match(/(\d+) (.*)/);
  if (!streetNum || !street) {
    throw new Error(`Incorrectly parsed ${building.street}. (streetNum: ${streetNum}, street: ${street})`);
  }
  building.street = street;
  building.streetNum = streetNum;

  // Correct phone numbers that are numbers
  if (typeof building.phone === 'number') {
    const phoneNum = building.phone.toString();
    const formatted = `${phoneNum.slice(0,3)}-${phoneNum.slice(3,6)}-${phoneNum.slice(6,10)}`;
    building.phone = formatted;
  }

  // Split off second phone #s
  const phones = building.phone?.split('; ') || [];
  building.phone = phones[0] || '';
  building.phone2 = phones[1] || '';

  // Duplicated names rules...
  // Common Anderson: add the street number to the name
  if (building.buildingName === 'Common Anderson') {
    building.buildingName = `${building.buildingName} - ${building.streetNum}`;
  }

  // Combine AMIs together
  const amis = {
    sedu: [40, 50, 60],
    studioUnits: [40, 50, 60, 65, 70, 80],
    oneBedroomUnits: [50, 60, 70, 75, 80],
    twoBedroomUnits: [50, 60, 70, 80, 85, 90],
    threePlusBedroomUnits: [80, 85, 90]
  };

  Object.entries(amis).forEach(([amiKey, amiList]) => {
    building[amiKey] = 0;
    for (let amiVal of amiList) {
      const keyOfThisAmiVal = `${amiKey}.${amiVal}ami`; // e.g. 'twoBedroomUnits.50ami'
      building[amiKey] += (building[keyOfThisAmiVal] || 0);
    }
  });

  return building;
});

// Extract building URL from the sheet
dbFormatMfteData.forEach((building, idx) => {
  const cell = `B${idx + FIRST_DATA_ROW + 4}`;
  building.urlForBuilding = sheetRaw[cell]?.l?.Target || '';
});

// Now dbFormatMfteData has all the data provided from the sheet, but no geocode information or corrections.

// 5. Load the previous database. Diff the sets of buildings to find whether any have been added or removed.
// Use the building names as the unique keys to difference. That should be good enough, but throw an error to notify us if there's a duplicate.
const buildingNameSet = dataset => {
  const set = new Set();
  for (let { buildingName } of dataset) {
    if (set.has(buildingName)) {
      throw new Error(`Duplicate building name: ${buildingName}. Add a rule to disambiguate and try again.`);
    }
    set.add(buildingName);
  }
  return set;
}

const existingDbBuildings = buildingNameSet(db);
const latestDbBuildings = buildingNameSet(dbFormatMfteData);
const addedBuildings = difference(latestDbBuildings, existingDbBuildings);
const removedBuildings = difference(existingDbBuildings, latestDbBuildings);

console.log('Buildings added:', addedBuildings);
console.log('Buildings removed:', removedBuildings);

// From MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
function difference(setA, setB) {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

const geocodeNeeded = new Set(addedBuildings);

// 6. Apply corrections.
const correctedDbFormatMfteData = dbFormatMfteData.map(building => {
  const correctionsForBuilding = corrections.filter(c => c.buildingName === building.buildingName);
  for (let c of correctionsForBuilding) {
    if ("street" in c.correction && c.correction.street !== building.street ||
        "streetNum" in c.correction && c.correction.streetNum !== building.streetNum )
    {
      geocodeNeeded.add(building.buildingName); // Corrections that include street or street number require geocoding.
    }
    building = { ...building, ...c.correction };
  }
  return building;
});


// 7. For any added buildings or corrected addresses, geocode the address.
async function wait(timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout));
}

async function geoCodeAddress(streetNum, street) {
  const fetchOptions = {
    headers: {
      Referer: 'https://mfte-seattle.com',
      ['User-Agent']: 'mfte-seattle-db/0.1.0'
    }
  }
  const address = `${streetNum} ${street}`;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?street=${address}&city=Seattle&format=jsonv2`,
    fetchOptions
  );

  const geocodeResults = await res.json();

  console.log(`Results for ${address} in Seattle:`);
  for (const r of geocodeResults) {
    console.log(`${r.category}, ${r.type} (${r.lat}, ${r.lon}): ${r.display_name}`);
  }
  console.log();

  if (geocodeResults.length === 0) {
    throw new Error(`No geocode results for ${address}`);
  } else if (geocodeResults.length === 1) {
    return geocodeResults[0];
  } else {
    const buildingTypeResult = geocodeResults.find(res => res.category === 'building');
    if (buildingTypeResult) {
      return buildingTypeResult;
    }

    const placeTypeResult = geocodeResults.find(res => res.category === 'place');
    if (placeTypeResult) {
      return placeTypeResult;
    }
  }

  return geocodeResults[0];
}

async function geocodeAddresses() {
  const result = [];

  for (const building of correctedDbFormatMfteData) {
    if (geocodeNeeded.has(building.buildingName)) {
      try {
        const geocodeResult = await geoCodeAddress(building.streetNum, building.street);
        const displayParts = geocodeResult['display_name'].split(', ').reverse();
        const zip = displayParts[1];
        const state = 'WA';
        const city = displayParts[4];
        if (displayParts[2] !== 'Washington' && displayParts[2] !== 'WA') {
          throw new Error(`${building.buildingName} geocoded to ${displayParts[2]}`);
        }

        const updatedBuilding = {
          ...building,
          lat: geocodeResult.lat,
          lng: geocodeResult.lon,
          city,
          state,
          zip,
          geocodeLicense: geocodeResult.licence
        };
        result.push(updatedBuilding);

        await wait(2000);
      } catch(err) {
        console.warn(err);
        result.push(building);
      }
    } else {
      // Use the geocoded data from the existing database.
      const existingBuilding = db.find(({ buildingName }) => buildingName === building.buildingName);
      result.push({
        ...building,
        lat: existingBuilding.lat,
        lng: existingBuilding.lng,
        city: existingBuilding.city,
        state: existingBuilding.state,
        zip: existingBuilding.zip.toString(), // Make sure zip codes aren't numbers.
        geocodeLicense: existingBuilding.geocodeLicense
      });
    }
  }

  return result;
}

const completedNewDb = await geocodeAddresses();

// 8. Produce the final updated JSON data.

// Integrity checks...
// Verify zip codes are all Seattle zip codes:
const seattleZips = [
  '98101', '98102', '98103', '98104', '98105', '98106', '98107', '98108', '98109', '98110',
  '98111', '98112', '98114', '98115', '98116', '98117', '98118', '98119', '98121', '98122',
  '98124', '98125', '98126', '98129', '98131', '98132', '98133', '98134', '98136', '98138',
  '98144', '98145', '98146', '98148', '98151', '98154', '98155', '98158', '98160', '98161',
  '98164', '98166', '98168', '98170', '98171', '98174', '98177', '98178', '98181', '98184',
  '98185', '98188', '98190', '98191', '98195', '98198', '98199'
];

completedNewDb.forEach(building => {
  if (!seattleZips.includes(building.zip)) {
    console.log(`${building.buildingName} zip code (${building.zip}) is not a Seattle zip code`);
  }
})

// Final output
fs.writeFileSync(CURRENT_DB_PATH, JSON.stringify(completedNewDb, null, 2));

// TODO: We are required to provide attribution to OpenStreetMap for use of geocoded data
// See: https://wiki.osmfoundation.org/wiki/Licence/Attribution_Guidelines#Attribution_text

