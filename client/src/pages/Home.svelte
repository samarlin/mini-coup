<script>
    import Popup from './components/Popup.svelte';
    import {connections, joinGame} from './stores/connection.store.js';
    
    let popup_attr = {
		message: '',
		display: false,
		items: [],
		multi: false,
		alert: false,
        onSubmit: () => {}
	}

    async function createLobby(event) {
        // enter name
        // get a lobby ID
        // go to lobby URL

    }

    async function joinLobby(event) {
        // enter name, lobby ID
        // verify lobby ID
        // go to lobby URL

    }
</script>

<Popup attr={popup_attr}/>

<main>
    <h1>Welcome to Mini Coup!</h1>
    <button on:click|once={createLobby}>Create New Game</button>
    <button on:click|once={joinLobby}>Join Existing Game</button>
</main>

<style>
	main {
        color: darkslateblue;
        background-color: rgb(250, 245, 250);

		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>