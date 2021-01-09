<script>
    export let message = '';
    export let validation = () => {};
    export let display = 0;
    export let onSubmit = () => {};
    let text = "";
</script>

<div style="display: {display ? 'block' : 'none'}">
<p>{message}</p>
<input type="text" on:change={e => {
    text = e.target.value;
}}>
<button on:click={() => {onSubmit(text)}}>Submit</button>
</div>
