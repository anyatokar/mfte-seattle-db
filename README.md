1. update csv if needed
2. export to JSON (can use https://www.convertcsv.com/csv-to-json.htm TODO automate this)
3. $ export each of the secret keys
4. in Firestore rules, change line 5 to 'allow read, write: if true;' (add write) (TODO improve the rules to not have to do this)
4. $ npx ./src/db/import.js