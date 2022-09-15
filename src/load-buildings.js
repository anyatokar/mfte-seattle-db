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
// 6. For any added buildings, apply corrections from the building corrections list and geocode their addresses.
// 7. Produce the final updated JSON data.
const LATEST_DATA = '2022-01-31';
const CURRENT_WORKBOOK = `./workbooks/MFTEParticipantContact-${LATEST_DATA}.xlsx`;
const CURRENT_DB_PATH = `./src/buildings-${LATEST_DATA}.json`;

const PREVIOUS_DATA = '2021-04';
const PREVIOUS_DB_PATH = `./src/buildings-${PREVIOUS_DATA}.json`;

const corrections = JSON.parse(fs.readFileSync('./src/buildings-corrections.json'));

// These rows and columns are based on the 2022-01-31 sheet's columns.
const FIRST_DATA_ROW = 5;
const SHEET_NAMES_TO_DB_NAMES = {
  ['buffer']: 'INVALID',
  ['Building Name']: 'buildingName',
  ['Address']: 'street',
  ['Phone']: 'phone',
  ['Residential Targeted Area']: 'residentialTargetedArea',
  ['Expiration']: 'expiration',
  ['Total Restricted Units']: 'totalRestrictedUnits',
  ['SEDU & Congregate 40% AMI']: 'sedu.40ami',
  ['SEDU & Congregate 50% AMI']: 'sedu.50ami',
  ['SEDU & Congregate 65% AMI']: 'sedu.65ami',
  ['Studio 40% AMI']: 'studioUnits.40ami',
  ['Studio 50% AMI']: 'studioUnits.50ami',
  ['Studio 60% AMI']: 'studioUnits.60ami',
  ['Studio 65% AMI']: 'studioUnits.65ami',
  ['Studio 70% AMI']: 'studioUnits.70ami',
  ['Studio 80% AMI']: 'studioUnits.80ami',
  ['1 Bedroom 50% AMI']: 'oneBedroomUnits.50ami',
  ['1 Bedroom 60% AMI']: 'oneBedroomUnits.60ami',
  ['1 Bedroom 70% AMI']: 'oneBedroomUnits.70ami',
  ['1 Bedroom 75% AMI']: 'oneBedroomUnits.75ami',
  ['1 Bedroom 80% AMI']: 'oneBedroomUnits.80ami',
  ['2 Bedroom 50% AMI']: 'twoBedroomUnits.50ami',
  ['2 Bedroom 60% AMI']: 'twoBedroomUnits.60ami',
  ['2 Bedroom 70% AMI']: 'twoBedroomUnits.70ami',
  ['2 Bedroom 80% AMI']: 'twoBedroomUnits.80ami',
  ['2 Bedroom 85% AMI']: 'twoBedroomUnits.85ami',
  ['2 Bedroom 90% AMI']: 'twoBedroomUnits.90ami',
  ['3 Bedroom+ 80% AMI']: 'threePlusBedroomUnits.80ami',
  ['3 Bedroom+ 85% AMI']: 'threePlusBedroomUnits.85ami',
  ['3 Bedroom+ 90% AMI']: 'threePlusBedroomUnits.90ami',
  ['Additional Information']: 'additionalInformation'
};

// 1. Load the previous database
let db = {};

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
//     - [ ] Parse street into streetNum and street
//     - [ ] Combine all AMIs into their same category
//     - [ ] Extract buliding URL from the sheet
const rawMfteData = xlsx.utils.sheet_to_json(sheetRaw, { header: Object.keys(SHEET_NAMES_TO_DB_NAMES) }).slice(FIRST_DATA_ROW);
const dbFormatMfteData = rawMfteData.map(building => {
  // Convert all the key names from the sheet column names to the DB names.
  building = Object.fromEntries(
    Object.entries(building).map(
      ([oldKey, value]) => [SHEET_NAMES_TO_DB_NAMES[oldKey], value]
    )
  );

  // Split the street into streetNum and street.
  const [_, streetNum, street] = building.street.match(/(\d+) (.*)/);
  if (!streetNum || !street) {
    throw new Error(`Incorrectly parsed ${building.street}. (streetNum: ${streetNum}, street: ${street})`);
  }
  building.street = street;
  building.streetNum = streetNum;

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
dbFormatMfteData.map((building, idx) => {
  const cell = `B${idx + FIRST_DATA_ROW + 4}`;
  building.urlForBuilding = sheetRaw[cell]?.l?.Target || '';
});

// Now dbFormatMfteData has all the data provided from the sheet, but no geocode information or corrections.

// 5. Load the previous database. Diff the sets of buildings to find whether any have been added or removed.






// import NodeGeocoder from 'node-geocoder';



// /* load 'stream' for stream support */
// import { Readable } from 'stream';
// xlsx.stream.set_readable(Readable);

async function loadFromWeb() {
  const mfteUrl = 'http://www.seattle.gov/documents/Departments/Housing/HousingDevelopers/MultifamilyTaxExemption/MFTEParticipantContact.xlsx';

  const mfteFileResponse = await fetch(mfteUrl);
  const data = await mfteFileResponse.arrayBuffer();
  /* data is an ArrayBuffer */
  return xlsx.read(data);
}

async function fetchWithReferer(resource, options) {
  try {
    return await fetch(resource, {
      ...options,
      headers: {
        ...options.headers,
        Referer: 'https://mfte-seattle.com',
        ['User-Agent']: 'mfte-seattle-db/0.1.0'
      }
    });
  } catch(err) {
    console.log('Fetch error:', err);
  }
}

// TODO: We are required to provide attribution to OpenStreetMap for use of geocoded data
// See: https://wiki.osmfoundation.org/wiki/Licence/Attribution_Guidelines#Attribution_text
// const geoCoder = NodeGeocoder({
//   provider: 'openstreetmap',
//   fetch: fetchWithReferer,
//   language: 'en'
// });

// geoCoder.geocode({ street: '301 12th Ave', city: 'Seattle', format: 'jsonv2', }, result => console.log(result));

// Limit query to one geocode per 2 seconds.
const fetchOptions = {
  headers: {
    Referer: 'https://mfte-seattle.com',
    ['User-Agent']: 'mfte-seattle-db/0.1.0'
  }
}
const address = '550 Broadway';
// const res = await fetch(
//   `https://nominatim.openstreetmap.org/search?street=${address}&city=Seattle&format=jsonv2`,
//   fetchOptions
// );
// console.log(await res.json());



// async function loadFromLocalFile() {
//   const localFilePath = 'workbooks/MFTEParticipantContact-2022-01-31.xlsx';
//   const workbook = await xlsx.readFile(localFilePath, {});
//   return workbook;
// }

// const workbook = await loadFromLocalFile(); // await loadFromWeb();

// const COLUMNS = [
//   'buffer',
//   'Building Name',
//   'Address',
//   'Phone',
//   'Residential Targeted Area',
//   'Expiration',
//   'Total Restricted Units',
//   'SEDU & Congregate 40% AMI',
//   'SEDU & Congregate 50% AMI',
//   'SEDU & Congregate 65% AMI',
//   'Studio 40% AMI',
//   'Studio 50% AMI',
//   'Studio 60% AMI',
//   'Studio 65% AMI',
//   'Studio 70% AMI',
//   'Studio 80% AMI',
//   '1 Bedroom 50% AMI',
//   '1 Bedroom 60% AMI',
//   '1 Bedroom 70% AMI',
//   '1 Bedroom 75% AMI',
//   '1 Bedroom 80% AMI',
//   '2 Bedroom 50% AMI',
//   '2 Bedroom 60% AMI',
//   '2 Bedroom 70% AMI',
//   '2 Bedroom 80% AMI',
//   '2 Bedroom 85% AMI',
//   '2 Bedroom 90% AMI',
//   '3 Bedroom+ 80% AMI',
//   '3 Bedroom+ 85% AMI',
//   '3 Bedroom+ 90% AMI',
//   'Additional Information'
// ];

// const sheetRaw = workbook.Sheets[workbook.SheetNames[0]];
// const rawJson = xlsx.utils.sheet_to_json(sheetRaw, { header: COLUMNS }).slice(FIRST_DATA_ROW);
// console.log(rawJson);
