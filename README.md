# steam-api-proto
steamapi friends connections prototype

Get your steam web api key here: https://steamcommunity.com/dev/apikey

Replace it in `config.js` here: `config.STEAM_API_KEY = "YOUR_API_KEY_HERE"`

Install dependencies:
```
npm install
```

Steam api example:
```
node test.js
```

Run the expressjs project:
```
npm start
```

sqlite3 data will be returned at this endpoint: http://localhost:3000/data

API Endpoints:
```
// GET /steam/commonFriends
// Produces: application/json
// Input: QueryParams: id1, id2
// i.e. http://localhost:3000/steam/commonFriends?id1=76561197989862681&id2=76561197962845430

// GET /steam/commonGroups
// Produces: application/json
// Input: QueryParams: id1, id2
// i.e. http://localhost:3000/steam/commonGroups?id1=76561197989862681&id2=76561197962845430
```
