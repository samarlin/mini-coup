<script>
	import Popup from '../components/Popup.svelte';
	import Opponent from '../components/Opponent.svelte';
	import Rules from '../components/Rules.svelte';
  	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import {connections} from '../stores/connection.store.js';
	import {player, opponents, reverse, tenses, move_mappings} from '../stores/player.store.js';

	let popup_attr = {
		message: '',
		display: false,
		items: [],
		multi: false,
		alert: false,
        onSubmit: () => {}
	}
	
	let primary_action = '';
	let secondary_action = '';
	let target_name = '';
	let reveal = {};
    let selected_cards = '';
    let popup, recent_action, num_opps = 0, game_ready = "none", rules;
	
	$connections.connection.onclose = function(event) {
		clearInterval($connections.interval);

		popup_attr = popup.initialData();
		popup_attr.message = "Connection to game lost."
		popup_attr.onSubmit = () => {window.location.href = "/"; popup_attr = popup.initialData();};
		popup_attr.alert = true;
		popup_attr.display = true;

	};
    $connections.connection.onmessage = onMessage;
	function onMessage(event) {
		let message = JSON.parse(event.data);
		
		switch(message.type) {
			case 'UPDATE':
				process_update(message.msg);
				break;
			case 'DEAL_CARDS': // initial dealing of cards
				$player.cards = message.cards;
				break;
			case 'TAKE_PRIMARY_ACTION':
				// TAKE_FOREIGN_AID, TAKE_INCOME, COUP_PLAYER, 
				// ASSASSINATE_PLAYER, TAKE_TAX, STEAL_FROM_PLAYER, DRAW_CARDS 
				primary_action = '';
				Object.keys($opponents).forEach(opponent => {
					$opponents[opponent].turn_active = false;
					$opponents[opponent].awaiting_move = false;
				});
				take_primary_action();
				break;
			case 'INVALID_MOVE':
				// game found primary action to be invalid, player must chose another one
				primary_action = '';
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
				if (message.result === 'LOST') {
					recent_action = $move_mappings['LOST_CARD'];
					$player.lost_cards.push(selected_cards);
				}
				if($player.cards.length === 0) {
					recent_action = 'DIED';
					$player.alive = false;
				}
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
		popup_attr.message = "Select an action to take.";
		popup_attr.onSubmit = (input_move) => {primary_action = input_move; popup_attr = popup.initialData();};
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
				recent_action = $tenses['TAKE_FOREIGN_AID'];
				message = {type: 'TAKE_FOREIGN_AID', player: $player.name};
				$connections.connection.send(JSON.stringify(message));
				Object.keys($opponents).forEach(opponent => {
					if($opponents[opponent].alive)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
						$opponents[opponent].awaiting_move = true;
				});
				break;
			case 'TAKE_INCOME':
				message = {type: 'TAKE_INCOME', player: $player.name};
				recent_action = $tenses['TAKE_INCOME'];
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
				recent_action = $tenses['TAKE_TAX'];
				$connections.connection.send(JSON.stringify(message));
				Object.keys($opponents).forEach(opponent => {
					if($opponents[opponent].alive)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
						$opponents[opponent].awaiting_move = true;
				});
				break;
			case 'STEAL_FROM_PLAYER':
				target_name = '';
				choose_player('steal from');
				break;
			case 'DRAW_CARDS':
				message = {type: 'DRAW_CARDS', player: $player.name};
				recent_action = "tried to exchange cards with the deck";
				Object.keys($opponents).forEach(opponent => {
					if($opponents[opponent].alive)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
						$opponents[opponent].awaiting_move = true;
				});
				$connections.connection.send(JSON.stringify(message));
				break;
		}
	}

	function take_secondary_action(primary_action, involved_players, valid_actions) {
		if(involved_players.target && involved_players.target !== $player.name) {
			if(primary_action === "ASSASSINATE_PLAYER") {
				let idx = valid_actions.indexOf('BLOCK_ASSASSINATE');
				valid_actions.splice(idx, 1);
			} else if(primary_action === "STEAL_FROM_PLAYER") {
				let idx = valid_actions.indexOf('BLOCK_STEAL');
				valid_actions.splice(idx, 1);
			}
		}
		popup_attr.message = 'Select an action in response to ' + $reverse[primary_action] + ' by ' + involved_players.origin + (involved_players.target ? ' against ' + involved_players.target + '.' : '.');
		popup_attr.items = valid_actions;
		popup_attr.onSubmit = (input_move) => {secondary_action = input_move; recent_action = $tenses[input_move] + ' ' + involved_players.origin; popup_attr = popup.initialData();};
		popup_attr.display = true;
	}

	$: if(secondary_action) {
		process_secondary_action();
	}

	function process_secondary_action() {
		$connections.connection.send(JSON.stringify({type: secondary_action, player: $player.name}));
	}

	function choose_player(text) {
		popup_attr.message = 'Choose target player to ' + text + '.';
		popup_attr.items = Object.keys($opponents).filter(player => $opponents[player].alive);
		popup_attr.onSubmit = (input_name) => {target_name = input_name; popup_attr = popup.initialData();};
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
				recent_action = $tenses['COUP_PLAYER'] + ' ' + target_name;
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'ASSASSINATE_PLAYER':
				message = {type: 'ASSASSINATE_PLAYER', target: target_name, player: $player.name};
				recent_action = $tenses['ASSASSINATE_PLAYER'] + ' ' + target_name;
				Object.keys($opponents).forEach(opponent => {
					if($opponents[opponent].alive)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
						$opponents[opponent].awaiting_move = true;
				});
				$connections.connection.send(JSON.stringify(message));
				break;
			case 'STEAL_FROM_PLAYER':
				message = {type: 'STEAL_FROM_PLAYER', target: target_name, player: $player.name};
				recent_action = $tenses['STEAL_FROM_PLAYER'] + ' ' + target_name;
				Object.keys($opponents).forEach(opponent => {
					if($opponents[opponent].alive)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
						$opponents[opponent].awaiting_move = true;
				});
				$connections.connection.send(JSON.stringify(message));
				break;
		}
	}

	function choose_cards(cards, multi) {
		selected_cards = '';
		if (multi) {
			popup_attr.message = 'Select two cards from below to keep.';
			popup_attr.items = cards;
			popup_attr.multi = multi;
			popup_attr.onSubmit = (cards) => {selected_cards = cards; popup_attr = popup.initialData();};
			popup_attr.display = true;
		} else {
			popup_attr.message = 'Select a card from below ' + (reveal.revealing ? 'to reveal.' : 'to keep.');
			popup_attr.items = cards;
			popup_attr.onSubmit = (cards) => {selected_cards = cards; popup_attr = popup.initialData();};
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
				$player.cards = [selected_cards];
				const idx = reveal.cards.indexOf(selected_cards);
				if(idx > -1) {
					reveal.cards.splice(idx, 1);
				}
			}
			recent_action = $move_mappings['CARDS_CHOSEN'];
			message = {type: 'CARDS_CHOSEN', player: $player.name, cards: $player.cards, discards: reveal.cards};
		}
		$connections.connection.send(JSON.stringify(message));
	}

	function trigger_alert(message, next_action) {
		popup_attr.items = [];
		popup_attr.multi = false;
		popup_attr.message = message;
		popup_attr.alert = true;
		popup_attr.onSubmit = () => {popup_attr = popup.initialData(); next_action();};
		popup_attr.display = true;
	}

	function process_update(msg) {
		// messages to 'TAKE_SECONDARY_ACTION' should also be processed in here
		// 		so that objects which modify interface can be updated appropriately
		switch (msg.type) {
			case 'INIT_GAME':
				// find index of player.name, move first half of list to end of list, drop player
				// that way cycling through player turns looks sensible
				let idx = msg.players.indexOf($player.name);
				let beg = msg.players.slice(0, idx);
				let end = msg.players.slice(idx+1);
				let players = end.concat(beg);
				players.forEach(opponent => {
					num_opps += 1;
					$opponents[opponent] = {name: opponent, cards: 2, coins: 2, alive: true, turn_active: false, just_moved: false, awaiting_move: true, current_reveal: "", revealed_cards: [], pending_action: {}, last_action: {}};
				});
				game_ready = "grid";
				break;
			case 'RECEIVE_MONEY': 
				// should I differentiate between the different RECEIVE_MONEY cases?
				// eg: income, foreign aid, coup, forced coup, assassination, theft... probably
				$opponents[msg.player].coins = msg.coins;
				break;
			case 'REVEAL_CARD':
				// COUP, BLUFF, FAILED_BLUFF, ASSASSINATION
				if(msg.reason === "BLUFF") { // bluff-specific logic
					Object.keys($opponents).forEach(opponent => {
						if(opponent !== msg.player) {
							$opponents[opponent].awaiting_move = false;
						}
					});

					if(msg.instigator !== $player.name) {
						$opponents[msg.instigator].last_action = {type: 'CALL_BLUFF', target: msg.player};
						$opponents[msg.instigator].just_moved = true;
					}

					if(msg.player !== $player.name)
						popup_attr = popup.initialData();
				}

				if(msg.player !== $player.name) {
					$opponents[msg.player].pending_action = {type: 'REVEAL_CARD', reason: msg.reason};
					$opponents[msg.player].awaiting_move = true;
				}
				break;
			case 'APPROVED_MOVE':
				$opponents[msg.player].just_moved = true;
				$opponents[msg.player].last_action = {type: 'APPROVED_MOVE'};
				$opponents[msg.player].awaiting_move = false;
				break;
			case 'CHANGE_CARDS':
				// revealed: message.card, result: "REPLACED" || "LOST"
				$opponents[msg.player].cards = msg.cards;
				$opponents[msg.player].just_moved = true;
				$opponents[msg.player].awaiting_move = false;

				if(msg.result === "LOST") {
					$opponents[msg.player].last_action = {type: 'LOST_CARD'};
					$opponents[msg.player].revealed_cards.push(msg.revealed);
					if($opponents[msg.player].cards === 0) {
						$opponents[msg.player].alive = false;
						$opponents[msg.player].awaiting_move = false;
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
				$opponents[msg.player].just_moved = true;
				$opponents[msg.player].cards = msg.cards;
				$opponents[msg.player].last_action = {type: 'CARDS_CHOSEN'};
				$opponents[msg.player].awaiting_move = false;
				break;
			case 'RECEIVE_CARDS':
				$opponents[msg.player].pending_action = {type: 'CHOOSE_CARDS'};
				$opponents[msg.player].awaiting_move = true;
				$opponents[msg.player].cards += 2;
				break;
			case 'CHOOSE_PLAYER':
				$opponents[msg.player].just_moved = true;
				$opponents[msg.player].last_action = {type: 'COUP_PLAYER'};
				$opponents[msg.player].pending_action = {type: 'CHOOSE_PLAYER'}
				$opponents[msg.player].awaiting_move = true;
				break;
			case 'TAKE_PRIMARY_ACTION':
				Object.keys($opponents).forEach(opponent => {
          			$opponents[opponent].turn_active = false;
			  		if($opponents[msg.player].name !== msg.player) {
						$opponents[opponent].awaiting_move = false;
					}
				});
				$opponents[msg.player].turn_active = true;
				$opponents[msg.player].pending_action = {type: 'TAKE_PRIMARY_ACTION'};
				$opponents[msg.player].awaiting_move = true;
				break;
			case 'TAKE_SECONDARY_ACTION':
				Object.keys($opponents).forEach(opponent => {
					if(opponent !== msg.involved_players.origin && $opponents[opponent].alive === true)
						$opponents[opponent].pending_action = {type: 'TAKE_SECONDARY_ACTION'};
						$opponents[opponent].awaiting_move = true;
				});
				$opponents[msg.involved_players.origin].awaiting_move = false;
				$opponents[msg.involved_players.origin].just_moved = true;
				$opponents[msg.involved_players.origin].last_action = {type: msg.primary, target: msg.involved_players.target};
				break;
			case 'PRIMARY_TAKEN':
				$opponents[msg.player].just_moved = true;
				$opponents[msg.player].awaiting_move = false;
				$opponents[msg.player].last_action = {type: msg.primary, target: msg.involved_players.target};
				break;
		}
	}

	function game_over() {
		// TODO: stuff...
		console.log('game over~');
		window.location.href = "/";
	}
</script>

<!-- svelte-ignore non-top-level-reactive-declaration -->
<Rules bind:this={rules}/>

<main>
	<h1>Mini Coup</h1>
	<div class="board{num_opps}" style="--ready: {game_ready};">
		<div id="main_player">
			<h2>{$player.name}</h2>
			<hr>
			{#each $player.cards as card, i (i)} 
				<img transition:fade animate:flip src="/assets/cards/{card}.png" alt="{card}">
			{/each}
			{#each $player.lost_cards as card, i (i)} 
				<img transition:fade animate:flip src="/assets/cards/{card}.png" alt="{card}" style="opacity: .5;">
			{/each}
			<img id="coins" src="/assets/coins/{$player.coins}.png" alt="{$player.coins} coins">

			{#if recent_action}
				<p transition:fade>You recently {recent_action}.</p>
			{/if}
		</div>

		<div class="opponents{num_opps}">
			{#each Object.keys($opponents) as op, i}
				<div class="OP{i}" style="grid-area: OP{i}; display: flex;">
					<Opponent name={op} glow={$opponents[op].just_moved} current_turn={$opponents[op].turn_active} awaiting_move={$opponents[op].awaiting_move} game_active={true} alive={$opponents[op].alive}/>
				</div>
			{/each}
		</div>

		<div style="grid-area: Options; display: flex;">
			<Popup bind:this={popup} game_active={true} attr={popup_attr} numopps={num_opps}/> 
		</div>
	</div>
    <button id="rules_button" on:click={()=>{rules.showRules();}}>Rules</button>
</main>

<style>	
	main {
		text-align: center;
        margin: 0 auto;

        color: rgb(91, 91, 91);
	}

	h1 {
		color: rgb(91, 91, 91);
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	h2 {
		font-size: 2.2em;
		color: rgb(91, 91, 91);
		text-shadow: 1px 1px rgba(255, 255, 255, 0.8);
		margin: 1vw;
		font-weight: 600;
	}

	img {
		max-width: calc(80%/2);
		padding: .5vw;
	}

	hr {
		width: 90%;
        border: .5px solid rgb(91, 91, 91);
		margin-bottom: 1em;
    }

	p {
		margin-left: 1em;
		margin-right: 1em;
	}

	#main_player {
		margin: 1vw;
		padding-top: 1vw; 
		border: 1px solid rgba(193, 182, 159, 0.8);
		border-bottom: 3px solid rgba(193, 182, 159, 0.8);
		display: inline-block;
		border-radius: 25px;
		grid-area: Player;
		background-image: url("/assets/bgs/beige.jpg");
		background-size: cover;
	}

	.board0, .board1 {
		display: var(--ready);
	}

	.board2 {
		display: var(--ready);

		max-width: 63vw;
		min-width: 760px;
		margin-left: auto;
		margin-right: auto;

		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 0px 0px;
		grid-template-areas:
			"Player OP0 OP1"
			"Player Options Options";
	}

	.board3 {
		display: var(--ready);

		max-width: 63vw;
		min-width: 760px;
		margin-left: auto;
		margin-right: auto;

		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 0px 0px;
		grid-template-areas:
			"Player OP0 OP1"
			"Player Options OP2";
	}

	.board4 {
		display: var(--ready);

		max-width: 63vw;
		min-width: 760px;
		margin-left: auto;
		margin-right: auto;

		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		gap: 0px 0px;
		grid-template-areas:
			"Player OP0 OP1"
			"Player Options OP2"
			". Options OP3";
	}

	.board5 {
		display: var(--ready);

		max-width: 63vw;
		min-width: 760px;
		margin-left: auto;
		margin-right: auto;

		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		gap: 0px 0px;
		grid-template-areas: "OP0 OP1 OP2"
							 "Player Options OP3"
							 "Player Options OP4";
	}

	.opponents2, .opponents3, .opponents4, .opponents5 { 
		display: contents; 
	}

	#coins {
        margin: auto;
        width: 60%;
        display: block;
    }

	#rules_button {
		margin-top: .8em;
        font-size: 1em;
        color: rgba(91, 91, 91, 0.7);
        display: block;
        margin-left: auto;
        margin-right: auto;
        background-image: none;
        background-color: white;

		border-bottom: 2px solid rgba(193, 182, 159, 0.8);
        border-radius: 25px;
    }

	@media (max-aspect-ratio: 6/8) {
		main {
			font-size: 0.9em;
		}

		h1 {
			margin: .1em;
		}

		h2 {
			font-size: 2em;
			margin: .3em;
		}
		
		.board2 {
			min-width: unset;
			max-width: unset;
			
			display: var(--ready);
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
			gap: 0px 0px;
			grid-template-areas:
				"Player OP0"
				"Player OP1"
				"Options Options";
		}

		.board3 {
			min-width: unset;
			max-width: unset;
			
			display: var(--ready);
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto;
			gap: 0px 0px;
			grid-template-areas:
				"Player Opps"
				"Options Opps";
		}

		.opponents3 {
			display: grid;
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr 1fr;
			gap: 0px 0px;
			grid-template-areas:
				"OP0"
				"OP1"
				"OP2";
			grid-area: Opps;
		}
		
		.board4 {
			min-width: unset;
			max-width: unset;
			
			display: var(--ready);
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr 1fr 1fr;
			gap: 0px 0px;
			grid-template-areas:
				"Player OP0"
				"Player OP1"
				"Options OP2"
				"Options OP3";
		}
		
		.board5 {
			min-width: unset;
			max-width: unset;
			
			display: var(--ready);
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
			gap: 0px 0px;
			grid-template-areas:
				"Player Opps"
				"Options Opps";
		}

		.opponents5 {
			display: grid;
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
			gap: 0px 0px;
			grid-template-areas:
				"OP0"
				"OP1"
				"OP2"
				"OP3"
				"OP4";
			grid-area: Opps;
		}
	}
</style>