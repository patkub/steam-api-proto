var express = require('express');
var router = express.Router();

// steam web api
// https://developer.valvesoftware.com/wiki/Steam_Web_API

// a nodejs wrapper that has part of the data
// https://www.npmjs.com/package/steamapi

const config = require('../config')
const STEAM_API_KEY = config.STEAM_API_KEY

const util = require("util")
// for promises
const Promise = require('bluebird')

// for http requests
const axios = require('axios')
const xml2js = require('xml2js')

// Steam API
const SteamAPI = require("steamapi")
const steam = new SteamAPI(STEAM_API_KEY)

/* GET steam listing. */
router.get('/', function(req, res, next) {
    return res.status(200).json({
        status: "success",
        data: "placeholder",
    })
});

// GET /steam/id
// get the user's steam id 64 string
// Produces: application/json
// Input: QueryParams: id
// i.e. http://localhost:3000/steam/id?id=76561197989862681
// i.e. http://localhost:3000/steam/id?id=steamcommunity.com%2Fid%2Fpatka
// Response json structure:
/*
{
    "status": "success",
    "id": "..."
*/
router.get('/id', function(req, res) {

    // get steam id as query parameters
    const pId = steam.resolve(req.query.id)

    pId.then((id) => {
        // return user steam id
        return res.status(200).json({
            status: "success",
            id: id,
        })
    })
    .catch((reason) => {
        // error getting user's steam id
        return res.status(500).json({
            status: "error",
            message: reason.message,
        })
    })
});

// GET /steam/summary
// Produces: application/json
// Input: QueryParams: id
// i.e. http://localhost:3000/steam/summary?id=76561197989862681
// i.e. http://localhost:3000/steam/summary?id=steamcommunity.com%2Fid%2Fpatka
// Response json structure:
/*
{
    "status": "success",
    "data": {
        "summary": {
            "avatar": {
                "small": "...",
                "medium": "...",
                "large": "..."
            },
            "steamID": "...",
            "url": "...",
            "created": ...,
            "lastLogOff": ...,
            "nickname": "...",
            "realName": "...",
            "primaryGroupID": "...",
            "personaState": ...,
            "personaStateFlags": ...,
            "commentPermission": ...,
            "visibilityState": ...
        }
    }
}
*/
router.get('/summary', function(req, res) {

    const data = {}

    // get steam id as query parameters
    const pId = steam.resolve(req.query.id)

    pId.then((id) => {
        // get user summary
        const pSummary = steam.getUserSummary(id)

        pSummary.then((summary) => {
            //...
            data.summary = summary
            // return summary data
            return res.status(200).json({
                status: "success",
                data: data,
            })
        })
        .catch((reason) => {
            // error getting user summary
            return res.status(500).json({
                status: "error",
                message: reason.message,
            })
        })
    })
    .catch((reason) => {
        // error getting user summary
        return res.status(500).json({
            status: "error",
            message: reason.message,
        })
    })

});

// GET /steam/commonFriends
// Produces: application/json
// Input: QueryParams: id1, id2
// i.e. http://localhost:3000/steam/commonFriends?id1=76561197989862681&id2=76561197962845430
// i.e. http://localhost:3000/steam/commonFriends?id1=steamcommunity.com%2Fid%2Fpatka&id2=76561198034620529
// Response json structure:
/*
{
    "status": "success",
    "data": {
        "commonFriendIds": ["...", "..."],
        "commonFriends": [
            {
                "avatar": {
                    "small": "...",
                    "medium": "...",
                    "large": "..."
                },
                "steamID": "...",
                "url": "...",
                "created": ...,
                "lastLogOff": ...,
                "nickname": "...",
                "realName": "...",
                "primaryGroupID": "...",
                "personaState": ...,
                "personaStateFlags": ...,
                "commentPermission": ...,
                "visibilityState": ...
            },
        ]
    }
}
*/
router.get('/commonFriends', function(req, res) {

    const data = {
        // steam ids of common friends
        commonFriendIds: [],
        // common friend data
        commonFriends: []
    }

    // get steam ids as query parameters
    // resolve input to steam id
    const pId1 = steam.resolve(req.query.id1)
    const pId2 = steam.resolve(req.query.id2)
    const pAll = [
        pId1,
        pId2
    ]
    Promise.all(pAll)
        .then((ids) => {
            // keep track of ids in data
            data.id1 = ids[0]
            data.id2 = ids[1]

            // promises to get friends lists
            const pId1Friends = steam.getUserFriends(data.id1)
            const pId2Friends = steam.getUserFriends(data.id2)

            const pAll = [
                pId1Friends,
                pId2Friends
            ]

            Promise.all(pAll)
                .then((friends) => {
                    const friendList1 = friends[0]
                    const friendList2 = friends[1]

                    // find steam ids of common friends between the two users
                    const commonFriendIds = []
                    for (const f1 of friendList1) {
                        for (const f2 of friendList2) {
                            if (f1.steamID == f2.steamID) {
                                commonFriendIds.push(f1.steamID)
                            }
                        }
                    }
                    data.commonFriendIds = commonFriendIds

                    // promises to get summaries of common friends
                    const pCommonFriendSummaries = []
                    for (const f of commonFriendIds) {
                        const pSummary = steam.getUserSummary(f)
                        pCommonFriendSummaries.push(pSummary)
                    }

                    Promise.all(pCommonFriendSummaries).then((commonFriends) => {
                        // add common friend data to reply
                        data.commonFriends = commonFriends
                        // return common friend data
                        return res.status(200).json({
                            status: "success",
                            data: data,
                        })
                    })
                    .catch((reason) => {
                        // error getting common friend summaries
                        return res.status(500).json({
                            status: "error",
                            message: reason.message,
                        })
                    })
                })
                .catch((reason) => {
                    // error getting friend lists
                    return res.status(500).json({
                        status: "error",
                        message: reason.message,
                    })
                })

        })
        .catch((reason) => {
            // error getting friend lists
            return res.status(500).json({
                status: "error",
                message: reason.message,
            })
        })

});


// GET /steam/commonGroups
// Produces: application/json
// Input: QueryParams: id1, id2
// i.e. http://localhost:3000/steam/commonGroups?id1=76561197989862681&id2=76561197962845430
/*
{
    "status": "success",
    "data": {
        "commonGroupIds": ["...", "..."],
        "commonGroups": [
            {
                "memberList": {
                    "groupID64": ["..."],
                    "groupDetails": [
                        {
                            "groupName": ["..."],
                            "groupURL": ["..."],
                            "headline": [""],
                            "summary": ["..."],
                            "avatarIcon": ["..."],
                            "avatarMedium": ["..."],
                            "avatarFull": ["..."],
                            "memberCount": ["..."],
                            "membersInChat": ["..."],
                            "membersInGame": ["..."],
                            "membersOnline": ["..."]
                        }
                    ],
                    "memberCount": ["..."],
                    "totalPages": ["..."],
                    "currentPage": ["..."],
                    "startingMember": ["..."],
                    "members": [
                        {
                            "steamID64": [
                                "...",
                                "...",
                            ]
                        }
                    ]
                }
            },
        ]
    }
}
*/
router.get('/commonGroups', function(req, res) {

    const data = {
        // group ids of common groups
        commonGroupIds: [],
        // group data
        commonGroups: []
    }

    // get steam ids as query parameters
    const id1 = req.query.id1
    const id2 = req.query.id2

    // promises to get groups
    const pId1Groups = steam.getUserGroups(id1)
    const pId2Groups = steam.getUserGroups(id2)

    const pGroups = [
        pId1Groups,
        pId2Groups
    ]

    Promise.all(pGroups)
        .then((groups) => {
            const groups1 = groups[0]
            const groups2 = groups[1]

            // find group ids of common groups between the two users
            const commonGroupIds = []
            for (const g1 of groups1) {
                for (const g2 of groups2) {
                    if (g1 == g2) {
                        commonGroupIds.push(g1)
                    }
                }
            }
            data.commonGroupIds = commonGroupIds

            // promises to get group summaries
            const pGroupSummaries = []
            for (const group of commonGroupIds) {
                //https://steamcommunity.com/gid/103582791429521412/memberslistxml/?xml=1
                const groupApiUrl = util.format("https://steamcommunity.com/gid/%s/memberslistxml/?xml=1", group)
                const pGroupSummary = axios.get(groupApiUrl)
                pGroupSummaries.push(pGroupSummary)
            }

            Promise.all(pGroupSummaries).then((groupSummaries) => {
                for (const groupSummary of groupSummaries) {
                    // parse group summary as xml
                    xml2js.parseString(groupSummary.data, function (err, result) {
                        if (err === null) {
                            // add group data to reply
                            data.commonGroups.push(result)
                        } else {
                            // error occurred
                            return res.status(404).json({
                                status: "error",
                                message: "Error parsing group summaries",
                            })
                        }
                    });
                }

                // return common group data
                return res.status(200).json({
                    status: "success",
                    data: data,
                })
            })
            .catch((reason) => {
                // error getting common group summaries
                return res.status(500).json({
                    status: "error",
                    message: reason.message,
                })
            })
        })
        .catch((reason) => {
            // error getting groups
            return res.status(500).json({
                status: "error",
                message: reason.message,
            })
        })

});

// POST /steam/games
// Produces: application/json
// Input: Body: array of steam ids [id1, id2]
router.post('/games', function(req, res) {

    // get steam ids as query parameters
    const ids = req.body;
    var promises = [];
    for (var id of ids) {
        promises.push(steam.get(util.format("/IPlayerService/GetOwnedGames/v0001/?steamid=%s&include_appinfo=1&include_played_free_games=1&format=json", id)));
    }

    var gameDictionary = {};
    var privateGames = [];
    Promise.all(promises)
        .then((games) => {
            //console.log(games);
            for (var i = 0; i < games.length; i++) {
                var id = ids[i];
                var response = games[i].response;
                if ("games" in response) {
                    for (var game of response.games) {
                        if (!(game.name in gameDictionary)) {
                            gameDictionary[game.name] = [];
                        }
                        // prevent duplicate ids per game
                        if (!(id in gameDictionary[game.name])) {
                            gameDictionary[game.name].push(id);
                        }
                    }
                } else {
                    privateGames.push(id);
                }
            }

            return res.status(200).json({
                status: "success",
                gameDictionary: gameDictionary,
                privateGames: privateGames,
            })
        })
        .catch((reason) => {
            // error getting games
            return res.status(500).json({
                status: "error",
                message: reason.message,
            })
        })
    
});

module.exports = router;
