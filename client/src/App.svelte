<script>
	import Popup from './Popup.svelte';

	import {connections} from './connection.store.js';
	import {joinGame} from './connection.store.js';

	import {player} from './player.store.js';

	let display_popup = 0;
	let onSubmit_popup = () => {};
	let validation_popup = () => {};
	let message_popup = '';
	
	let player_name = '';
	let primary_action = '';
	let secondary_action = '';
	let target_name = '';

	if($connections.connectionState === 'NotJoined') {
		message_popup = "Enter your name:";
		onSubmit_popup = (name) => {player_name = name;};
		validation_popup = () => {return true;};
		display_popup = 1;
	}

	$: if (player_name) {
		$player.name = player_name;
		joinGame(player_name).then((data) => {
			$player.admin = data.admin;
			establishConnection();
		});
	}

	function startGame() {
		fetch("http://localhost:3000/start-game", { method: "POST" });
	}
	function establishConnection() {
		$connections.connection = new WebSocket("ws://localhost:9000");
		$connections.connection.onopen = onOpen;
		$connections.connection.onclose = onClose;
		$connections.connection.onmessage = onMessage;
		$connections.connectionState = 'Joining';
	}
	function onOpen() {
		$connections.connection.send(JSON.stringify({type: "ASSOCIATE", id: $player.name}));
	}
	function onClose(event) {
		console.log("closed ", event.data);
	}
	function onMessage(event) {
		let message = JSON.parse(event.data);
		let choice, current_message;
		
		switch(message.type) {
			case 'DEAL_CARDS': // initial dealing of cards
				$player.cards = message.cards;
				$connections.connectionState = 'Joined';
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
				choice = prompt('Choose a card to reveal: ' + $player.cards);
				current_message = {type: 'REVEALED_CARD', player: $player.name, reason: message.reason, prev_type: message.prev_type, card: choice}; 
				break;
			case 'RECEIVE_MONEY':
				// response from TAKE_FOREIGN_AID, TAKE_INCOME, STEAL_FROM_PLAYER
				$player.coins = message.coins;
				break;
			case 'RECEIVE_CARDS':
				// response from DRAW_CARDS; player receives two cards and needs to pick
				// a number of cards equal to their current total to keep from the set of cards
				// received and already had cards
				choice = prompt('Choose ' + $player.cards.length + ' cards to keep: ' + $player.cards + "," + message.cards);
				
				// todo: validate
				$player.cards = choice.split(',').map(card => card.trim());
				current_message = {type: 'CARDS_CHOSEN', player: $player.name, cards: $player.cards};
				// need to add retry later; hook in socket onError
				break;
			case 'CHANGE_CARDS': 
				// player has been couped/assassinated, and must select a card to lose
				// OR player has called bluff incorrectly, and must select a card to lose
				$player.cards = message.cards;
				break;
			case 'CHOOSE_PLAYER':
				// player must choose a target to coup as a result of having
				// 10 or more coins at the start of their turn
				choice = prompt('Enter player name to coup');
				current_message = {type: 'COUP_PLAYER', player: $player.name, target: choice}; 
				break;
			case 'GAME_OVER':
				// the game is over, update interface accordingly
				break;
		}

		if(current_message) {
			$connections.connection.send(JSON.stringify(current_message));
		}
	};

	function take_primary_action() {
		message_popup = "Enter move:";
		onSubmit_popup = (input_move) => {primary_action = input_move;};
		validation_popup = () => {return true;};
		display_popup = 1;
	}

	$: if(primary_action) {
		process_primary_action(primary_action);
	}

	function process_primary_action(move) {
		// TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
		// ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS
		let message, target;
		switch(move) {
			case 'TAKE_FOREIGN_AID':
				message = {type: 'TAKE_FOREIGN_AID', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'TAKE_INCOME':
				message = {type: 'TAKE_INCOME', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'COUP_PLAYER':
				target = prompt('Enter player name to coup.');
				message = {type: 'COUP_PLAYER', target: target, player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'ASSASSINATE_PLAYER':
				target = prompt('Enter player name to assassinate.');
				message = {type: 'ASSASSINATE_PLAYER', target: target, player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'TAKE_TAX':
				message = {type: 'TAKE_TAX', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'STEAL_FROM_PLAYER':
				target = prompt('Enter player name to steal from.');
				message = {type: 'STEAL_FROM_PLAYER', target: target, player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'DRAW_CARDS':
				message = {type: 'DRAW_CARDS', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
		}
	}

	function take_secondary_action(primary_action, valid_actions) {
		message_popup = 'Enter secondary action in response to ' + primary_action +
								' (Valid secondary actions: ' + valid_actions.join() + ')';
		onSubmit_popup = (input_move) => {secondary_action = input_move;};
		validation_popup = (input_move) => {return valid_actions.includes(input_move);};
		display_popup = 1;
	}

	$: if(secondary_action) {
		process_secondary_action();
	}

	function process_secondary_action() {
		$connections.connection.send(JSON.stringify({type: secondary_action, player: $player.name}));
	}
</script>

<!-- svelte-ignore non-top-level-reactive-declaration -->
<Popup message={message_popup} display={display_popup} onSubmit={onSubmit_popup} validation={validation_popup}/>

<main>
	<h1>Hello {$player.name}!</h1>
	<h2>Your cards are {$player.cards.join(' & ')}, and you have {$player.coins} coins.</h2>
	<p>Valid action names:</p>
	<p>TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS</p>
	<p>CALL_BLUFF, BLOCK_AID, BLOCK_STEAL, BLOCK_ASSASSINATE, APPROVE_MOVE</p>
	{#if ($player.admin && $connections.connectionState !== 'Joined')}
		<button on:click={() => {startGame();}}>Start Game</button>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>