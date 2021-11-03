// steamapi example

// steam web api
// https://developer.valvesoftware.com/wiki/Steam_Web_API

// a nodejs wrapper that has part of the data
// https://www.npmjs.com/package/steamapi

const config = require('../config');
const STEAM_API_KEY = config.STEAM_API_KEY

const Promise = require('bluebird')
const exit = require("process").exit;
const fs = require("fs")
const util = require("util")
// for http requests
const axios = require('axios')
const xml2js = require('xml2js')

// Steam API
const SteamAPI = require("steamapi")
const steam = new SteamAPI(STEAM_API_KEY)


// https://steamcommunity.com/id/patka
// https://steamcommunity.com/id/EHG

const url1 = "https://steamcommunity.com/id/patka"
const url2 = "https://steamcommunity.com/id/EHG"

steamUrlsToId(url1, url2).then((data) => {
  // { id1: '76561197989862681', id2: '76561197962845430' }

  const pId1Summary = steam.getUserSummary(data.id1)
  const pId2Summary = steam.getUserSummary(data.id2)

  const pId1Friends = steam.getUserFriends(data.id1)
  const pId2Friends = steam.getUserFriends(data.id2)

  const pId1Groups = steam.getUserGroups(data.id1)
  const pId2Groups = steam.getUserGroups(data.id2)

  const recentGames1 = steam.getUserRecentGames(data.id1)
  const recentGames2 = steam.getUserRecentGames(data.id2)

  const userOwnedGames1 = steam.get(util.format("/IPlayerService/GetOwnedGames/v0001/?steamid=%s&include_appinfo=1&include_played_free_games=1&format=json", data.id1))

  const userStats = steam.getUserStats(data.id1, "440"); //tf2

  const promises = [
    pId1Summary,
    pId2Summary,
    pId1Friends,
    pId2Friends,
    pId1Groups,
    pId2Groups,
    recentGames1,
    recentGames2,
    userOwnedGames1,
    userStats
  ]

  Promise.all(promises)
    .then((data) => {
      const user1OwnedGames = data[8];
      /*
      Game {
        name: 'Poker Night at the Inventory',
        appID: 31280,
        playTime: 447, // total playtime in minutes
        playTime2: 0,
        logoURL: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/31280/d962cde096bca06ee10d09880e9f3d6257941161.jpg',
        iconURL: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/31280/7d50bd1f5e7cfe68397e9ca0041836ad18153dfb.jpg'
      }
      */
      //console.log(user1OwnedGames);
      //exit(1);
      fs.writeFileSync('user1.json', JSON.stringify(data[0], null, 4));
      fs.writeFileSync('user2.json', JSON.stringify(data[1], null, 4));

      fs.writeFileSync('user-owned-games.json', JSON.stringify(user1OwnedGames, null, 4));

      const userStats = data[9];
      //userStats
      //console.log(userStats);
      fs.writeFileSync('game-data-1.json', JSON.stringify(userStats, null, 4));
      //exit(1);


      const recentGames1 = data[6]
      const recentGames2 = data[7]

      const user1RecentGames = recentGames1.map(g => g.name);
      const user2RecentGames = recentGames2.map(g => g.name);


      console.log("Users:\n")

      // user 1
      console.log(data[0].nickname)
      console.log(data[0].avatar.large)
      console.log("Recent Games: " + user1RecentGames.join(", "))


      // user 2
      console.log("\n" + data[1].nickname)
      console.log(data[1].avatar.large)
      console.log("Recent Games: " + user2RecentGames.join(", "))


      const friendList1 = data[2]
      const friendList2 = data[3]

      const groups1 = data[4]
      const groups2 = data[5]
      
      // RecentGame.appID = game app id, 440 for tf2
      // RecentGame.playTime = hours played in last 2 weeks in seconds
      // RecentGame.playTime2 = hours played in last 2 weeks in minutes

      const commonFriends = []

      for (const f1 of friendList1) {
        for (const f2 of friendList2) {
          if (f1.steamID == f2.steamID) {
            commonFriends.push(f1.steamID)
          }
        }
      }

      // get summaries of common friends
      const commonFriendsSummaries = []
      for (const f of commonFriends) {
        //console.log(util.format("https://steamcommunity.com/profiles/%s", f))
        const pSummary = steam.getUserSummary(f)
        commonFriendsSummaries.push(pSummary)
      }

      const commonGroups = []

      for (const g1 of groups1) {
        for (const g2 of groups2) {
          if (g1 == g2) {
            commonGroups.push(g1)
          }
        }
      }

      Promise.all(commonFriendsSummaries).then((friends) => {
        console.log("\n\nFriends in Common:\n")
        for (const friend of friends) {
          console.log(friend.nickname)
          console.log(friend.avatar.large + "\n")
        }
        console.log("\nGroups in Common:")
        for (const group of commonGroups) {
          //https://api.steampowered.com/ISteamUser/GetUserGroupList/v0001/?key={0}&steamid={1}

          //https://steamcommunity.com/gid/103582791429521412/memberslistxml/?xml=1
          const groupApiUrl = util.format("https://steamcommunity.com/gid/%s/memberslistxml/?xml=1", group)

          axios.get(groupApiUrl)
            .then(function (response) {
              // handle success
              xml2js.parseString(response.data, function (err, result) {
                const groupDetails = result.memberList.groupDetails[0];
                console.log("\nGroup: " + groupDetails.groupName);
                console.log("Headline: " + groupDetails.headline);
                console.log("Summary: " + groupDetails.summary);
                console.log(groupDetails.avatarFull[0]);
                console.log("Group size: " + groupDetails.memberCount[0]);
                // or result.memberList.memberCount[0]
                console.log("In chat: " + groupDetails.membersInChat[0]);
                console.log("In game: " + groupDetails.membersInGame[0]);
                console.log("Online: " + groupDetails.membersOnline[0]);

                // list of groups member steam ids: result.memberList.members[0].steamID64
                //console.log(result.memberList.members[0].steamID64);

              });
            })
            .catch(function (error) {
              // handle error
              console.log(error);
            })
            .then(function () {
              // always executed
            });


          // http://api.steampowered.com/ISteamUser/GetUserGroupList/v0001/?key=KEY_HERE&steamid=76561197989862681
          // https://steamcommunity.com/gid/103582791429521412/memberslistxml/?xml=1
        }
      })
    })
    .catch(() => {
      console.log("steam api down")
    })
})

// convert steam urls to ids
function steamUrlsToId(url1, url2) {
  return new Promise((resolve, reject) => {
    var dataObj = {
      id1: null,
      id2: null,
    }
    const pUrl1 = steamUrlToId(url1)
    const pUrl2 = steamUrlToId(url2)
    Promise.all([pUrl1, pUrl2])
      .then((data) => {
        dataObj.id1 = data[0]
        dataObj.id2 = data[1]
        resolve(dataObj)
      })
      .catch(() => {
        reject("steam api down")
      })
  })
}

function steamUrlToId(url) {
  return new Promise((resolve, reject) => {
    steam.resolve(url).then(
      (id) => {
        // fulfillment
        resolve(id)
      },
      (reason) => {
        // rejection
        reject(reason)
      }
    )
  })
}
