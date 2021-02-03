<script>
	import router from 'page';

	import Home from './pages/Home.svelte';
	import Room from './pages/Room.svelte';

	let page, params;
	router('/', () => {page = Home;});
	router('/room/:id', (ctx, next) => {params = ctx.params; next();}, () => {page = Room;});

	router.start();
</script>

<svelte:component this={page} params={params}/>
