import fs from "fs";
import csv from "csv-parser";
import { writeToPath } from "fast-csv";

interface BuildingData {
  [key: string]: string;
}

const ignoredFields = ["#1", "#2", "minTotalRestrictedUnits", "isEnding"];

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

// Normalize building name (for better equality checks)
const normalizeBuildingName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(apts|apartments)\b/g, "")
    .replace(/,?\s*the\s*$/g, "")
    .trim();
};

// Normalize URLs for comparison
const normalizeUrl = (url: string): string => {
  try {
    const normalized = new URL(url);
    return (
      normalized.hostname.replace(/^www\./, "") +
      normalized.pathname.replace(/\/$/, "")
    );
  } catch {
    return url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "");
  }
};

const compareCSVs = async () => {
  const marchData = await readCSV("update.csv");
  const currentData = await readCSV("current.csv");

  const currentMap = new Map<string, BuildingData>();
  const marchMap = new Map<string, BuildingData>();

  currentData.forEach((row) => {
    const addr = row["streetAddress"]?.trim().toLowerCase();
    if (addr) currentMap.set(addr, row);
  });

  marchData.forEach((row) => {
    const addr = row["streetAddress"]?.trim().toLowerCase();
    if (addr) marchMap.set(addr, row);
  });

  const differences: any[] = [];
  const removedBuildings: BuildingData[] = [];

  // Find new and changed buildings
  marchData.forEach((marchRow) => {
    const addr = marchRow["streetAddress"]?.trim().toLowerCase();
    if (!addr) return;

    const currentRow = currentMap.get(addr);

    if (!currentRow) {
      differences.push({
        changeType: "new",
        streetAddress: marchRow["streetAddress"],
        fieldName: "",
        oldValue: "",
        newValue: "",
      });
    } else {
      Object.keys(marchRow).forEach((key) => {
        if (ignoredFields.includes(key)) return;

        const oldVal = currentRow[key]?.trim() || "";
        const newVal = marchRow[key]?.trim() || "";

        let normalizedOldVal = oldVal;
        let normalizedNewVal = newVal;

        if (key === "buildingName") {
          normalizedOldVal = normalizeBuildingName(oldVal);
          normalizedNewVal = normalizeBuildingName(newVal);
        }

        if (key === "urlForBuilding") {
          normalizedOldVal = normalizeUrl(oldVal);
          normalizedNewVal = normalizeUrl(newVal);
        }

        if (normalizedOldVal !== normalizedNewVal) {
          differences.push({
            changeType: "changed",
            streetAddress: marchRow["urlForBuilding"],
            fieldName: key,
            oldValue: oldVal,
            newValue: newVal,
          });
        }
      });
    }
  });

  // Removed buildings
  currentData.forEach((currentRow) => {
    const addr = currentRow["streetAddress"]?.trim().toLowerCase();
    if (!addr) return;

    const isStillPresent = marchMap.has(addr);
    if (!isStillPresent) {
      removedBuildings.push({
        buildingName: currentRow["buildingName"],
        streetAddress: currentRow["streetAddress"],
        neighborhood: currentRow["neighborhood"],
        phone: currentRow["phone"],
      });
    }
  });

  // Write results
  writeToPath("differences.csv", differences, { headers: true })
    .on("finish", () => console.log("✅ differences.csv saved."))
    .on("error", (err) =>
      console.error("❌ Error writing differences.csv:", err)
    );

  writeToPath("removed_buildings.csv", removedBuildings, { headers: true })
    .on("finish", () => console.log("✅ removed_buildings.csv saved."))
    .on("error", (err) =>
      console.error("❌ Error writing removed_buildings.csv:", err)
    );
};

compareCSVs();
