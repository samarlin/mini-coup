<script>
    import { createEventDispatcher, onMount } from "svelte";
    import Popup from '../components/Popup.svelte';
    import Opponent from '../components/Opponent.svelte';
    import { player } from "../stores/player.store.js";
    import { connections } from "../stores/connection.store.js";

    export let params;
    let popup, popup_attr = {
            message: '',
            display: false,
            items: [],
            multi: false,
            alert: false,
            onSubmit: () => {}
    };
    let HOST = location.origin.replace(/^http/, 'ws');

    const dispatch = createEventDispatcher();
    function startGame() { dispatch('message', {text: 'START_GAME'}); }
    
    // get list of other players
    let player_name = '', player_list = [];

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
                let idx = player_list.indexOf(message.name);
                if (idx > -1)
                    player_list.splice(idx, 1);

            case 'ROOM_JOINED':
                // {type: "ROOM_JOINED", admin: isAdmin, room: message.room, players: Object.keys(rooms[message.room].players)}
                $player.admin = message.admin;
                $player.name = player_name;
                player_list = message.players;
                $connections.connectionState = 'Joined';
                break;
            
            case 'PLAYER_JOINED':
                player_list.push(message.name);
                player_list = player_list;
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
		popup_attr.message = (error) ? "Name already in use, try again:" : "Enter your name:";
		popup_attr.onSubmit = (name) => {player_name = name; popup_attr = popup.initialData();};
		popup_attr.display = true;
    }

    function checkName() {
        $connections.connection.send(JSON.stringify({type: 'JOIN_ROOM', room: $player.room, name: player_name}))
    }
    
    $: if(player_name) {
        checkName();
    }

    onMount(() => {gatherName();});
</script>

<Popup bind:this={popup} attr={popup_attr}/>

<main>
    <h1>Welcome to Mini Coup!</h1>
    <h2>You're in Room {$player.room}</h2>
    <p>You'll need at least three and no more than six players to start the game.</p><br><br>
    <h2 class="h2nhalf">Players in room:</h2>
    {#if player_list.length !== 0}
        {#each player_list as plr}
            <Opponent name={plr} game_active={false}/>
        {/each}
    {/if}
    <br><br>
	{#if ($player.admin && player_list.length > 2)}
		<button on:click={startGame}>Start Game</button>
	{/if}
</main>

<style>
	main {
        color: darkslateblue;

		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
    
    button {
        color: darkslateblue;
        margin: 2.5px;
        background-color: rgb(250, 245, 250);
        border: thin solid darkslateblue;
		border-radius: 25px;
        outline: none;
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