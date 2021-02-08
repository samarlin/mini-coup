<script>
    import { fade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import {opponents, move_mappings, tenses} from '../stores/player.store.js'
    export let name, glow = false, game_active = false;
    let curr_class = (game_active) ? "in_game" : "in_lobby";
    $: glowing = (glow) ? "0px 0px 10px 0px darkslateblue" : "none";

    $: if(glow) {
        setTimeout(() => {disableGlow();}, 2500);
    }

    function disableGlow() {
        $opponents[name].just_moved = false;
    }

    // Opponent format ref: 
    // {"Sam":{"name":"Sam","cards":2,"coins":2,"alive":true,"revealed_cards":[],
    // "pending_action":{"type":"TAKE_PRIMARY_ACTION", "reason":"whatever"},
    // "last_action":{"type":"ASSASSINATE_PLAYER","target":"Kevin"}}}
</script>

<div id="opp_info" class="{curr_class}" style="--glowing: {glowing}">
    <h2>{name}</h2>
    {#if game_active}
        {#each Array($opponents[name].cards) as _, i (i)}
            <img transition:fade animate:flip src="/assets/cards/back.png" alt="card back" style="--num-images: {Array($opponents[name].cards).length + $opponents[name].revealed_cards.length};">
        {/each}
        {#each $opponents[name].revealed_cards as card, i (i)}
            <img transition:fade animate:flip src="/assets/cards/{card}.png" alt="{card}" style="--num-images: {Array($opponents[name].cards).length + $opponents[name].revealed_cards.length};">
        {/each}
        <img class="coins" src="/assets/coins/{$opponents[name].coins}.png" alt="{$opponents[name].coins} coins">

        {#if Object.keys($opponents[name].pending_action).length !== 0 && $opponents[name].alive}
            <span>Awaiting selection of 
                {#if $opponents[name].pending_action.type in $move_mappings}
                {$move_mappings[$opponents[name].pending_action.type]}{:else}
                {$opponents[name].pending_action.type}{/if}</span>
            {#if $opponents[name].pending_action.reason}
                <span>{#if $opponents[name].pending_action.reason in $move_mappings}
                    {$move_mappings[$opponents[name].pending_action.reason]}{:else}
                    {$opponents[name].pending_action.reason}{/if}</span>
            {/if}
        {/if}
        
        {#if Object.keys($opponents[name].last_action).length !== 0}
            <hr>
            <span>Recently 
                {#if $opponents[name].last_action.type in $tenses}
                {$tenses[$opponents[name].last_action.type]}
                {:else if $opponents[name].last_action.type in $move_mappings}
                {$move_mappings[$opponents[name].last_action.type]}{:else}
                {$opponents[name].last_action.type}{/if}</span>
            {#if $opponents[name].last_action.target}
                <span> {$opponents[name].last_action.target}</span>
            {/if}
        {/if}
    {/if}
</div>

<style>
    #opp_info {
        text-align: center;
        vertical-align: top;

        background-color: rgb(250, 245, 250);
        border: thin solid darkslateblue;
        border-radius: 25px;

        display: inline-block;
        margin: 1vw;

        box-shadow: var(--glowing);
        transition-property: box-shadow;
        transition-duration: 0.5s;
    }

    .in_game {
        height: 40vw;
        max-height: 325px;
        min-height: fit-content;

        padding: 1vw;

        width: 25vw;
        max-width: 300px;
    }

    .in_lobby {
        height: fit-content;
        width: fit-content;
        padding-top: .5vw;
        padding-bottom: .5vw;
        padding-left: 3vw;
        padding-right: 3vw;
    }

    .coins {
        margin: auto;
        width: 70%;
        display: block;
    }

    h2 {
        overflow-wrap: break-word;
        margin: .5vw;
    }

    hr {
        border: .5px solid darkslateblue;
    }

    img {
        padding: .5vw;
        max-width: calc(20vw / var(--num-images));
        max-height: 170px;
    }
</style>