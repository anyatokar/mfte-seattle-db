1. Update Google Sheets tab if needed (for lat/long, can use Geocode G Sheets extension)
2. Export to JSON (can use Download JSON G Sheets extension)
3. Add the JSON to this repo's BuildingJSONs directory
4. Make sure there are no null buildingIDs - happens if there are blanks in the spreadsheet.
5. Update export filename in import file
6. $ export the secret keys stored in LastPass
7. In Firestore rules, change line 5 to 'allow read, write: if true;' (add write)
8. $ yarn import-data
9. Remove 'write' from Firestore db rules
