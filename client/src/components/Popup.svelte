<script>
    import {reverse} from '../stores/player.store.js'
    import {onMount} from 'svelte';
    export let game_active = false, numopps = 3;
    let curr_class = (game_active) ? "in_game" : "not_in_game";
    $: size = (numopps === 3) ? 1.1 : 1.3;

    export function initialData() {
        return {
            message: '',
            display: false,
            items: [],
            multi: false,
            alert: false,
            onSubmit: () => {}
        };
    }

    export let attr;
    export function reset() {
        this.set(attr = initialData());
    }

    export function trigger_alert(message, next_action) {
		popup_attr.message = message;
		popup_attr.alert = true;
		popup_attr.onSubmit = () => {next_action(); default_popup();};
		popup_attr.display = true;
	}

    let selection = '', text, error = false;
    function submitText() {
        if(text.checkValidity()) {
            attr.onSubmit(selection);
            error = false;
            selection = '';
        } else {
            error = true;
        }
    }

    onMount(() => {
        console.log(attr);
    });
</script>

{#if attr.display || game_active}
    <div id="popup" class="{curr_class}" style="--f_size: {size}em;">
        <div style="height: fit-content;">
            <p>{attr.message}</p>
            {#if attr.items.length !== 0 && !attr.multi}
                {#each attr.items as item}
                    <button on:click={() => {
                        attr.onSubmit(item);
                        selection = '';
                    }}>{#if item in $reverse}{$reverse[item]}{:else}{item}{/if}</button>
                {/each}
            {:else if attr.multi}
                <select multiple bind:value={selection}>
                    {#each attr.items as item, i}
                        <option value={i}>{item}</option>
                    {/each}
                </select>
                {#if selection.length === 2}
                    <br>
                    <button on:click={() => {
                        attr.onSubmit(selection);
                        selection = '';
                    }}>Submit</button>
                {/if}
            {:else if !attr.alert && attr.display}
                <input type="text" bind:this={text} bind:value={selection} pattern={"([a-zA-Z0-9]){1,10}"} on:keyup={e=>e.key==='Enter' && submitText()} autocomplete="off">
                {#if error}<br><span>10-character limit, alphanumerics only.</span><br>{/if}
                <button on:click={submitText}>Submit</button>
            {:else if attr.display}
                <button on:click={() => {
                    attr.onSubmit(selection);
                }}>OK</button>
            {/if}
        </div>
    </div>
{/if}

<style>
    #popup {
        border-radius: 25px;
    
        color: rgb(91, 91, 91);

        padding: 1em;
        text-align: center;

        background-image: url("/assets/bgs/rose.jpg");
        background-size: cover;
        border: 1px solid rgba(193, 182, 159, 0.8);
        border-bottom: 3px solid rgba(152, 144, 129, 0.8);
    }

    .in_game {
        font-size: var(--f_size);
        margin: 1vw;
        width: 100%;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .not_in_game {
        min-width: 225px;
        max-width: 30vw;

        z-index: 2;

        position: fixed;
        top: 50%;
        left: 50%;

        transform: translateY(-50%) translateX(-50%);
    }

    button {
        color: rgb(91, 91, 91);
        margin: .5em;
        background-color: white;
        border-bottom: 2px solid rgba(152, 144, 129, 0.8);
		border-radius: 25px;
        outline: none;
    }

    button:focus{
        border-bottom: 1px solid;
    }

    input[type=text], select {
        -webkit-appearance: none;
        color: rgb(91, 91, 91);
        margin: .5em;
        background-color: white;
        box-shadow: inset 0px 2px rgba(152, 144, 129, 0.8);
		border-radius: 25px;
        outline: none;
    }

    p {
        margin: .5em;
    }

    select {
        text-align: center;
        width: fit-content;
        padding-left: 1em;
        padding-right: 1em;
    }

    @media (max-aspect-ratio: 6/8) {
        button {
            color: rgb(91, 91, 91);
            margin: .2em;
        }
    }
</style>