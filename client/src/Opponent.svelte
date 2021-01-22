<script>
    export let name;
    import {opponents} from './player.store.js'

    // Opponent format ref: 
    // {"Sam":{"name":"Sam","cards":2,"coins":2,"alive":true,
    // "pending_action":{"type":"TAKE_PRIMARY_ACTION", "reason":"whatever"},
    // "last_action":{"type":"ASSASSINATE_PLAYER","target":"Kevin"}}}
</script>

<div id="opp_info">
    <h3>{name}</h3>
    {#each Array($opponents[name].cards) as _, i}
        <img src="assets/cards/back.png" alt="card back" width="75">
    {/each}
    <h4>{$opponents[name].coins} coins</h4>

    {#if Object.keys($opponents[name].pending_action).length !== 0}
        <br>
        <span>Awaiting resolution of {$opponents[name].pending_action.type} </span>
        {#if $opponents[name].pending_action.reason}
            <span>(reason: {$opponents[name].pending_action.reason})</span>
        {/if}
    {/if}
    
    {#if Object.keys($opponents[name].last_action).length !== 0}
        <br>
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
        width: fit-content;
        background-color: rgb(250, 245, 250);
        border: thin solid darkslateblue;
        display: inline-block;
    }
</style>