<script>
	import router from 'page';

	import Home from './pages/Home.svelte';
	import Room from './pages/Room.svelte';

	import { connections } from "./stores/connection.store.js";

	let page, params;
	router('/', () => {page = Home;});
	router('/rooms/:id', (ctx, next) => {params = ctx.params; next();}, () => {page = Room;});
	router('/*', () => {page = Home;});

	router.start();
	$connections.router = router;
</script>

<svelte:component this={page} params={params}/>
