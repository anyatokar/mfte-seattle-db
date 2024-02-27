1. Update Google Sheets tab if needed (for lat/long, can use Geocode G Sheets extension)
2. Export to JSON (can use Download JSON G Sheets extension)
3. Add the JSON to this repo's db directory
4. Make sure there are no null buildingIDs - happens if there are blanks in the spreadsheet.
4. Update export filename in import file
5. $ export each of the secret keys stored in LastPass
6. In Firestore rules, change line 5 to 'allow read, write: if true;' (add write)
7. $ npm run node src/import.js
8. Remove 'write' from Firestore db rules