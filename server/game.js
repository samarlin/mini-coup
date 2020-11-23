// Objects containing messages which the player class can send
// actions taken at the beginning of a user's turn
const PRIMARY_ACTIONS = {
  TAKE_FOREIGN_AID: {
    // no CALL_BLUFF
    type: "TAKE_FOREIGN_AID",
    valid_responses: ["BLOCK_AID"],
    require_response: true,
    require_target: false,
  },
  TAKE_INCOME: {
    // no CALL_BLUFF
    type: "TAKE_INCOME",
    valid_responses: [],
    require_response: false,
    require_target: false,
  },
  COUP_PLAYER: {
    // no CALL_BLUFF
    type: "COUP_PLAYER",
    valid_responses: [],
    require_response: false,
    require_target: true,
  },
  ASSASSINATE_PLAYER: {
    type: "ASSASSINATE_PLAYER",
    valid_responses: ["CALL_BLUFF", "BLOCK_ASSASSINATE"],
    require_response: true,
    require_target: true,
  },
  TAKE_TAX: {
    type: "TAKE_TAX",
    valid_responses: ["CALL_BLUFF"],
    require_response: true,
    require_target: false,
  },
  STEAL_FROM_PLAYER: {
    type: "STEAL_FROM_PLAYER",
    valid_responses: ["CALL_BLUFF", "BLOCK_STEAL"],
    require_response: true,
    require_target: true,
  },
  DRAW_CARDS: {
    type: "DRAW_CARDS",
    valid_responses: ["CALL_BLUFF"],
    require_response: true,
    require_target: false,
  },
};

const PRIMARY_ACTIONS_VALIDATIONS = {
  TAKE_FOREIGN_AID: () => true,
  TAKE_INCOME: () => true,
  COUP_PLAYER: ({ playerState }) => playerState.coinsCount >= 7, // game forces coup if current player has >=10 coins
  ASSASSINATE_PLAYER: ({ playerState }) => playerState.coinsCount >= 3,
  TAKE_TAX: () => true,
  STEAL_FROM_PLAYER: () => true,
  DRAW_CARDS: ({ gameState }) => gameState.deck.length >= 2,
};

// the target for all of these will always be the user who took the
//    primary action

// None of these require validation, but 'CALL_BLUFF' is a terminal action
//    that is, the 'response' to call bluff is that the user having their bluff called
//    either reveals or loses a card, and the turn concludes (there are no more responses during that turn)
const SECONDARY_ACTIONS = {
  CALL_BLUFF: {
    // available to any player after a primary action (except coup) or any other secondary action is taken
    type: "CALL_BLUFF",
    require_response: true,
    require_target: true,
  },
  BLOCK_AID: {
    // available to any player after a primary action of TAKE_FOREIGN_AID is taken
    type: "BLOCK_AID",
    require_response: true,
    require_target: true,
  },
  BLOCK_STEAL: {
    // only available to target of primary action STEAL_FROM_PLAYER
    type: "BLOCK_STEAL",
    require_response: true,
    require_target: true,
  },
  BLOCK_ASSASSINATE: {
    // only available to target of primary action ASSASSINATE_PLAYER
    type: "BLOCK_ASSASSINATE",
    require_response: true,
    require_target: true,
  },
};

// Messages which the game object sends:

// takes arr and picks num elements randomly, removes them from arr
function pickRand(arr, num) {
  let cards = [];
  for (let i = 0; i < num; ++i) {
    let randIndex = Math.floor(Math.random() * arr.length);
    cards.push(arr[randIndex]);
    arr.splice(randIndex, 1);
  }

  return cards;
}

class EventEmitter {
  constructor() {
    this.eventsLog = [];
  }

  // used to recieve a message from another object
  //    (other object calls)
  postMessage(message) {
    this.eventsLog.push(message);
    this.onMessage(message);
  }

  // used for the object itself to listen to the received messages and do something about them
  onMessage(message) {}
}

class Game extends EventEmitter {
  constructor(players) {
    super();

    this.deck = [
      "contessa",
      "duke",
      "assassin",
      "captain",
      "ambassador",
      "contessa",
      "duke",
      "assassin",
      "captain",
      "ambassador",
      "contessa",
      "duke",
      "assassin",
      "captain",
      "ambassador",
    ]; // todo: make less ugly
    this.players = players;
    Object.keys(this.players).forEach((player) => {
      this.players[player].cards = pickRand(this.deck, 2);
      this.players[player].connection.send(JSON.stringify({'type': 'DEAL_CARDS', 'cards': this.players[player].cards}));
      this.players[player].coins = 2;
      this.players[player].connection.send(JSON.stringify({'type': 'RECEIVE_MONEY', 'coins': this.players[player].coins}));
    });
    this.currentPlayer = Object.values(this.players)[0];

    setTimeout(() => {this.turn();}, 2000);
  }

  onMessage(message) {
    let is_primary = message.type in PRIMARY_ACTIONS;
    let valid_responses = PRIMARY_ACTIONS[message.type].valid_responses;
    let other_players = Object.values(this.players).filter(player => player.name != this.currentPlayer.name);

    if (is_primary)
      if (valid_responses.length > 0) {
        other_players.forEach(player => {
          player.connection.send(JSON.stringify({type: 'TAKE_SECONDARY_ACTION', primary: message.type, actions: valid_responses})); 
        });
      }

    // if it's time for a new turn, onMessage calls turn();
  }

  turn() {
    //
    // if current player has 0 cards, skip turn
    /*
    this.players.forEach((player, index) => {
      if (player.cards.length === 0) {
        this.players.splice(index, 1);
      }
    });
    */

    // if current player's coins >= 10 must coup
    if (this.currentPlayer.coins >= 10) {
      //this.currentPlayer.connection.send(...)
    }

    // query player for PRIMARY_ACTION
    this.currentPlayer.connection.send(JSON.stringify({type: 'TAKE_PRIMARY_ACTION'}));

    // validate PRIMARY_ACTION
    // query all other players for valid SECONDARY_ACTION
    // process first recieved SECONDARY_ACTION
  }
}


// player1: TAKE_TAX (no one takes a secondary action),
// player2: TAKE_FOREIGN_AID, player3: BLOCK_AID, player1: CALL_BLUFF->player3
//              if CALL_BLUFF was correct: player3 loses a card, TAKE_FOREIGN_AID successfully resolves, turn ends
//              if CALL_BLUFF was incorrect: player3 reveals their card, draws a new one, player1 loses a card, TAKE_FOREIGN_AID fails

exports.Game = Game;