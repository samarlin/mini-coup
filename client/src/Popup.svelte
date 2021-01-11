<script>
    export let message = '';
    export let validation = () => {return true};
    export let display = 0;
    export let onSubmit = () => {};
    let text = '';
    let error = false;
</script>

<div id="popup" style="display: {display ? 'block' : 'none'}">
<span class:error>{message}</span>
<br><br>
<input type="text" bind:value={text}>
<button on:click={() => {
    if(validation(text)) {
        onSubmit(text); 
        text='';
        error = false;
        display = 0;
    } else {
        error = true;
    }
    }}>Submit</button>
</div>

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

    span.error {
        color: red;
    }
</style>