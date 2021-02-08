<script>
    import {reverse} from '../stores/player.store.js'
    export let game_active = false;
    let curr_class = (game_active) ? "in_game" : "not_in_game";

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

    export let attr = initialData();
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
</script>

{#if attr.display || game_active}
    <div id="popup" class="{curr_class}">
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
        {:else if !attr.alert}
            <input type="text" bind:this={text} bind:value={selection} pattern={"([a-zA-Z0-9]){1,10}"} on:keyup={e=>e.key==='Enter' && submitText()} autofocus>
            {#if error}<br><span>10-character limit, alphanumerics only.</span><br>{/if}
            <button on:click={submitText}>Submit</button>
        {:else}
            <button on:click={() => {
                attr.onSubmit(selection);
            }}>OK</button>
        {/if}
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
        border-bottom: 3px solid rgba(119, 98, 131, 0.7);
    }

    .in_game {
        font-size: 1.2em;
        margin: 1vw;
        display: flex;
        justify-content: center;
        align-content: center;
        flex-direction: column;
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

    button, input[type=text], select {
        color: rgb(91, 91, 91);
        margin: .5em;
        background-color: white;
        border: 1px solid rgba(119, 98, 131, 0.7);;
		border-radius: 25px;
        outline: none;
    }

    p {
        margin-top: .5em;
        margin-bottom: .5em;
        margin-left: 2em;
        margin-right: 2em;
    }

    select {
        text-align: center;
        width: fit-content;
        padding-left: 2em;
        padding-right: 2em;
        -webkit-appearance: none;
    }
</style>