// Objects containing the different actions players can take
const e = require("express");

// actions taken at the beginning of a user's turn
const PRIMARY_ACTIONS = {
  TAKE_FOREIGN_AID: {
    // no CALL_BLUFF
    type: "TAKE_FOREIGN_AID",
    valid_responses: ["BLOCK_AID", "APPROVE_MOVE"],
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
    valid_responses: ["CALL_BLUFF", "BLOCK_ASSASSINATE", "APPROVE_MOVE"],
    require_response: true,
    require_target: true,
  },
  TAKE_TAX: {
    type: "TAKE_TAX",
    valid_responses: ["CALL_BLUFF", "APPROVE_MOVE"],
    require_response: true,
    require_target: false,
  },
  STEAL_FROM_PLAYER: {
    type: "STEAL_FROM_PLAYER",
    valid_responses: ["CALL_BLUFF", "BLOCK_STEAL", "APPROVE_MOVE"],
    require_response: true,
    require_target: true,
  },
  DRAW_CARDS: {
    type: "DRAW_CARDS",
    valid_responses: ["CALL_BLUFF", "APPROVE_MOVE"],
    require_response: true,
    require_target: false,
  },
};

const PRIMARY_ACTIONS_VALIDATIONS = {
  TAKE_FOREIGN_AID: () => "pass",
  TAKE_INCOME: () => "pass",
  COUP_PLAYER: ({ gameState, playerState, target }) => {
    let found = Object.keys(gameState.players).includes(target);
    if(!(playerState.coins >= 7) && !found) { return "insufficient coins & wrong player"}
    if(!(playerState.coins >= 7)) { return "insufficient coins"; }
    if(!found) {
      return "invalid target";
    }
    return "pass"
  }, // game forces coup if current player has >=10 coins
  ASSASSINATE_PLAYER: ({ gameState, playerState, target }) => {
    let found = Object.keys(gameState.players).includes(target);
    if(!(playerState.coins >= 3) && !found) { return "insufficient coins & wrong player"}
    if(!(playerState.coins >= 3)) { return "insufficient coins"; }
    if(!found) {
      return "invalid target";
    }
    return "pass"
  },
  TAKE_TAX: () => "pass",
  STEAL_FROM_PLAYER: ({gameState, playerState, target}) => {
    if(!Object.keys(gameState.players).includes(target)) {
      return "invalid target";
    } else if (2 > gameState.players[target].coins) {
      return "target has insufficient coins";
    }
    return "pass"
  },
  DRAW_CARDS: ({ gameState }) => {
    if(!gameState.deck.length() >= 2) { return "insufficient cards in deck"}
    return "pass"
  }
};

// The target for all of these will always be the user who took the
//    primary action

// None of these require validation, but 'CALL_BLUFF' is a terminal action
//    that is, the 'response' to call bluff is that the user having their bluff called
//    either reveals or loses a card, and the turn concludes (there are no more responses during that turn)
const SECONDARY_ACTIONS = {
  CALL_BLUFF: {
    // available to any player after a primary action (except coup) or any other secondary action is taken
    type: "CALL_BLUFF",
    require_response: true,
    require_target: true
  },
  BLOCK_AID: {
    // available to any player after a primary action of TAKE_FOREIGN_AID is taken
    type: "BLOCK_AID",
    require_response: true,
    require_target: true
  },
  BLOCK_STEAL: {
    // only available to target of primary action STEAL_FROM_PLAYER
    type: "BLOCK_STEAL",
    require_response: true,
    require_target: true
  },
  BLOCK_ASSASSINATE: {
    // only available to target of primary action ASSASSINATE_PLAYER
    type: "BLOCK_ASSASSINATE",
    require_response: true,
    require_target: true
  },
  APPROVE_MOVE: {
    type: "APPROVE_MOVE",
    require_response: false,
    require_target: false
  },
  REVEALED_CARD: {
    type: "REVEALED_CARD",
    require_response: false,
    require_target: false
  },
  CARDS_CHOSEN: {
    type: "CARDS_CHOSEN",
    require_response: false,
    require_target: false
  }
};

const CARD_TO_MOVE = {
  contessa: ["BLOCK_ASSASSINATE"],
  duke: ["TAKE_TAX", "BLOCK_AID"],
  assassin: ["ASSASSINATE_PLAYER"],
  captain: ["STEAL_FROM_PLAYER", "BLOCK_STEAL"],
  ambassador: ["DRAW_CARDS", "BLOCK_STEAL"],
}

class Deck {
  constructor() {
    this.cards = Array(3).fill(["contessa","duke","assassin","captain","ambassador"]).flat();
    this.shuffle();
  }

  shuffle() {
    for(let k = 0; k < 50; ++k) {
      for (let i = this.cards.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
    }
  }

  drawCards(num) {
    let selected_cards = [];
    for(let i = 0; i < num; ++i) {
      selected_cards.push(this.cards.shift());
    }

    return selected_cards;
  }

  replaceCards(returned_cards) {
    this.cards = this.cards.concat(returned_cards);
    this.shuffle();
  }

  length() {
    return this.cards.length;
  }
}

class Game {
  constructor(players) {
    this.event_log = [];

    this.deck = new Deck();
    this.players = players;
    this.dead_players = {};
    Object.keys(this.players).forEach((player) => {
      this.players[player].cards = this.deck.drawCards(2);
      this.players[player].connection.send(JSON.stringify({type: 'DEAL_CARDS', cards: this.players[player].cards}));
      this.players[player].coins = 2;
      this.players[player].connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.players[player].coins}));
    });
    this.current_player = Object.values(this.players)[0];

    this.sendUpdate("", {type: 'UPDATE', msg: {type: 'INIT_GAME', players: Object.keys(this.players)}});
    
    this.current_primary = {};
    this.active_secondary = {};
    this.awaiting_secondary = false;
    this.response_tally = 0;
    this.primary_success = false;
    this.current_turn_moves = []

    setTimeout(() => {this.turn();}, 500);
  }

  playerLeft(name) {
    // figure out what else to do here
    if (name in this.players) {
      let len = this.players[name].cards.length;
      this.players[name].cards.forEach(card => {
        len--;
        this.sendUpdate(name, {type: 'UPDATE', msg: {player: name, type: 'CHANGE_CARDS', cards: len, revealed: card, result: "LOST"}});
      });
      this.players[name].cards = [];
      if(this.current_player.name === name) {
        this.onMessage({type: 'END_TURN'});
      }
    }
  }

  // pass in name of player to exclude and message to update all other players
  sendUpdate(excluded_player, message) {
    let other_players = Object.values(this.players).filter(player => player.name !== excluded_player);
    other_players.forEach(player => {
      player.connection.send(JSON.stringify(message)); 
    });
    Object.keys(this.dead_players).forEach(dead_player => {
      this.dead_players[dead_player].connection.send(JSON.stringify(message));
    })
  }

  onMessage(message) {
    this.event_log.push(message);
    this.current_turn_moves.unshift(message);

    if(message.type === 'END_TURN') {
      this.primary_success = false;
      this.awaiting_secondary = false;
    }

    let is_primary = message.type in PRIMARY_ACTIONS;

    let other_players = Object.values(this.players).filter(player => player.name !== message.player);

    if (is_primary) {
      // validate PRIMARY_ACTION
      this.current_primary = message;
      let valid_responses = PRIMARY_ACTIONS[message.type].valid_responses;
      let validation = PRIMARY_ACTIONS_VALIDATIONS[message.type]({gameState: {deck: this.deck, players: this.players}, playerState: this.current_player, target: message.target});
      if(validation !== "pass") {
        this.current_player.connection.send(JSON.stringify({type: 'INVALID_MOVE', error: validation}));
        return;
      } 

      this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'PRIMARY_TAKEN', primary: message.type, involved_players: {origin: this.current_player.name, target: message.target}}});
      
      // query all other players for valid SECONDARY_ACTION
      if (valid_responses.length > 0) {
        this.awaiting_secondary = true;
        other_players.forEach(player => {
          player.connection.send(JSON.stringify({type: 'TAKE_SECONDARY_ACTION', primary: message.type, actions: valid_responses, involved_players: {origin: this.current_player.name, target: message.target}})); 
        });
        if(message.type === 'ASSASSINATE_PLAYER') { // assassin spends 3 coins regardless of success
          this.current_player.coins -= 3;
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.current_player.coins}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_MONEY', coins: this.current_player.coins}});
        }
      } else {
        // TAKE_INCOME & COUP_PLAYER
        if(message.type === 'TAKE_INCOME') {
          this.current_player.coins += 1;
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.current_player.coins}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_MONEY', coins: this.current_player.coins}});
          this.awaiting_secondary = false;
        } else if(message.type === 'COUP_PLAYER') {
          // send message to message.target to pick a card to lose
          this.players[message.target].connection.send(JSON.stringify({type: 'REVEAL_CARD', reason: 'COUP'}));
          this.sendUpdate(message.target, {type: 'UPDATE', msg: {player: message.target, type: 'REVEAL_CARD', reason: 'COUP'}});

          this.current_player.coins -= 7;
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.current_player.coins}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_MONEY', coins: this.current_player.coins}});
          this.awaiting_secondary = true;
        }  
      }
    } else if(message.type in SECONDARY_ACTIONS) {
      // process SECONDARY_ACTION
      if(this.awaiting_secondary === true) {
        if(message.type === "APPROVE_MOVE") {
          ++this.response_tally;
          this.sendUpdate(message.player, {type: 'UPDATE', msg: {player: message.player, type: 'APPROVED_MOVE'}});
          if(this.response_tally === Object.values(this.players).length - 1) {
            if(Object.keys(this.active_secondary).length === 0) {
              this.primary_success = true;
              this.awaiting_secondary = false;
            } else {
              this.primary_success = false;
              this.awaiting_secondary = false;
            }
          }
        } else {
          // process non-"APPROVE_MOVE" secondary action
          // We no longer need to check for "APPROVE_MOVE" as
          // the first non-"APPROVE_MOVE" secondary action received is the one which resolves

          // send to all other players 

          switch(message.type) { // CALL_BLUFF, BLOCK_AID, BLOCK_STEAL, BLOCK_ASSASSINATE
            case 'CALL_BLUFF':
              // can either be current player or player who blocked steal/assassinate/aid
              let target, local_type;
              for (let i = 1; i < this.current_turn_moves.length; ++i) {
                if (this.current_turn_moves[i].type !== 'APPROVE_MOVE') {
                  target = this.current_turn_moves[i].player;
                  local_type = this.current_turn_moves[i].type;
                  break;
                }
              }
              this.players[target].connection.send(JSON.stringify({type: 'REVEAL_CARD', reason: 'BLUFF', prev_type: local_type, instigator: message.player}));
              this.sendUpdate("", {type: 'UPDATE', msg: {player: target, type: 'REVEAL_CARD', reason: 'BLUFF', prev_type: local_type, instigator: message.player}});
              break;
            case 'BLOCK_AID':
              // give other users an opportunity to CALL_BLUFF
              this.response_tally = 0;
              this.active_secondary = message;
              other_players.forEach(player => {
                player.connection.send(JSON.stringify({type: 'TAKE_SECONDARY_ACTION', primary: message.type, actions: ["CALL_BLUFF", "APPROVE_MOVE"], involved_players: {origin: message.player, target: this.current_player.name}})); 
              });
              break;
            case 'BLOCK_STEAL':
              this.response_tally = 0;
              this.active_secondary = message;
              other_players.forEach(player => {
                player.connection.send(JSON.stringify({type: 'TAKE_SECONDARY_ACTION', primary: message.type, actions: ["CALL_BLUFF", "APPROVE_MOVE"], involved_players: {origin: message.player, target: this.current_player.name}})); 
              });
              break;
            case 'BLOCK_ASSASSINATE':
              this.response_tally = 0;
              this.active_secondary = message;
              other_players.forEach(player => {
                player.connection.send(JSON.stringify({type: 'TAKE_SECONDARY_ACTION', primary: message.type, actions: ["CALL_BLUFF", "APPROVE_MOVE"], involved_players: {origin: message.player, target: this.current_player.name}})); 
              });
              break;
            case 'REVEALED_CARD':
              if(CARD_TO_MOVE[message.card].includes(message.prev_type) && message.reason === 'BLUFF') {
                // They have the card -- are issued a new card to replace the one they revealed
                let idx = this.players[message.player].cards.findIndex(card => { return card === message.card; });
                this.players[message.player].cards.splice(idx, 1);

                let new_card = this.deck.drawCards(1); 
                this.players[message.player].cards.push(new_card);
                this.deck.replaceCards(message.card);

                this.players[message.player].connection.send(JSON.stringify({type: 'CHANGE_CARDS', cards: this.players[message.player].cards, result: "REPLACED"}));
                this.sendUpdate(message.player, {type: 'UPDATE', msg: {player: message.player, type: 'CHANGE_CARDS', cards: this.players[message.player].cards.length, revealed: message.card, result: "REPLACED"}});

                // the challenging player now loses a card:
                this.players[message.instigator].connection.send(JSON.stringify({type: 'REVEAL_CARD', reason: 'FAILED_BLUFF'}));
                this.sendUpdate(message.instigator, {type: 'UPDATE', msg: {player: message.instigator, type: 'REVEAL_CARD', reason: 'FAILED_BLUFF'}});
                
                this.primary_success = true;
                this.awaiting_secondary = true;
              } else {
                // They don't have the card -- they just lose a card
                // or, they've been assassinated/couped
                let idx = this.players[message.player].cards.findIndex(card => { return card === message.card; });
                this.players[message.player].cards.splice(idx, 1);
                this.players[message.player].connection.send(JSON.stringify({type: 'CHANGE_CARDS', cards: this.players[message.player].cards, result: "LOST"}));
                this.sendUpdate(message.player, {type: 'UPDATE', msg: {player: message.player, type: 'CHANGE_CARDS', cards: this.players[message.player].cards.length, revealed: message.card, result: "LOST"}});

                if (message.player === this.current_player.name) {
                  this.primary_success = false;
                }
                this.awaiting_secondary = false;
              }
              break;
            case 'CARDS_CHOSEN':
              this.players[message.player].cards = message.cards;
              this.deck.replaceCards(message.discards);
              this.sendUpdate(message.player, {type: 'UPDATE', msg: {player: message.player, type: 'CARDS_CHOSEN', cards: message.cards.length}});
              this.awaiting_secondary = false;
              break;
          }
        }
      }
    }

    // if it's time for a new turn, we resolve the current primary, update current_player and call this.turn();
    if(this.primary_success && !this.awaiting_secondary) {
      // resolve current primary
      switch(this.current_primary.type) {
        case 'TAKE_FOREIGN_AID':
          this.current_player.coins += 2;
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.current_player.coins}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_MONEY', coins: this.current_player.coins}});
          
          this.awaiting_secondary = false;
          break;
        case 'ASSASSINATE_PLAYER':
          this.players[this.current_primary.target].connection.send(JSON.stringify({type: 'REVEAL_CARD', reason: 'ASSASSINATION'}));
          this.sendUpdate(this.current_primary.target, {type: 'UPDATE', msg: {player: this.current_primary.target, type: 'REVEAL_CARD', reason: 'ASSASSINATION'}});
          
          this.awaiting_secondary = true;
          break;
        case 'TAKE_TAX':
          this.current_player.coins += 3;
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.current_player.coins}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_MONEY', coins: this.current_player.coins}});
          
          this.awaiting_secondary = false;
          break;
        case 'STEAL_FROM_PLAYER':
          this.current_player.coins += 2;
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.current_player.coins}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_MONEY', coins: this.current_player.coins}});
          
          this.players[this.current_primary.target].coins -= 2;
          this.players[this.current_primary.target].connection.send(JSON.stringify({type: 'RECEIVE_MONEY', coins: this.players[this.current_primary.target].coins}));
          this.sendUpdate(this.current_primary.target, {type: 'UPDATE', msg: {player: this.current_primary.target, type: 'RECEIVE_MONEY', coins: this.players[this.current_primary.target].coins}});
          
          this.awaiting_secondary = false;
          break;
        case 'DRAW_CARDS':
          let local_pick = this.deck.drawCards(2);
          this.current_player.connection.send(JSON.stringify({type: 'RECEIVE_CARDS', cards: local_pick}));
          this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'RECEIVE_CARDS'}});
          
          this.awaiting_secondary = true;
          break;
      }
      this.primary_success = false;
    }

    if (!this.awaiting_secondary) {
      // move to next turn
      this.response_tally = 0;
      this.current_turn_moves = [];
      this.awaiting_secondary = true;
      this.primary_success = false;
      this.active_secondary = {};

      let curr_ind = Object.keys(this.players).indexOf(this.current_player.name);
      
      // cull dead players
      let lost = [];
      Object.keys(this.players).forEach(player => {
        if(this.players[player].cards.length === 0) {
          lost.push(player);
        }
      });

      lost.forEach(loser => {
        this.dead_players[loser] = this.players[loser];
        if(Object.keys(this.players).indexOf(loser) <= curr_ind) {
          curr_ind = (curr_ind === 0) ? Object.keys(this.players).length - 2 : curr_ind - 1;
        }
        delete this.players[loser];
      });

      curr_ind = (curr_ind === (Object.keys(this.players).length - 1)) ? 0 : curr_ind + 1;
      this.current_player = Object.values(this.players)[curr_ind];

      this.turn();
    }
  }

  turn() {
    // if current player has 0 cards, add them to dead_players and skip turn
    // redundant given end-of-turn player culling 
    if (this.current_player.cards.length === 0) {
      let name = this.current_player.name;
      this.dead_players[name] = this.current_player;

      let curr_ind = Object.values(this.players).indexOf(this.current_player);
      curr_ind = (curr_ind === (Object.keys(this.players).length - 1)) ? 0 : curr_ind + 1;
      this.current_player = Object.values(this.players)[curr_ind];

      delete this.players[name];

      if(Object.keys(this.players).length > 1) {
        this.turn();
      }
    }

    if(Object.keys(this.players).length <= 1) {
      this.current_player.connection.send(JSON.stringify({type: "GAME_OVER", win: true}));
      Object.keys(this.dead_players).forEach((name) => {
        this.dead_players[name].connection.send(JSON.stringify({type: "GAME_OVER", win: false}));
      });
      // take other server-side game-over actions (eg close room, reset game state...?)
      return;
    }

    // if current player's coins >= 10 must coup
    if (this.current_player.coins >= 10) {
      this.current_player.connection.send(JSON.stringify({type: 'CHOOSE_PLAYER'}));
      this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'CHOOSE_PLAYER'}});
      return;
    }

    // query player for PRIMARY_ACTION
    this.current_player.connection.send(JSON.stringify({type: 'TAKE_PRIMARY_ACTION'}));
    this.sendUpdate(this.current_player.name, {type: 'UPDATE', msg: {player: this.current_player.name, type: 'TAKE_PRIMARY_ACTION'}});
  }
}

// Example turns...
// player1: TAKE_TAX (no one takes a secondary action),
// player2: TAKE_FOREIGN_AID, player3: BLOCK_AID, player1: CALL_BLUFF->player3
//              if CALL_BLUFF was correct: player3 loses a card, TAKE_FOREIGN_AID successfully resolves, turn ends
//              if CALL_BLUFF was incorrect: player3 reveals their card, draws a new one, player1 loses a card, TAKE_FOREIGN_AID fails

exports.Game = Game;