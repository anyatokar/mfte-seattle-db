import fs from "fs";
import puppeteer from "puppeteer";
import buildings from "./BuildingJSONs/oldBuildingLists/buildings_2024_09_27_AMI.json" assert { type: "json" };

// Utility function to introduce delay between requests (optional, can prevent IP blocking)
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main function to scrape website and handle response status or emails
async function scrapeWebsite(url, buildingID, buildingName) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set User-Agent to mimic a regular browser
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: 30000,
    }); // Adjusted timeout for slow-loading pages

    // Check if the page returns a non-200 status
    if (response?.status() !== 200) {
      console.log(`Bad URL: ${url} (Status: ${response?.status()})`);

      // Log bad URLs with status code
      const badUrlData = {
        buildingID,
        buildingName,
        buildingUrl: url,
        status: response?.status(), // Add the response status here
      };

      // Append to badURLs.json
      fs.appendFileSync("badURLs.json", JSON.stringify(badUrlData) + "\n");
    } else {
      // Proceed with scraping the page if accessible
      const email = await page.evaluate(() => {
        const emailAnchor = document.querySelector('a[href^="mailto:"]');
        return emailAnchor ? (emailAnchor as HTMLAnchorElement).href : null; // Return only the first email found
      });

      if (email) {
        console.log("Found email:", email);
        // Write the email to emails.json
        const emailData = {
          buildingID,
          buildingName,
          buildingUrl: url,
          email: email.split("mailto:").join(), // Save only the first email
        };
        fs.appendFileSync("emails.json", JSON.stringify(emailData) + "\n");
      } else {
        console.log(`No emails found for ${url}`);
      }
    }
  } catch (error) {
    console.log(`Error navigating to ${url}:`, error);
  } finally {
    await browser.close();
  }
}

// Check if badURLs.json and emails.json files exist, create them if not
if (!fs.existsSync("badURLs.json")) {
  fs.writeFileSync("badURLs.json", "");
}

if (!fs.existsSync("emails.json")) {
  fs.writeFileSync("emails.json", "");
}

// Loop through buildings data and scrape each website with a delay to avoid IP blocking
(async () => {
  for (const building of buildings) {
    await scrapeWebsite(
      building.urlForBuilding,
      building.buildingID,
      building.buildingName
    );
    await delay(2000); // 2-second delay between requests
  }
})();
