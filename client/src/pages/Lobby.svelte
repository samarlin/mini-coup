<script>
    import { createEventDispatcher, onMount } from "svelte";
    import Popup from '../components/Popup.svelte';
    import Rules from '../components/Rules.svelte';
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
    function startGame() { switching = "none"; dispatch('message', {text: 'START_GAME'}); }
    
    // get list of other players
    let player_name = '', fixed_display = true, rules, switching = "block";

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
                switching = "none";
                dispatch('message', {text: 'GAME_STARTED'});
                break;
        } 
    }

    function otherError() {
        $connections.connectionState = "Failed";
		popup_attr.message = "Room does not exist.";
		popup_attr.onSubmit = () => {$connections.router('/'); fixed_display = false; popup_attr = popup.initialData();};
		popup_attr.display = true;
    }

    function gatherName(error = false) {
		popup_attr.message = (error) ? "Name already in use, try again." : "Enter your name.";
		popup_attr.onSubmit = (name) => {player_name = name; fixed_display = false; popup_attr = popup.initialData();};
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

<Rules bind:this={rules}/>

<main style="--display: {switching}">
    <h1 on:click={() => {window.location.href = "/";}}>Mini Coup</h1>
    <h2>You're in Room {$player.room}</h2>
    <p>You'll need at least three and no more than six players to start the game.</p><br><br>
    <h2 class="h2nhalf">Players in room:</h2>
    {#if $connections.other_connections.length !== 0}
        {#each $connections.other_connections as plr}
            <Opponent name={plr} game_active={false}/>
        {/each}
    {/if}
    <hr>
    <div id="popup_adjust">
        <Popup bind:this={popup} attr={popup_attr} game_active={fixed_display}/>
    </div>
    <hr>
	{#if ($player.admin && $connections.other_connections.length > 2)}
		<button on:click={startGame}>Start Game</button>
	{/if}
    <hr>
    <button id="rules_button" on:click={()=>{rules.showRules();}}>Rules</button>
</main>

<style>
	main {
        display: var(--display);
        color: rgb(91, 91, 91);

		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
    
    button {
        color: rgb(91, 91, 91);
        margin: .5vw;
        background-size: cover;
        font-size: 1.5em;

        border-bottom: 2px solid rgba(193, 182, 159, 0.8);
        border-radius: 25px;
        outline: none;
        display: inline-block;
        background-image: url("/assets/bgs/white.jpg");
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

    #popup_adjust {
        display: flex;
        margin-right: auto;
        margin-left: auto;
        height: fit-content;
        width: fit-content;
    }

    hr {
        border: .5px solid rgba(91, 91, 91, .7);
        width: 300px;
        visibility: hidden;
    }

    #rules_button {
        font-size: 1em;
        color: rgba(91, 91, 91, 0.7);
        display: block;
        margin-left: auto;
        margin-right: auto;
        background-image: none;
        background-color: white;
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
    }
</style>