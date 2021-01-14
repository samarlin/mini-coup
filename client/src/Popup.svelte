<script>
    export let attr = {
        message: '',
        display: 0,
        items: [],
        onSubmit: () => {}
    };

    let selection = '';
</script>

{#if attr.display}
    <div id="popup">
        <span>{attr.message}</span>
        <br><br>
        {#if attr.items.length !== 0}
            {#each attr.items as item}
                <button on:click={() => {
                    attr.onSubmit(item);
                    attr.message = '';
                    attr.items = [];
                    attr.display = 0;
                }}>{item}</button>
            {/each}
        {:else}
            <input type="text" bind:value={selection}>
            <button on:click={() => {
                attr.onSubmit(selection);
                attr.message='';
                attr.display = 0;
                attr.items = [];
            }}>Submit</button>
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

        padding: 2em;
        border: thin solid darkslateblue;
    }
</style>