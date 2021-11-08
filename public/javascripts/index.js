// patka = 76561197989862681
// patka2 = 76561198034620529
// ehg = 76561197962845430
// altix = 76561198136308086

window.steamFriends = window.steamFriends || new Object()

// self-invoking closure
;(function (steamFriends) {

// fetch abort controllers
let controllers = {
    steamIdLookup: null,
    generateGraph: null
}

// cytoscape.js object
steamFriends.cy = null;
// global progress bar
steamFriends.progressBar = null;
// global error message
steamFriends.errorMsg = null;

window.onload = () => {
    // keep track of progress bar element
    steamFriends.progressBar = document.getElementById("progressBar");
    steamFriends.errorMsg = document.getElementById("errorMsg");

    /**
     * Button to generate graph
     */
    const btnGen = document.getElementById("btnGenerate")
    btnGen.addEventListener("click", generateGraph)

    /**
     * Button to reset node highlighting
     */
    const btnReset = document.getElementById("btnResetHighlight")
    btnReset.addEventListener("click", (e) => {
        // unhighlight all nodes
        resetHighlight(steamFriends.cy)
    })

    /**
     * Button to look up a user's steam id
     */
    const btnLookup = document.getElementById("btnLookup")
    btnLookup.addEventListener("click", (e) => {
        // show progress bar
        steamFriends.progressBar.style.visibility = 'visible';

        const steamIdLookup = document.getElementById("steamIdLookup")
        const steamIdLookupOut = document.getElementById("steamIdLookupOut")

        // asynchronous request to steam api proxy
        // instantiate fetch abort controller
        controllers.steamIdLookup = new AbortController();
        const steamid = steamIdLookup.value;
        const pLookup = fetch('/steam/id?id=' + encodeURIComponent(steamid), {
            method: 'GET',
            signal: controllers.steamIdLookup.signal,
        })
        pLookup
            .then(res => res.json())
            .then(data => {
                // hide progress bar
                steamFriends.progressBar.style.visibility = 'hidden';

                if (data.status == "success") {
                    steamIdLookupOut.value = data.id
                } else if (data.status == "error") {
                    steamIdLookupOut.value = data.message
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                // hide progress bar
                steamFriends.progressBar.style.visibility = 'hidden';
            });
    })

    // generate graph on page load
    generateGraph()
}

/**
 * Generate graph
 */
function generateGraph() {
    // hide error message
    hideErrorMsg();
    // show progress bar
    steamFriends.progressBar.style.visibility = 'visible';

    // get input
    const in1 = document.getElementById("id1").value
    const in2 = document.getElementById("id2").value

    // url encoded input
    const in1Url = encodeURIComponent(in1)
    const in2Url = encodeURIComponent(in2)

    // asynchronous requests to steam api proxy
    // instantiate fetch abort controller
    controllers.generateGraph = new AbortController();
    const pUser1 = fetch('/steam/summary?id=' + in1Url, {
        method: 'GET',
        signal: controllers.generateGraph.signal,
    })
    const pUser2 = fetch('/steam/summary?id=' + in2Url, {
        method: 'GET',
        signal: controllers.generateGraph.signal,
    })
    const pCommonFriends = fetch('/steam/commonFriends?id1=' + in1Url + '&id2=' + in2Url, {
        method: 'GET',
        signal: controllers.generateGraph.signal,
    })

    Promise.all([pUser1, pUser2, pCommonFriends])
        .then(responses =>
            Promise.all(responses.map(res => res.json()))
        ).then(data => {
            //console.log(data)
            if (data[0].status != "success" || data[1].status != "success" || data[2].status != "success") {
                console.log("steam api error!")
                // hide progress bar
                steamFriends.progressBar.style.visibility = 'hidden';
                // show error message
                showErrorMsg('Steam API Error!')
            } else {
                // get all the games that every plays

                var ids = [];
                ids.push(data[2].data.id1);
                ids.push(data[2].data.id2);
                for (var id of data[2].data.commonFriendIds) {
                    ids.push(id);
                }

                steamFriends.cy = initCytoscape()
                makeGraph(steamFriends.cy, data[0].data, data[1].data, data[2].data)

                fetch('/steam/games', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(ids),
                    signal: controllers.generateGraph.signal,
                })
                    .then(response => response.json())
                    .then(data2 => {
                        //console.log('Success:', data2);
                        var select = document.getElementById("game");

                        // reset select dropdown options
                        select.options.length = 0;

                        // filter games
                        let filteredGames = Object.entries(data2.gameDictionary)
                            // games that at least 2 people play
                            .filter(([key, val]) => val.length > 1)
                            // sort alphabetically, case insensitive
                            .sort(function (a, b) {
                                // a[0] = game name
                                // a[1] = array of steam ids, ['...', '...', ...]
                                return a[0].toLowerCase().localeCompare(b[0].toLowerCase())
                            })

                        // add games to dropdown
                        for (const [key, value] of filteredGames) {
                            var option = document.createElement("OPTION")
                            option.text = key;
                            option.value = key;
                            select.appendChild(option);
                        }

                        // on select dropdown change
                        select.addEventListener('change', (event) => {
                            // steam ids of people who play this game
                            var selectIds = data2.gameDictionary[event.target.value]

                            // unhighlight all nodes
                            resetHighlight(steamFriends.cy)

                            // highlight nodes
                            selectIds.forEach(id => {
                                steamFriends.cy.nodes('[id = "' + id + '"]').addClass("highlight");
                            });
                        });

                        // hide progress bar
                        steamFriends.progressBar.style.visibility = 'hidden';
                    })
                    .catch((error) => {
                        // show error message
                        showErrorMsg('Steam API Error!')
                        console.error('Error:', error);
                        // hide progress bar
                        steamFriends.progressBar.style.visibility = 'hidden';
                    });

            } // end of else

        }).catch((error) => {
            // show error message
            showErrorMsg('Steam API Error!')
            console.error('Error:', error);
            // hide progress bar
            steamFriends.progressBar.style.visibility = 'hidden';
        });
}

/**
 * Initialize cytoscape
 * @return {Cytoscape} cytoscape instance
 */
function initCytoscape() {
    var cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node',
                css: {
                    width: 50,
                    height: 50,
                    // node text color
                    color: '#fff',
                    // usernames as node titles
                    content: 'data(name)',
                }
            },
            // cytoscape style classes need to be defined here, not in an external stylesheet
            {
                selector: ".highlight",
                css: {
                    // https://github.com/cytoscape/cytoscape.js/issues/2018
                    // short-hand border property does not work
                    "border-color": "#FF1493", // pink
                    "border-width": "2px",
                    "border-style": "solid",
                    // custom cytoscape styles
                    "text-outline-width": "2px",
                    "text-outline-color": "#FF1493", // pink
                }
            }
        ],
        layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 10,
            fit: true
        }
    });
    return cy
}

/**
 * Make graph
 * @param {Cytoscape} cy cytoscape object
 * @param {Object} user1 data from /steam/summary for id1
 * @param {Object} user2 data from /steam/summary for id2
 * @param {Object} commonFriends data from /steam/commonFriends for id1 and id2
 */
function makeGraph(cy, user1, user2, commonFriends) {
    // get user summaries
    const user1Summary = user1.summary
    const user2Summary = user2.summary

    // add user nodes
    cy.add({
        group: 'nodes',
        data: {
            id: user1Summary.steamID,
            name: user1Summary.nickname
        },
    });
    cy.add({
        group: 'nodes',
        data: {
            id: user2Summary.steamID,
            name: user2Summary.nickname
        },
    });

    // set user background images
    cy.nodes('[id = "' + user1Summary.steamID + '"]').style({
        'background-image': user1Summary.avatar.medium
    })
    cy.nodes('[id = "' + user2Summary.steamID + '"]').style({
        'background-image': user2Summary.avatar.medium
    })

    for (const friend of commonFriends.commonFriends) {
        // add common friend nodes and edges
        cy.add([
            // add common friend node
            { group: 'nodes', data: { id: friend.steamID, name: friend.nickname } },
            // from id1 to friend
            { group: 'edges', data: { id: 'e1_' + friend.steamID, source: user1Summary.steamID, target: friend.steamID } },
            // from friend to id2
            { group: 'edges', data: { id: 'e2_' + friend.steamID, source: friend.steamID, target: user2Summary.steamID } }
        ]);

        // set friend background images
        cy.nodes('[id = "' + friend.steamID + '"]').style({
            'background-image': friend.avatar.medium
        });
    }
}

/**
 * Unhighlight all nodes
 * @param {Cytoscape} cy cytoscape object
 */
function resetHighlight(cy) {
    // unhighlight all nodes
    cy.nodes('*').removeClass("highlight");
}

/**
 * Show an error message alert
 * @param {String} msg message
 */
function showErrorMsg(msg) {
    // show error message
    steamFriends.errorMsg.style.visibility = 'visible';
    steamFriends.errorMsg.textContent = msg;
}

/**
 * Hide error message alert
 */
function hideErrorMsg() {
    steamFriends.errorMsg.style.visibility = 'hidden';
    steamFriends.errorMsg.textContent = '';
}

const socket = io();
socket.on('uncaughtException', (msg) => {
    // nodejs uncaughtException, maybe network error
    console.log('On uncaughtException', msg)
    // default error message
    showErrorMsg("Node.js network error!")
    // abort fetch
    if (controllers.steamIdLookup) {
        controllers.steamIdLookup.abort()
    }
    if (controllers.generateGraph) {
        controllers.generateGraph.abort()
    }
});

})(window.steamFriends) // end self-invoking closure
