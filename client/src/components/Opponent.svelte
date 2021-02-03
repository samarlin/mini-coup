<script>
    export let name, game_active = false;
    import {opponents} from '../stores/player.store.js'
    let curr_class = (game_active) ? "in_game" : "in_lobby";
    $: num_images = Array($opponents[name].cards).length + $opponents[name].revealed_cards.length;
    // Opponent format ref: 
    // {"Sam":{"name":"Sam","cards":2,"coins":2,"alive":true,"revealed_cards":[],
    // "pending_action":{"type":"TAKE_PRIMARY_ACTION", "reason":"whatever"},
    // "last_action":{"type":"ASSASSINATE_PLAYER","target":"Kevin"}}}
</script>

<div id="opp_info" class="{curr_class}">
    <h2>{name}</h2>
    {#if game_active}
        {#each Array($opponents[name].cards) as _, i}
            <img src="/assets/cards/back.png" alt="card back" style="--num-images: {num_images};">
        {/each}
        {#each $opponents[name].revealed_cards as card}
            <img src="/assets/cards/{card}.png" alt="{card}" style="--num-images: {num_images};">
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
    {/if}
</div>

<style>
    #opp_info {
        text-align: center;
        vertical-align: top;

        padding: 1em;
        margin: 1em;

        width: 300px;

        background-color: rgb(250, 245, 250);
        border: thin solid darkslateblue;
        border-radius: 25px;

        display: inline-block;
    }

    .in_game {
        height: 370px;
    }

    .in_lobby {
        height: 70px;
    }

    img {
        padding: .5em;
        max-width: calc(200px / var(--num-images));
        max-height: 170px;
    }
</style>