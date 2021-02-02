<script>
	import router from 'page';

	import Home from './pages/Home.svelte';
	import Lobby from './pages/Lobby.svelte';
	import Game from './pages/Game.svelte';

	let page, params;
	router('/', () => {page = Home;});
	router('/room/:id', (ctx, next) => {params = ctx.params; next();}, () => {page = Room;});
	router('/*', () => {page = Home;});

	router.start();
</script>

<svelte:component this={page} params={params}/>
