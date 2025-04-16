import { writeFileSync } from 'fs';
import buildingsData from "./src/BuildingJSONs/buildings_04_15_2025.json" assert { type: "json" };

async function checkWebsite(url: string) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    // Check for GoDaddy-style parked domain indicators
    const isParked = html.includes('GoDaddy') || html.toLowerCase().includes('this domain is parked');

    return { url, status: res.status, isParked };
  } catch (error: any) {
    return { url, status: 'error', isParked: false, error: error.message };
  }
}

async function run() {
  // Check each building URL
  const results = await Promise.all(
    buildingsData.map(async (building) => {
      const result = await checkWebsite(building.urlForBuilding);
      
      // Only add valid results where status is 300 or above
      if (Number(result.status) === 404) {
        return {
          buildingID: building.buildingID,
          buildingName: building.buildingName,
          websiteCheck: result
        };
      }
      // Return null if the status is not >= 300 (won't be included in the final results)
      return null;
    })
  );

  // Filter out null or undefined results from the array
  const filteredResults = results.filter(result => result !== null);
  // Save results to a file
  writeFileSync('checkWebsiteResults.json', JSON.stringify(filteredResults, null, 2));
  console.log('Results saved to checkWebsiteResults.json');
}

run();
