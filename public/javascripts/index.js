window.onload = function() {
    fetch('/steam/commonFriends?id1=76561197989862681&id2=76561197962845430')
        .then(response => response.json())
        .then(data => {
            var cy = initCytoscape()
            makeGraph(cy, data)
        });
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
                    'background-color':'#61bffc',
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

function makeGraph(cy, data) {
    console.log(data)
    const info = data.data
    cy.add({
        group: 'nodes',
        data: {
            id: info.id1Summary.nickname,
            name: info.id1Summary.nickname
        },
    });
    cy.add({
        group: 'nodes',
        data: {
            id: info.id2Summary.nickname,
            name: info.id2Summary.nickname
        },
    });
    cy.nodes('[id = "' + info.id1Summary.nickname + '"]').style({
        'background-image': info.id1Summary.avatar.medium
    })
    cy.nodes('[id = "' + info.id2Summary.nickname + '"]').style({
        'background-image': info.id2Summary.avatar.medium
    })
    for (const friend of info.commonFriends) {
        // friend.avatar.medium
        var eles = cy.add([
            // add common friend node
            { group: 'nodes', data: { id: friend.nickname, name: friend.nickname } },
            // from id1 to friend
            { group: 'edges', data: { id: 'e1_' + friend.nickname, source: info.id1Summary.nickname, target: friend.nickname } },
            // from friend to id2
            { group: 'edges', data: { id: 'e2_' + friend.nickname, source: friend.nickname, target: info.id2Summary.nickname } }
        ]);
        cy.nodes('[id = "' + friend.nickname + '"]').style({
            'background-image': friend.avatar.medium
        });
    }
}
