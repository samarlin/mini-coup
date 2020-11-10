let $start = document.getElementById("start_game");
let $id = document.getElementById("player")

let state = {};
joinGame(); // function to post request to server
if(state.admin == true) { // show the start game button if admin
    $start.style.display = "block";
    $start.addEventListener('click', function(event) { 
        fetch('http://localhost:3000/start-game', {method: 'POST'});
    });
} else { $start.style.display = "none"; }
$id.innerHTML = state.name;

const socket = new WebSocket('ws://localhost');

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});

// Listen for messages
socket.addEventListener('close', function (event) {
    console.log('Message from server ', event.data);
});

function joinGame() {
    // sent post request to server, 
    // joining game
    let name = prompt("Enter name:");
    state.name = name;
    let body = {name}
    fetch('http://localhost:3000/join-game', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(body)})
        .then(response => response.json())
        .then(data => {
            state.admin = data.admin;
        });
}