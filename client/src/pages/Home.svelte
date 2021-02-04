<script>
    import Popup from '../components/Popup.svelte';
    import {connections, joinRoom, createRoom} from '../stores/connection.store.js';
    import {player} from '../stores/player.store.js';
    
    let lobby_id, popup;
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
		popup_attr.message = "Enter room ID:";
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
</script>

<Popup bind:this={popup} attr={popup_attr}/>

<main>
    <h1>Welcome to Mini Coup!</h1>
    <p>Select an option below to either join or start a game.</p><br>
    <p>If a friend of yours has already created a room, they can simply send you a link to it; otherwise, you can join it by entering the room's number.</p>
    <br><br>
    <button on:click={createLobby}>Create New Room</button>
    <button on:click={joinLobby_popup}>Join Existing Room</button>
</main>

<style>
	main {
        color: darkslateblue;

		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

    p {
        width: 50%;
        margin: auto;
    }

    button {
        color: darkslateblue;
        margin: 2.5px;
        background-color: rgb(250, 245, 250);
        border: thin solid darkslateblue;
		border-radius: 25px;
        outline: none;
        font-size: 1.5em;
    }

	h1 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>