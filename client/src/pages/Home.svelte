<script>
    import { onMount } from 'svelte';
    import Popup from '../components/Popup.svelte';
    import Rules from '../components/Rules.svelte';
    import {connections, joinRoom, createRoom} from '../stores/connection.store.js';
    import {player} from '../stores/player.store.js';
    
    let lobby_id, popup, display_rules = false;
    let popup_attr = {
		message: '',
		display: false,
		items: [],
		multi: false,
		alert: false,
        onSubmit: () => {}
    }

    function createLobby(event) {
        // get a room ID
        createRoom().then(result => {
            if (result.status === 'ok') {
                $player.room = result.room;
                
                // go to room URL
                $connections.router("/rooms/" + result.room);
            } else {
                popup_attr.message = "Connection failure, please try again.";
                popup_attr.alert = true;
                popup_attr.onSubmit = () => {popup_attr = popup.initialData();};
                popup_attr.display = true;
            }	
        });
    }

    function joinLobby_popup(event) {
        // enter room ID
		popup_attr.message = "Enter room ID";
		popup_attr.onSubmit = (id) => {lobby_id = id; popup_attr = popup.initialData();};
		popup_attr.display = true;
    }

    $: if(lobby_id) {
        joinLobby();
    }

    async function joinLobby() {
        // verify lobby ID
        let result = await joinRoom(lobby_id);
        if (result.status === 'ok') {
            if(result.exists && result.open) {
                $player.room = lobby_id;
                $connections.other_connections = result.curr_players;
                // go to room
                $connections.router("/rooms/" + lobby_id);
            } else {
                popup_attr.message = "Room does not exist or is not open.";
                popup_attr.alert = true;
                popup_attr.onSubmit = () => {popup_attr = popup.initialData();};
                popup_attr.display = true;
            }
        } else {
            popup_attr.message = "Connection failure, please try again.";
            popup_attr.alert = true;
            popup_attr.onSubmit = () => {popup_attr = popup.initialData();};
            popup_attr.display = true;
        }
    }

    onMount(() => {
        if($connections.connectionState === "Failed") {
            popup_attr.message = "Connection failure, please try again.";
            popup_attr.alert = true;
            popup_attr.onSubmit = () => {popup_attr = popup.initialData();};
            popup_attr.display = true;
        }
    });
</script>

<Popup bind:this={popup} attr={popup_attr}/>
<Rules display_active={display_rules}/>

<main>
    <h1 on:click={() => {window.location.href = "/";}}>Mini Coup</h1>
    <p>Select an option below to either join or start a game.</p><br>
    <p>If a friend of yours has already created a game room, they can simply send you a link to it; you can alternatively join using the room's number.</p>
    <br><br>
    <button on:click={createLobby}>Create New Room</button>
    <hr>
    <button on:click={joinLobby_popup}>Join Existing Room</button>
    <hr>
    <hr>
    <button id="rules_button" on:click={()=>{display_rules=true;}}>Rules</button>
</main>

<style>
	main {
        color: rgb(91, 91, 91);

		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

    p {
        width: 50%;
        margin: auto;
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

	h1 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
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
    
        p {
            width: 300px;
            margin: auto;
        }
    }
</style>