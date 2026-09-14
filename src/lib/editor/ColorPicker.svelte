<script lang="ts">
	import { colors, getSwatch } from '$lib/domain/colors';
	import { getEditorState } from './state.svelte';

	const state = getEditorState();
</script>

{#if state.currentRoute}
	<div class="grid grid-cols-1 h-full gap-px bg-black text-xl">
		{#each colors as color (color)}
			<button
				type="button"
				class="flex items-center justify-center {getSwatch(color)}"
				onclick={() => state.updateCurrent(() => ({ color }))}
			>
				{color}
			</button>
		{/each}
	</div>
{/if}
