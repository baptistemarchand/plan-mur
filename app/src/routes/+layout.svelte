<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>plan-mur</title>
</svelte:head>

{@render children()}
