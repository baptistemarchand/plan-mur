<script lang="ts">
	import RouteCard from '$lib/components/RouteCard.svelte';
	import { getEditorState } from './state.svelte';

	const state = getEditorState();
</script>

<div class="h-full">
	{#each state.visibleRoutes as route (route.id)}
		<button
			type="button"
			class="h-1/5 w-full block text-left"
			onclick={() => (state.selectedRouteId = route.id)}
		>
			<RouteCard {route} selected={route.id === state.selectedRouteId} variant="big" />
		</button>
	{/each}
	{#if state.canAddRoute}
		<button type="button" class="p-3 h-full text-5xl font-semibold" onclick={() => state.addRoute()}>
			+
		</button>
	{/if}
</div>
