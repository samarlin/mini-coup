<script>
    import { onMount } from "svelte";
    // switch between Lobby and Game 'pages' from in here
    import Lobby from './pages/Lobby.svelte';
    import Game from './pages/Game.svelte';
    import { player } from "../stores/player.store.js";
    import { connections, joinRoom } from "../stores/connection.store.js";
    export let params;
    let page, page_params;
    
    onMount(async () => {
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
        
        page = Lobby;
    })
</script>

<svelte:component this={page} params={page_params}/>