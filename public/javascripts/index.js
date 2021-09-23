document.addEventListener("DOMContentLoaded", function() {
    fetch('http://localhost:3000/data')
        .then(response => response.json())
        .then(data => {
            console.log(data)
            // data anchor
            const dataDiv = document.getElementById("data")

            // html header
            const header = document.createElement("h2")
            header.appendChild(document.createTextNode("Data"))
            dataDiv.appendChild(header);

            // list
            var ul = document.createElement('ul')

            for (const d of data.data) {
                var li = document.createElement('li')
                var content = document.createTextNode("id: " + d.id + ", name: " + d.name)
                li.appendChild(content)
                ul.appendChild(li)
            }

            dataDiv.appendChild(ul)

        })
});
