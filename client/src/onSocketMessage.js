socket.onmessage = function (event) {
    $move_submission.disabled = false;
    let message = JSON.parse(event.data);
    
    switch(message.type) {
    case 'DEAL_CARDS': // initial dealing of cards
        state.cards = message.cards;
        $cards.innerHTML = message.cards;
        break;
    case 'TAKE_PRIMARY_ACTION':
        // TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
        // ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS 
        take_primary_action();
        break;
    case 'INVALID_MOVE':
        // game found primary action to be invalid, player must chose another one
        $prompt.innerHTML = 'Invalid move chosen, try again. Reason: ' + message.error;
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
        $prompt.innerHTML = 'Choose a card to reveal: ' + state.cards;
        current_message = {type: 'REVEALED_CARD', player: state.name, reason: message.reason, prev_type: message.prev_type}; //card: choice, 
        break;
    case 'RECEIVE_MONEY':
        // response from TAKE_FOREIGN_AID, TAKE_INCOME, STEAL_FROM_PLAYER
        state.coins = message.coins;
        $coins.innerHTML = message.coins;
        break;
    case 'RECEIVE_CARDS':
        // response from DRAW_CARDS; player receives two cards and needs to pick
        // a number of cards equal to their current total to keep from the set of cards
        // received and already had cards
        $prompt.innerHTML = 'Choose ' + state.cards.length + ' cards to keep: ' + state.cards + "," + message.cards;
        
        // todo: validate
        //state.cards = choice.split(',').map(card => card.trim());
        //$cards.innerHTML = state.cards;
        current_message = {type: 'CARDS_CHOSEN', player: state.name}; //cards: state.cards
        // need to add retry later; hook in socket onError
        break;
    case 'CHANGE_CARDS': 
        // player has been couped/assassinated, and must select a card to lose
        // OR player has called bluff incorrectly, and must select a card to lose
        state.cards = message.cards;
        $cards.innerHTML = message.cards;
        break;
    case 'CHOOSE_PLAYER':
        // player must choose a target to coup as a result of having
        // 10 or more coins at the start of their turn
        $prompt.innerHTML = 'Enter player name to coup';
        current_message = {type: 'COUP_PLAYER', player: state.name}; //target: choice, 
        break;
    case 'GAME_OVER':
        // the game is over, update interface accordingly
        break;
    }
};