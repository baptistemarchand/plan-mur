<script lang="ts">
	import ToggleButton from './ToggleButton.svelte';

	// Les popups date et ouvreur étaient deux copies du même écran dans la
	// version Fresh : liste des valeurs déjà utilisées, puis saisie libre.
	let {
		values,
		current,
		placeholder,
		onpick,
		onclose
	}: {
		values: string[];
		current: string | null;
		placeholder: string;
		onpick: (value: string) => void;
		onclose: () => void;
	} = $props();

	let draft = $state('');
</script>

<div class="h-full absolute w-full">
	<div class="grid bg-black grid-rows-5 grid-flow-col gap-px h-4/5 w-full">
		{#each values as value (value)}
			<ToggleButton selected={current === value} onclick={() => onpick(value)}>
				{value}
			</ToggleButton>
		{/each}
	</div>
	<div class="bg-white flex flex-col h-2/5 border-t border-black pt-4">
		<input
			type="text"
			class="border-black rounded border-2 text-center mx-8 mt-4 h-10 text-2xl"
			{placeholder}
			bind:value={draft}
		/>
		<div class="mx-auto flex gap-4 bg-white">
			<button
				type="button"
				class="text-2xl bg-green-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
				onclick={() => {
					if (draft) {
						onpick(draft);
						draft = '';
					}
				}}
			>
				Ajouter
			</button>
			<button
				type="button"
				class="text-2xl bg-gray-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
				onclick={onclose}
			>
				Fermer
			</button>
		</div>
	</div>
</div>
