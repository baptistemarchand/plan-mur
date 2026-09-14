<script lang="ts">
	import { getBorderColor, getInkHex, getStripesColor, getSwatch } from '$lib/domain/colors';
	import { getAuthors } from '$lib/domain/routes';
	import type { Route } from '$lib/domain/types';
	import Icon from './Icon.svelte';

	let {
		route,
		selected = false,
		variant
	}: { route: Route; selected?: boolean; variant: 'big' | 'small' } = $props();

	const big = $derived(variant === 'big');
	const gradeSize = $derived(big ? 'text-5xl' : 'text-2xl');
	const textSize = $derived(big ? 'text-xl font-semibold' : '');
	const stripes = $derived(getStripesColor(route.color));
	const authors = $derived(getAuthors(route));
</script>

<div
	class="p-2 h-full {getSwatch(route.color)} {selected
		? `border-dashed ${getBorderColor(route.color)} border-4`
		: ''}"
	style={route.toRemove
		? `background-image: repeating-linear-gradient(45deg, ${stripes}, ${stripes} 10px, rgba(0,0,0,0) 10px, rgba(0,0,0,0) 25px);`
		: ''}
>
	<div class="{gradeSize} font-semibold flex items-center gap-2">
		{route.grade}
		{#if route.toOpen}
			<Icon name="construction" color={getInkHex(route.color)} size={big ? '28px' : '18px'} />
		{/if}
	</div>
	<div class={textSize}>{route.setAt}</div>
	{#each authors as author, i (i)}
		<div class={textSize}>{author}</div>
	{/each}
</div>
