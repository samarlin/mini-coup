<script>
    import { onMount } from "svelte";
    // switch between Lobby and Game 'pages' from in here
    import Lobby from './Lobby.svelte';
    import Game from './Game.svelte';
    import { player } from "../stores/player.store.js";
    import { connections, joinRoom } from "../stores/connection.store.js";
    export let params;
    let page, page_params, interval;
    let HOST = location.origin.replace(/^http/, 'ws');
    
    function onOpen() {
		interval = setInterval(() => {$connections.connection.send(JSON.stringify({type: "PING"}));}, 20000);
    }
    
	function onClose(event) {
		clearInterval(interval);
		console.log("closed ", event.data);
    }
    
    function handleMessage(event) {
        console.log(event.detail.text);
        if (event.detail.text === "START_GAME") {
            // sent by lobby (player is admin) -- start the game
            page = Game;
        } else if (event.detail.text === "GAME_STARTED") {
            // sent by lobby via other player 
            page = Game;
        }
    }

    onMount(async () => {
        console.log($player.room, params.id);
        if($player.room && params.id !== $player.room) {
            window.location.href = "/rooms/" + $player.room;
        } else if (!$player.room) {
            // check room 
            let result = await joinRoom(params.id);
            if (result.status === 'ok' && (result.exists && result.open)) {
                $player.room = params.id;
            } else {
                $connections.connectionState = "Failed";
                window.location.href = "/";
            }          
        }
        // open websocket & join room
        $connections.connection = WebSocket(HOST);
        $connections.connection.onopen = onOpen;
        $connections.connection.onclose = onClose;
        $connections.connectionState = 'Joining';

        page = Lobby;
    });
</script>

<svelte:component this={page} params={page_params} on:message={handleMessage}/>