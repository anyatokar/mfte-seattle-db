1. Update Google Sheets tab if needed
2. Export to JSON
3. $ export each of the secret keys stored in LastPass
4. In Firestore rules, change line 5 to 'allow read, write: if true;' (add write)
5. $ npx ./src/db/import.js