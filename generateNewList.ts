import fs from "fs";
import csv from "csv-parser";
import { writeToPath } from "fast-csv";
import { v4 as uuidv4 } from "uuid";

const generateId = () => uuidv4().replace(/-/g, "").slice(0, 20);
const getDateCode = () => {
  const now = new Date();
  return `_${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(2)}`;
};

const fakeGeocode = async (_address: string) => {
  return { lat: "XXX", lng: "XXX" };
};

interface BuildingData {
  [key: string]: string;
}

const normalizeAddress = (addr: string = "") => addr.trim().toLowerCase();

const readCSV = (filePath: string): Promise<BuildingData[]> => {
  return new Promise((resolve, reject) => {
    const results: BuildingData[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

const mergeData = async () => {
  const current = await readCSV("current.csv");
  const update = await readCSV("update.csv");

  const currentMap = new Map<string, BuildingData>();
  current.forEach((row) => {
    const key = normalizeAddress(row["streetAddress"]);
    if (key) currentMap.set(key, row);
  });

  const dateCode = getDateCode();
  const output: BuildingData[] = [];

  for (const updateRow of update) {
    const addrKey = normalizeAddress(updateRow["streetAddress"]);
    if (!addrKey) continue;

    const existing = currentMap.get(addrKey);
    const outRow: BuildingData = {};

    if (existing) {
      // Keep original dateCode and most fields
      Object.assign(outRow, existing);

      // Overwrite with updates
      outRow["isEnding"] = updateRow["isEnding"] ?? "";
      outRow["isAgeRestricted"] = updateRow["isAgeRestricted"] ?? "";
    } else {
      // New building
      const coords = await fakeGeocode(updateRow["streetAddress"]);

      outRow["buildingID"] = generateId();
      outRow["dateCode"] = dateCode;
      outRow["lat"] = coords.lat;
      outRow["lng"] = coords.lng;

      outRow["buildingName"] = updateRow["buildingName"] ?? "";
      outRow["company"] = "";
      outRow["email"] = "";
      outRow["phone"] = updateRow["phone"] ?? "";
      outRow["phone2"] = updateRow["phone2"] ?? "";
      outRow["neighborhood"] = updateRow["neighborhood"] ?? "";
      outRow["urlForBuilding"] = updateRow["urlForBuilding"] ?? "";
      outRow["streetAddress"] = updateRow["streetAddress"] ?? "";
      outRow["city"] = updateRow["city"] ?? "";
      outRow["state"] = updateRow["state"] ?? "";
      outRow["zip"] = updateRow["zip"] ?? "";
      outRow["isEnding"] = updateRow["isEnding"] ?? "";
      outRow["isAgeRestricted"] = updateRow["isAgeRestricted"] ?? "";

      // Initialize unit fields blank
      const unitFields = [
        "minTotalRestrictedUnits",
        "ami_40_micro",
        "ami_50_micro",
        "ami_65_micro",
        "ami_80_micro",
        "ami_40_studio",
        "ami_50_studio",
        "ami_60_studio",
        "ami_65_studio",
        "ami_70_studio",
        "ami_80_studio",
        "ami_50_oneBed",
        "ami_60_oneBed",
        "ami_70_oneBed",
        "ami_75_oneBed",
        "ami_80_oneBed",
        "ami_50_twoBed",
        "ami_60_twoBed",
        "ami_75_twoBed",
        "ami_80_twoBed",
        "ami_85_twoBed",
        "ami_90_twoBed",
        "ami_80_threePlusBed",
        "ami_85_threePlusBed",
        "ami_90_threePlusBed",
      ];
      for (const field of unitFields) {
        outRow[field] = updateRow[field] ?? "";
      }
    }

    output.push(outRow);
  }

  // ✅ Add remaining current.csv rows not present in update.csv
  for (const [addrKey, currentRow] of currentMap.entries()) {
    const alreadyIncluded = output.some(
      (row) => normalizeAddress(row["streetAddress"]) === addrKey
    );
    if (!alreadyIncluded) {
      output.push(currentRow);
    }
  }

  const baseName = `buildings_${dateCode}`;
  const jsonPath = `${baseName}.json`;
  const csvPath = `${baseName}.csv`;

  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`✅ Wrote ${jsonPath}`);

  writeToPath(csvPath, output, { headers: true })
    .on("finish", () => console.log(`✅ Wrote ${csvPath}`))
    .on("error", (err) => console.error("❌ CSV error:", err));
};

mergeData();
