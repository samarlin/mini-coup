<script>
    import { onMount } from "svelte";
    // switch between Lobby and Game 'pages' from in here
    import Lobby from './Lobby.svelte';
    import Game from './Game.svelte';
    import { player } from "../stores/player.store.js";
    import { connections, joinRoom } from "../stores/connection.store.js";
    export let params;
    let page, interval;
    let HOST = location.origin.replace(/^http/, 'ws');
    
    function onOpen() {
		interval = setInterval(() => {$connections.connection.send(JSON.stringify({type: "PING"}));}, 20000);
        $connections.interval = interval;
    }
    
	function onClose(event) {
		clearInterval(interval);
        $connections.connectionState = "Failed";
        $connections.router("/");
    }
    
    function handleMessage(event) {
        if (event.detail.text === "START_GAME") {
            // sent by lobby (player is admin) -- start the game
            $connections.connection.send(JSON.stringify({type: 'START_GAME'}));
            page = Game;
        } else if (event.detail.text === "GAME_STARTED") {
            // sent by lobby via other player 
            page = Game;
        }
    }

    onMount(async () => {
        if($player.room && params.id !== $player.room) {
            $connections.router("/rooms/" + $player.room);
        } else if (!$player.room) {
            // check room 
            let result = await joinRoom(params.id)
            if (result.status === 'ok' && (result.exists && result.open)) {
                $player.room = params.id;
                $connections.other_connections = result.curr_players;
            } else {
                $connections.connectionState = "Failed";
                $connections.router("/");
            }  
        } 
        // open websocket & join room
        $connections.connection = new WebSocket(HOST);
        $connections.connection.onopen = onOpen;
        $connections.connection.onclose = onClose;
        $connections.connectionState = 'Joining';

        page = Lobby;
    });
</script>

<svelte:component this={page} on:message={handleMessage}/>