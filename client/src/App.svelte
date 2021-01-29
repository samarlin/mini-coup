<script>
	import Popup from './Popup.svelte';
	import Opponent from './Opponent.svelte';

	import {connections} from './connection.store.js';
	import {joinGame} from './connection.store.js';

	import {player, opponents} from './player.store.js';

	let HOST = location.origin.replace(/^http/, 'ws');
	let interval;

	let popup_attr = {
		message: '',
		display: false,
		items: [],
		multi: false,
		alert: false,
        onSubmit: () => {}
	}

	function default_popup() {
		popup_attr.message = '';
		popup_attr.display = false;
		popup_attr.items = [];
		popup_attr.multi = false;
		popup_attr.alert = false;
		popup_attr.onSubmit = () => {};
	}
	
	let player_name = '';
	let primary_action = '';
	let secondary_action = '';
	let target_name = '';
	let reveal = {};
	let selected_cards = '';

	if($connections.connectionState === 'NotJoined') {
		popup_attr.items = [];
		popup_attr.message = "Enter your name:";
		popup_attr.onSubmit = (name) => {player_name = name; default_popup();};
		popup_attr.display = true;
	}

	$: if (player_name) {
		$player.name = player_name;
		joinGame(player_name).then((data) => {
			$player.admin = data.admin;
			establishConnection();
		});
	}

	function startGame() {
		fetch("https://mini-coup.herokuapp.com/start-game", { method: "POST" });
	}
	function establishConnection() {
		$connections.connection = new WebSocket(HOST);
		$connections.connection.onopen = onOpen;
		$connections.connection.onclose = onClose;
		$connections.connection.onmessage = onMessage;
		$connections.connectionState = 'Joining';
	}
	function onOpen() {
		$connections.connection.send(JSON.stringify({type: "ASSOCIATE", id: $player.name}));
		interval = setInterval(() => {$connections.connection.send(JSON.stringify({type: "PING"}));}, 20000);
	}
	function onClose(event) {
		clearInterval(interval);
		console.log("closed ", event.data);
	}
	function onMessage(event) {
		let message = JSON.parse(event.data);
		
		switch(message.type) {
			case 'UPDATE':
				process_update(message.msg);
				break;
			case 'DEAL_CARDS': // initial dealing of cards
				$player.cards = message.cards;
				$connections.connectionState = 'Joined';
				break;
			case 'TAKE_PRIMARY_ACTION':
				// TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
				// ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS 
				primary_action = '';
				Object.keys($opponents).forEach(opponent => {
					$opponents[opponent].pending_action = {};
				});
				take_primary_action();
				break;
			case 'INVALID_MOVE':
				// game found primary action to be invalid, player must chose another one
				trigger_alert('Invalid move chosen, try again. Reason: ' + message.error, take_primary_action);
				break;
			case 'TAKE_SECONDARY_ACTION':
				// CALL_BLUFF, BLOCK_AID, BLOCK_STEAL, BLOCK_ASSASSINATE
				// if a player's primary action is blocked, they have the option to CALL_BLUFF
				secondary_action = '';
				process_update(message);
				take_secondary_action(message.primary, message.involved_players, message.actions); 
				break;
			case 'REVEAL_CARD': 
				// player's bluff has been called, player must select a card to reveal
				// revealed card will either be lost or replaced, depending on
				//    whether the revealed card matches the attempted action
				reveal = {revealing: true, reason: message.reason, prev_type: message.prev_type, instigator: message.instigator};
				choose_cards($player.cards, false); 
				break;
			case 'RECEIVE_MONEY':
				// response from TAKE_FOREIGN_AID, TAKE_INCOME, STEAL_FROM_PLAYER
				$player.coins = message.coins;
				break;
			case 'RECEIVE_CARDS':
				// response from DRAW_CARDS; player receives two cards and needs to pick
				// a number of cards equal to their current total to keep from the set of cards
				// received and already had cards
				reveal = {revealing: false, cards: $player.cards.concat(message.cards)};
				choose_cards(reveal.cards, ($player.cards.length > 1));
				// need to add retry later; hook in socket onError
				break;
			case 'CHANGE_CARDS': 
				// player has been couped/assassinated, and selected a card to lose
				// OR player has called bluff incorrectly, and selected a card to lose
				$player.cards = message.cards;
				break;
			case 'CHOOSE_PLAYER':
				// player must choose a target to coup as a result of having
				// 10 or more coins at the start of their turn
				primary_action = 'COUP_PLAYER';
				break;
			case 'GAME_OVER':
				// the game is over, update interface accordingly
				trigger_alert('Game over! You ' + (message.win ? 'won!' : 'lost :('), game_over);
				break;
		}
	};

	function take_primary_action() {
		popup_attr.items = ['TAKE_FOREIGN_AID', 'TAKE_INCOME', 'COUP_PLAYER', 'ASSASSINATE_PLAYER', 'TAKE_TAX', 'STEAL_FROM_PLAYER', 'DRAW_CARDS'];
		popup_attr.message = "Enter move:";
		popup_attr.onSubmit = (input_move) => {primary_action = input_move; default_popup();};
		popup_attr.display = true;
	}

	$: if(primary_action) {
		process_primary_action(primary_action); 
	}

	function process_primary_action(move) {
		// TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
		// ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS
		let message;
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
				target_name = '';
				choose_player('coup');
				break;
			case 'ASSASSINATE_PLAYER':
				target_name = '';
				choose_player('assassinate');
				break;
			case 'TAKE_TAX':
				message = {type: 'TAKE_TAX', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'STEAL_FROM_PLAYER':
				target_name = '';
				choose_player('steal from');
				break;
			case 'DRAW_CARDS':
				message = {type: 'DRAW_CARDS', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
		}
	}

	function take_secondary_action(primary_action, involved_players, valid_actions) {
		popup_attr.message = 'Select secondary action in response to ' + primary_action + ' by ' + involved_players.origin + (involved_players.target ? ' against ' + involved_players.target : '');
		popup_attr.items = valid_actions;
		popup_attr.onSubmit = (input_move) => {secondary_action = input_move; default_popup();};
		popup_attr.display = true;
	}

	$: if(secondary_action) {
		process_secondary_action();
	}

	function process_secondary_action() {
		$connections.connection.send(JSON.stringify({type: secondary_action, player: $player.name}));
	}

	function choose_player(text) {
		popup_attr.message = 'Enter player name to ' + text;
		popup_attr.items = [];
		popup_attr.onSubmit = (input_name) => {target_name = input_name; default_popup();};
		popup_attr.display = true;
	}

	$: if(target_name) {
		process_choose_player();
	}

	function process_choose_player() {
		let message;
		switch(primary_action) {
			case 'COUP_PLAYER':
				message = {type: 'COUP_PLAYER', target: target_name, player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'ASSASSINATE_PLAYER':
				message = {type: 'ASSASSINATE_PLAYER', target: target_name, player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'STEAL_FROM_PLAYER':
				message = {type: 'STEAL_FROM_PLAYER', target: target_name, player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				break;
		}
	}

	function choose_cards(cards, multi) {
		selected_cards = '';
		if (multi) {
			popup_attr.message = 'Select two cards from below to keep';
			popup_attr.items = cards;
			popup_attr.multi = multi;
			popup_attr.onSubmit = (cards) => {selected_cards = cards; default_popup();};
			popup_attr.display = true;
		} else {
			popup_attr.message = 'Select a card from below ' + (reveal.revealing ? 'to reveal' : 'to keep');
			popup_attr.items = cards;
			popup_attr.onSubmit = (cards) => {selected_cards = cards; default_popup();};
			popup_attr.display = true;
		}
	}

	$: if(selected_cards) {
		process_card_selection();
	}

	function process_card_selection() {
		let message;
		if(reveal.revealing) {
			message = {type: 'REVEALED_CARD', player: $player.name, reason: reveal.reason, prev_type: reveal.prev_type, instigator: reveal.instigator, card: selected_cards};
		} else {
			if(selected_cards.length === 2) {
				$player.cards = [reveal.cards[selected_cards[0]], reveal.cards[selected_cards[1]]];
				reveal.cards.splice(selected_cards[1], 1); reveal.cards.splice(selected_cards[0], 1); 
			} else {
				$player.cards = selected_cards;
				const idx = reveal.cards.indexOf(selected_cards);
				if(idx > -1) {
					reveal.cards.splice(idx, 1);
				}
			}
			message = {type: 'CARDS_CHOSEN', player: $player.name, cards: $player.cards, discards: reveal.cards};
		}
		$connections.connection.send(JSON.stringify(message));
	}

	function trigger_alert(message, next_action) {
		popup_attr.message = message;
		popup_attr.alert = true;
		popup_attr.onSubmit = () => {next_action(); default_popup();};
		popup_attr.display = true;
	}

	function process_update(msg) {
		// messages to 'TAKE_SECONDARY_ACTION' should also be processed in here
		// 		so that objects which modify interface can be updated appropriately
		switch (msg.type) {
			case 'INIT_GAME':
				msg.players.forEach(opponent => {
					if(opponent !== $player.name)
						$opponents[opponent] = {name: opponent, cards: 2, coins: 2, alive: true, current_reveal: "", revealed_cards: [], pending_action: {}, last_action: {}};
				});
				break;
			case 'RECEIVE_MONEY': 
				// should I differentiate between the different RECEIVE_MONEY cases?
				// eg: income, foreign aid, coup, forced coup, assassination, theft... probably
				$opponents[msg.player].coins = msg.coins;
				break;
			case 'REVEAL_CARD':
				// COUP, BLUFF, FAILED_BLUFF, ASSASSINATION
				if(msg.player !== $player.name) {
					$opponents[msg.player].pending_action = {type: 'REVEAL_CARD', reason: msg.reason};
				}
				if(msg.reason === "BLUFF" && msg.instigator !== $player.name) {
					$opponents[msg.instigator].pending_action = {};
					$opponents[msg.instigator].last_action = {type: 'CALL_BLUFF', target: msg.player};
				}
				break;
			case 'APPROVED_MOVE':
				$opponents[msg.player].last_action = {type: 'APPROVED_MOVE'};
				$opponents[msg.player].pending_action = {};
				break;
			case 'CHANGE_CARDS':
				// revealed: message.card, result: "REPLACED" || "LOST"
				$opponents[msg.player].cards = msg.cards;
				$opponents[msg.player].pending_action = {};

				if(msg.result === "LOST") {
					$opponents[msg.player].last_action = {type: 'LOST_CARD'};
					$opponents[msg.player].revealed_cards.push(msg.revealed);
					if($opponents[msg.player].cards === 0) {
						$opponents[msg.player].alive = false;
						$opponents[msg.player].last_action = {type: 'DIED'};
					}
				} else {
					$opponents[msg.player].last_action = {type: 'REVEALED_CARD'};
					$opponents[msg.player].revealed_cards.push(msg.revealed);
					$opponents[msg.player].cards -= 1;
					setTimeout(function() {
						$opponents[msg.player].revealed_cards.pop();
						$opponents[msg.player].cards += 1;
					}, 1500);
				}
				break;
			case 'CARDS_CHOSEN':
				$opponents[msg.player].cards = msg.cards;
				$opponents[msg.player].last_action = {type: 'CARDS_CHOSEN'};
				$opponents[msg.player].pending_action = {};
				break;
			case 'RECEIVE_CARDS':
				$opponents[msg.player].pending_action = {type: 'CHOOSE_CARDS'};
				$opponents[msg.player].cards += 2;
				break;
			case 'CHOOSE_PLAYER':
				$opponents[msg.player].last_action = {type: 'COUP_PLAYER'};
				$opponents[msg.player].pending_action = {type: 'CHOOSE_PLAYER'}
				break;
			case 'TAKE_PRIMARY_ACTION':
				Object.keys($opponents).forEach(opponent => {
					$opponents[opponent].pending_action = {};
				});
				$opponents[msg.player].pending_action = {type: 'TAKE_PRIMARY_ACTION'};
				break;
			case 'TAKE_SECONDARY_ACTION':
				Object.keys($opponents).forEach(opponent => {
					if(opponent !== msg.involved_players.origin)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
				});
				$opponents[msg.involved_players.origin].pending_action = {};
				$opponents[msg.involved_players.origin].last_action = {type: msg.primary, target: msg.involved_players.target};
				break;
			case 'PRIMARY_TAKEN':
				$opponents[msg.player].pending_action = {};
				$opponents[msg.player].last_action = {type: msg.primary, target: msg.involved_players.target};
				break;
		}
	}

	function game_over() {
		// TODO: stuff...
		console.log('game over~');
	}
</script>

<!-- svelte-ignore non-top-level-reactive-declaration -->
<svelte:component this={Popup} attr={popup_attr}/>

<main>
	<h1>Hello {$player.name}!</h1>
	<h2>Your cards are:</h2>
	{#each $player.cards as card} 
		<img src="assets/cards/{card}.png" alt="{card}" width="300">
	{/each}
	<h2>and you have {$player.coins} coins.</h2>

	<h2>Your opponents are:</h2>
	{#each Object.keys($opponents) as op}
		<Opponent name={op}/>
	{/each}
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

	img {
		padding: 1em;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>