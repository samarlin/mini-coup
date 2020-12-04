let $start = document.getElementById("start_game");
let $id = document.getElementById("player");
let $card1 = document.getElementById('card1');
let $card2 = document.getElementById('card2');

let state = {};
let socket;
joinGame().then(() => {
  console.log(state);
  if (state.admin == true) {
    // show the start game button if admin
    $start.style.display = "block";
    $start.addEventListener("click", function (event) {
      fetch("http://localhost:3000/start-game", { method: "POST" });
    });
  } else {
    $start.style.display = "none";
  }
  $id.innerHTML = state.name;
  socket = new WebSocket("ws://localhost:9000");

  socket.onopen = () => {
    let msg = {type: "ASSOCIATE", id: state.name};
    socket.send(JSON.stringify(msg));
  };
  
  // Listen for messages
  socket.onmessage = function (event) {
    let message = JSON.parse(event.data);
    
    switch(message.type) {
      case 'DEAL_CARDS': // initial dealing of cards
        state.cards = message.cards;
        $card1.innerHTML = state.cards[0];
        $card2.innerHTML = state.cards[1];
        break;
      case 'TAKE_PRIMARY_ACTION':
        // TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
        // ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS 
        take_primary_action();
        break;
      case 'INVALID_MOVE':
        // game found primary action to be invalid, player must chose another one
        alert('Invalid move chosen, try again. Reason: ' + message.error);
        take_primary_action();
        break;
      case 'TAKE_SECONDARY_ACTION':
        // CALL_BLUFF, BLOCK_AID, BLOCK_STEAL, BLOCK_ASSASSINATE
        // if a player's primary action is blocked, they have the option to CALL_BLUFF
        take_secondary_action(message.primary, message.actions); 
        break;
      case 'REVEAL_CARD': 
        // player's bluff has been called, player must select a card to reveal
        // revealed card will either be lost or replaced, depending on
        //    whether the revealed card matches the attempted action
        break;
      case 'RECEIVE_MONEY':
        // response from TAKE_FOREIGN_AID, TAKE_INCOME, STEAL_FROM_PLAYER
        state.coins = message.coins;
        break;
      case 'RECEIVE_CARDS':
        // response from DRAW_CARDS; player receives two cards and needs to pick
        // a number of cards equal to their current total to keep from the set of cards
        // received and already had cards
        break;
      case 'LOSE_CARD': 
        // player has been couped, and must select a card to lose
        // OR player has called bluff incorrectly, and must select a card to lose
        break;
      case 'CHOOSE_PLAYER':
        // player must choose a target to coup as a result of having
        // 10 or more coins at the start of their turn
        break;
      case 'GAME_OVER':
        // the game is over, update interface accordingly
        break;
    }
  
  };

  socket.onclose = function (event) {
    console.log("closed ", event.data);
  };
});

function take_primary_action() {
  let move = prompt('Enter move.');
  // TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
  // ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS
  let message, target;
  switch(move){
    case 'TAKE_FOREIGN_AID':
      message = {type: 'TAKE_FOREIGN_AID', player: state.name};
      socket.send(JSON.stringify(message));
      break;
    case 'TAKE_INCOME':
      message = {type: 'TAKE_INCOME', player: state.name};
      socket.send(JSON.stringify(message));
      break;
    case 'COUP_PLAYER':
      target = prompt('Enter player name to coup.');
      message = {type: 'COUP_PLAYER', target: target, player: state.name};
      socket.send(JSON.stringify(message));
      break;
    case 'ASSASSINATE_PLAYER':
      target = prompt('Enter player name to assassinate.');
      message = {type: 'ASSASSINATE_PLAYER ', target: target, player: state.name};
      socket.send(JSON.stringify(message));
      break;
    case 'TAKE_TAX':
      message = {type: 'TAKE_TAX', player: state.name};
      socket.send(JSON.stringify(message));
      break;
    case 'STEAL_FROM_PLAYER':
      target = prompt('Enter player name to steal from.');
      message = {type: 'STEAL_FROM_PLAYER', target: target, player: state.name};
      socket.send(JSON.stringify(message));
      break;
    case 'DRAW_CARDS':
      message = {type: 'DRAW_CARDS', player: state.name};
      socket.send(JSON.stringify(message));
      break;
  }
}

function take_secondary_action(primary_action, valid_actions) {
  alert('Valid secondary actions: ' + valid_actions.join());
  let action = prompt('Enter secondary action in response to ' + primary_action);
  
  while(!valid_actions.includes(action)) {
    alert('Not a valid secondary action, try again');
    action = prompt('Enter secondary action in response to ' + primary_action);
  }
  socket.send({type: action, player: state.name});
}

function joinGame() {
  // sent post request to server,
  // joining game
  let name = prompt("Enter name:");
  state.name = name;
  let body = { name };
  return fetch("http://localhost:3000/join-game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      state.admin = data.admin;
    });
}
