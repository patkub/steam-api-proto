window.onload = function() {

    var btn = document.getElementById("btnGenerate")
    btn.addEventListener("click", function(e) {
        //console.log("generate button clicked")
        var in1 = document.getElementById("id1").value
        var in2 = document.getElementById("id2").value
        //console.log(in1)
        //console.log(in2)

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
                } else {
                    const cy = initCytoscape()
                    makeGraph(cy, data[0].data, data[1].data, data[2].data)
                }
                
            })
    })

    // patka = 76561197989862681
    // ehg = 76561197962845430
    // altix = 76561198136308086
    // const pUser1 = fetch('/steam/summary?id=76561197989862681')
    //const pUser2 = fetch('/steam/summary?id=76561197962845430')
    //const pCommonFriends = fetch('/steam/commonFriends?id1=76561197989862681&id2=76561197962845430')    
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
                    content: 'data(id)'
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
            id: user1Summary.nickname,
            name: user1Summary.nickname
        },
    });
    cy.add({
        group: 'nodes',
        data: {
            id: user2Summary.nickname,
            name: user2Summary.nickname
        },
    });
    cy.nodes('[id = "' + user1Summary.nickname + '"]').style({
        'background-image': user1Summary.avatar.medium
    })
    cy.nodes('[id = "' + user2Summary.nickname + '"]').style({
        'background-image': user2Summary.avatar.medium
    })
    for (const friend of commonFriends.commonFriends) {
        // friend.avatar.medium
        var eles = cy.add([
            // add common friend node
            { group: 'nodes', data: { id: friend.nickname, name: friend.nickname } },
            // from id1 to friend
            { group: 'edges', data: { id: 'e1_' + friend.nickname, source: user1Summary.nickname, target: friend.nickname } },
            // from friend to id2
            { group: 'edges', data: { id: 'e2_' + friend.nickname, source: friend.nickname, target: user2Summary.nickname } }
        ]);
        cy.nodes('[id = "' + friend.nickname + '"]').style({
            'background-image': friend.avatar.medium
        });
    }
}
