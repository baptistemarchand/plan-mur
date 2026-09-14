<script lang="ts">
	import { getEditorState } from './state.svelte';

	const state = getEditorState();
	const grade = $derived(state.currentRoute?.grade ?? '');
</script>

{#if state.currentRoute}
	<div class="grid grid-rows-4 grid-flow-col gap-px bg-black h-full text-4xl font-semibold">
		{#each [4, 5, 6, 7] as n (n)}
			<button
				type="button"
				class="flex items-center justify-center {grade.includes(String(n))
					? 'bg-gray-300'
					: 'bg-white'}"
				onclick={() =>
					state.updateCurrent((route) => ({ grade: route.grade.replace(/[4567]/g, String(n)) }))}
			>
				{n}
			</button>
		{/each}
		{#each ['a', 'b', 'c'] as letter (letter)}
			<button
				type="button"
				class="flex items-center justify-center {grade.includes(letter)
					? 'bg-gray-300'
					: 'bg-white'}"
				onclick={() =>
					state.updateCurrent((route) => ({ grade: route.grade.replace(/[abc]/g, letter) }))}
			>
				{letter}
			</button>
		{/each}
		<button
			type="button"
			class="flex items-center justify-center {grade.includes('+') ? 'bg-gray-300' : 'bg-white'}"
			onclick={() =>
				state.updateCurrent((route) => ({
					grade: route.grade.includes('+')
						? route.grade.replace('+', '')
						: `${route.grade}+`
				}))}
		>
			+
		</button>
	</div>
{/if}
