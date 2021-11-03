// patka = 76561197989862681
// patka2 = 76561198034620529
// ehg = 76561197962845430
// altix = 76561198136308086

window.cy = null;

window.onload = function() {

    var progressBar = document.getElementById("progressBar");

    var btnGen = document.getElementById("btnGenerate")
    btnGen.addEventListener("click", function(e) {
        // show progress bar
        progressBar.style.visibility = 'visible';

        var in1 = document.getElementById("id1").value
        var in2 = document.getElementById("id2").value

        const pUser1 = fetch('/steam/summary?id=' + in1)
        const pUser2 = fetch('/steam/summary?id=' + in2)
        const pCommonFriends = fetch('/steam/commonFriends?id1=' + in1 + '&id2=' + in2)

        Promise.all([pUser1, pUser2, pCommonFriends])
            .then(responses =>
                Promise.all(responses.map(res => res.json()))
            ).then(data => {
                console.log(data)
                if (data[0].status != "success" || data[1].status != "success" || data[2].status != "success") {
                    console.log("steam api error!")
                    // hide progress bar
                    progressBar.style.visibility = 'hidden';
                } else {
                    // get all the games that every plays

                    var ids = [];
                    ids.push(in1);
                    ids.push(in2);
                    for (var id of data[2].data.commonFriendIds) {
                        ids.push(id);
                    }

                    window.cy = initCytoscape()
                    makeGraph(window.cy, data[0].data, data[1].data, data[2].data)

                    fetch('/steam/games', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(ids),
                    })
                        .then(response => response.json())
                        .then(data2 => {
                            console.log('Success:', data2);
                            var select = document.getElementById("game");

                            // reset select dropdown options
                            select.options.length = 0;

                            // games that at least 2 people play
                            let filteredGames = Object.entries(data2.gameDictionary)
                                .filter(([key, val]) => val.length > 1)

                            // add games to dropdown
                            for (const [key, value] of filteredGames) {
                                //console.log(key, value);
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
                                resetHighlight(window.cy)

                                // highlight nodes
                                selectIds.forEach(id => {
                                    window.cy.nodes('[id = "' + id + '"]').addClass("highlight");
                                });
                            });

                            // hide progress bar
                            progressBar.style.visibility = 'hidden';
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                            // hide progress bar
                            progressBar.style.visibility = 'hidden';
                        });

                } // end of else

            }) // end of promises

    }) // end of generate button

    var btnReset = document.getElementById("btnResetHighlight")
    btnReset.addEventListener("click", function(e) {
        // unhighlight all nodes
        resetHighlight(window.cy)
    })

}


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

function makeGraph(cy, user1, user2, commonFriends) {
    const user1Summary = user1.summary
    const user2Summary = user2.summary
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
    cy.nodes('[id = "' + user1Summary.steamID + '"]').style({
        'background-image': user1Summary.avatar.medium
    })
    cy.nodes('[id = "' + user2Summary.steamID + '"]').style({
        'background-image': user2Summary.avatar.medium
    })
    for (const friend of commonFriends.commonFriends) {
        // friend.avatar.medium
        cy.add([
            // add common friend node
            { group: 'nodes', data: { id: friend.steamID, name: friend.nickname } },
            // from id1 to friend
            { group: 'edges', data: { id: 'e1_' + friend.steamID, source: user1Summary.steamID, target: friend.steamID } },
            // from friend to id2
            { group: 'edges', data: { id: 'e2_' + friend.steamID, source: friend.steamID, target: user2Summary.steamID } }
        ]);
        cy.nodes('[id = "' + friend.steamID + '"]').style({
            'background-image': friend.avatar.medium
        });
    }
}

function resetHighlight(cy) {
    // unhighlight all nodes
    cy.nodes('*').removeClass("highlight");
}

