<script>
    export let name;
    import {opponents} from './player.store.js'
    import {fade} from 'svelte/transition';

    // Opponent format ref: 
    // {"Sam":{"name":"Sam","cards":2,"coins":2,"alive":true,"revealed_cards":[],
    // "pending_action":{"type":"TAKE_PRIMARY_ACTION", "reason":"whatever"},
    // "last_action":{"type":"ASSASSINATE_PLAYER","target":"Kevin"}}}
</script>

<div id="opp_info">
    <h2>{name}</h2>
    {#each Array($opponents[name].cards) as _, i}
        <img transition:fade src="assets/cards/back.png" alt="card back" width="100">
    {/each}
    {#each $opponents[name].revealed_cards as card}
        <img transition:fade src="assets/cards/{card}.png" alt="{card}" width="100">
    {/each}
    <h4>{$opponents[name].coins} coins</h4>

    {#if Object.keys($opponents[name].pending_action).length !== 0}
        <span>Awaiting resolution of {$opponents[name].pending_action.type} </span>
        {#if $opponents[name].pending_action.reason}
            <span>(reason: {$opponents[name].pending_action.reason})</span>
        {/if}
        <br>
    {/if}
    
    {#if Object.keys($opponents[name].last_action).length !== 0}
        <span>Most recent action: {$opponents[name].last_action.type} </span>
        {#if $opponents[name].last_action.target}
            <span>against {$opponents[name].last_action.target}</span>
        {/if}
    {/if}
</div>

<style>
    #opp_info {
        text-align: center;
        padding: 1em;
        margin: auto;
        width: 300px;
        background-color: rgb(250, 245, 250);
        border: thin solid darkslateblue;
        display: inline-block;
    }

    img {
        padding: .5em;
    }
</style>