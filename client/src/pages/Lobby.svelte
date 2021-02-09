<script>
    import { createEventDispatcher, onMount } from "svelte";
    import Popup from '../components/Popup.svelte';
    import Opponent from '../components/Opponent.svelte';
    import { player } from "../stores/player.store.js";
    import { connections } from "../stores/connection.store.js";

    let popup, popup_attr = {
            message: '',
            display: true,
            items: [],
            multi: false,
            alert: false,
            onSubmit: () => {}
        };

    const dispatch = createEventDispatcher();
    function startGame() { dispatch('message', {text: 'START_GAME'}); }
    
    // get list of other players
    let player_name = '';

    $connections.connection.onmessage = onMessage;
	function onMessage(event) {
        let message = JSON.parse(event.data);
        switch(message.type) {
            case 'JOIN_FAILED':
                if (message.reason === "name") {
                    gatherName(true);
                } else {
                    otherError();
                }
                break;

            case 'PLAYER_LEFT':
                $player.admin = message.updated_admin;
                // remove player from player list
                let idx = $connections.other_connections.indexOf(message.name);
                if (idx > -1) {
                    $connections.other_connections.splice(idx, 1);
                    $connections.other_connections = $connections.other_connections;
                }
                break;

            case 'ROOM_JOINED':
                // {type: "ROOM_JOINED", admin: isAdmin, room: message.room, players: Object.keys(rooms[message.room].players)}
                $player.admin = message.admin;
                $player.name = player_name;
                $connections.other_connections = message.players;
                $connections.connectionState = 'Joined';
                break;
            
            case 'PLAYER_JOINED':
                $connections.other_connections.push(message.name);
                $connections.other_connections = $connections.other_connections;
                break;

            case 'GAME_STARTED':
                dispatch('message', {text: 'GAME_STARTED'});
                break;
        } 
    }

    function otherError() {
        $connections.connectionState = "Failed";
		popup_attr.message = "Room does not exist.";
		popup_attr.onSubmit = () => {$connections.router('/'); popup_attr = popup.initialData();};
		popup_attr.display = true;
    }

    function gatherName(error = false) {
		popup_attr.message = (error) ? "Name already in use, try again." : "Enter your name.";
		popup_attr.onSubmit = (name) => {player_name = name; popup_attr = popup.initialData();};
        popup_attr.display = true;
        popup_attr = popup_attr;
    }

    function checkName() {
        $connections.connection.send(JSON.stringify({type: 'JOIN_ROOM', room: $player.room, name: player_name}))
    }
    
    $: if(player_name) {
        checkName();
    }

    onMount(() => {
        gatherName();
    });
</script>

<Popup bind:this={popup} attr={popup_attr}/>

<main>
    <h1>Mini Coup</h1>
    <h2>You're in Room {$player.room}</h2>
    <p>You'll need at least three and no more than six players to start the game.</p><br><br>
    <h2 class="h2nhalf">Players in room:</h2>
    {#if $connections.other_connections.length !== 0}
        {#each $connections.other_connections as plr}
            <Opponent name={plr} game_active={false}/>
        {/each}
    {/if}
    <br><br>
	{#if ($player.admin && $connections.other_connections.length > 2)}
		<button on:click={startGame}>Start Game</button>
	{/if}
</main>

<style>
	main {
        color: rgb(91, 91, 91);

		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
    
    button {
        color: rgb(91, 91, 91);
        margin: .5vw;
        border-bottom: 2px solid rgba(119, 98, 131, 0.7);;
		border-radius: 25px;
        outline: none;
        display: inline-block;
        background-image: url("/assets/bgs/rose.jpg");
        background-size: cover;
        font-size: 1.5em;
    }

    p {
        width: 300px;
        margin: auto;
    }

	h1 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
    
    .h2nhalf {
        text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
        margin-bottom: 10px;
    }
</style>