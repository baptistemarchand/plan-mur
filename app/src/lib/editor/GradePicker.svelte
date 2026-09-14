<script lang="ts">
	import ToggleButton from './ToggleButton.svelte';
	import { getEditorState } from './state.svelte';

	const state = getEditorState();
	const grade = $derived(state.currentRoute?.grade ?? '');
</script>

{#if state.currentRoute}
	<div class="grid grid-rows-4 grid-flow-col gap-px bg-black h-full text-4xl font-semibold">
		{#each [4, 5, 6, 7] as n (n)}
			<ToggleButton
				selected={grade.includes(String(n))}
				onclick={() =>
					state.updateCurrent((route) => ({ grade: route.grade.replace(/[4567]/g, String(n)) }))}
			>
				{n}
			</ToggleButton>
		{/each}
		{#each ['a', 'b', 'c'] as letter (letter)}
			<ToggleButton
				selected={grade.includes(letter)}
				onclick={() =>
					state.updateCurrent((route) => ({ grade: route.grade.replace(/[abc]/g, letter) }))}
			>
				{letter}
			</ToggleButton>
		{/each}
		<ToggleButton
			selected={grade.includes('+')}
			onclick={() =>
				state.updateCurrent((route) => ({
					grade: route.grade.includes('+') ? route.grade.replace('+', '') : `${route.grade}+`
				}))}
		>
			+
		</ToggleButton>
	</div>
{/if}
