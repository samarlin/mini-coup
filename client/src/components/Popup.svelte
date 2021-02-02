<script>
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
</script>

{#if attr.display}
    <div id="popup">
        <span>{attr.message}</span>
        <br><br>
        {#if attr.items.length !== 0 && !attr.multi}
            {#each attr.items as item}
                <button on:click={() => {
                    attr.onSubmit(item);
                    selection = '';
                }}>{item}</button>
            {/each}
        {:else if attr.multi}
            <select multiple bind:value={selection}>
                {#each attr.items as item, i}
                    <option value={i}>{item}</option>
                {/each}
            </select>
            {#if selection.length === 2}
                <button on:click={() => {
                    attr.onSubmit(selection);
                    selection = '';
                }}>Submit</button>
            {/if}
        {:else if !attr.alert}
            <input type="text" bind:this={text} bind:value={selection} pattern="[a-zA-Z0-9]{10}">
            {#if attr.error}<span>10-character limit, alphanumerics only.</span>{/if}
            <button on:click={() => {
                if(text.checkValidity()) {
                    attr.onSubmit(selection);
                    error = false;
                    selection = '';
                } else {
                    error = true;
                }
            }}>Submit</button>
        {:else}
            <button on:click={() => {
                attr.onSubmit(selection);
            }}>OK</button>
        {/if}
    </div>
{/if}

<style>
    #popup {
        position: absolute;
        top: 50%;
        left: 50%;

        transform: translateY(-50%) translateX(-50%);
        background-color: rgb(250, 245, 250);
        color: darkslateblue;

        padding: 2em;
        border: thin solid darkslateblue;
    }
</style>