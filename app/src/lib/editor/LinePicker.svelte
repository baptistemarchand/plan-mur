<script lang="ts">
	import { getEditorState } from './state.svelte';

	const state = getEditorState();
</script>

<div class="grid grid-cols-8 h-full gap-px bg-black border border-black">
	{#each state.lines as _, i (i)}
		<button
			type="button"
			class="flex items-center justify-center text-xl {state.selectedLine === i
				? 'bg-gray-300'
				: 'bg-white'}"
			onclick={() => state.selectLine(i)}
		>
			{i + 1}
		</button>
	{/each}
	{#if state.canAddLine}
		<button
			type="button"
			class="flex items-center justify-center bg-white text-xl font-bold"
			onclick={() => state.addLine()}
		>
			+
		</button>
	{/if}
</div>
