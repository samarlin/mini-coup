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

class Player extends EventEmitter {
    constructor(name, ws) {
      super();
      this.name = name;
      this.cards = [];
      this.coins = 2;
      this.socket = ws;
  
      // public methods
      this.pickPlayerForCoup = pickPlayerForCoup;
    }
  
    receiveCards(cards) {
      this.cards = cards;
    }
  
    onMessage(message) {
      if (message.type === "PICK_TARGET_COUP") {
        this.game.postMessage({
          type: PRIMARY_ACTIONS.COUP_PLAYER,
          payload: pickedPlayerName,
        });
      }
    }
  }