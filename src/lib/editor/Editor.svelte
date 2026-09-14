<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Club, Route } from '$lib/domain/types';
	import ActionButton from './ActionButton.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import GradePicker from './GradePicker.svelte';
	import Line from './Line.svelte';
	import LinePicker from './LinePicker.svelte';
	import PickerPopup from './PickerPopup.svelte';
	import { EditorState, setEditorState } from './state.svelte';

	let { club, lines }: { club: Club; lines: Route[][] } = $props();

	// L'éditeur s'approprie l'état au montage et devient la source de vérité :
	// les props ne sont qu'une graine. La page remonte le composant quand on
	// change de club, cf. le {#key} dans +page.svelte.
	// svelte-ignore state_referenced_locally
	const state = new EditorState(club, lines);
	setEditorState(state);

	const indicator = $derived(
		{ SAVING: 'bg-yellow-500', SAVED: 'bg-green-400', FAILED: 'bg-red-500' }[state.saveState]
	);
</script>

<div class="h-[calc(100dvh)] flex flex-col">
	{#if state.authorPopup && state.currentRoute}
		<PickerPopup
			values={state.allAuthors}
			current={state.currentRoute.author}
			placeholder="Chris Sharma"
			onpick={(author) => {
				state.updateCurrent(() => ({ author: author.toLowerCase().trim() }));
				state.authorPopup = false;
			}}
			onclose={() => (state.authorPopup = false)}
		/>
	{/if}
	{#if state.setAtPopup && state.currentRoute}
		<PickerPopup
			values={state.allSetAts}
			current={state.currentRoute.setAt}
			placeholder="jan 2020"
			onpick={(setAt) => {
				state.updateCurrent(() => ({ setAt: setAt.toLowerCase().trim() }));
				state.setAtPopup = false;
			}}
			onclose={() => (state.setAtPopup = false)}
		/>
	{/if}

	<div class="{indicator} h-1 shrink-0"></div>

	{#if state.saveState === 'FAILED'}
		<div class="bg-red-500 text-white text-center py-2 text-lg shrink-0">
			Ta dernière retouche n'a pas été enregistrée. Vérifie la connexion, puis refais-la.
		</div>
	{/if}

	<div class="basis-1/6 shrink-0"><LinePicker /></div>

	<div class="grow min-h-0 flex">
		<div class="w-2/6"><Line /></div>

		<div class="w-3/6 border-black border-r border-l">
			<div class="h-1/2"><GradePicker /></div>
			<div class="h-1/2 border-black border-t flex flex-col">
				{#if state.currentRoute}
					{@const route = state.currentRoute}
					<ActionButton
						label="Date"
						classes="bg-green-500 text-white"
						onclick={() => (state.setAtPopup = true)}
					>
						{#snippet icon()}<Icon name="calendar" color="#fff" size="30px" />{/snippet}
					</ActionButton>

					<ActionButton
						label="Ouvreur.euse"
						classes="bg-blue-500 text-white"
						onclick={() => (state.authorPopup = true)}
					>
						{#snippet icon()}<Icon name="person" color="#fff" size="30px" />{/snippet}
					</ActionButton>

					<ActionButton
						label="À démonter"
						classes="border border-yellow-500 {route.toRemove
							? 'bg-white text-yellow-500'
							: 'bg-yellow-500 text-white'}"
						onclick={() => state.updateCurrent((r) => ({ toRemove: !r.toRemove }))}
					>
						{#snippet icon()}<Icon
								name="tools"
								color={route.toRemove ? '#f59e0b' : '#fff'}
								size="30px"
							/>{/snippet}
					</ActionButton>

					<ActionButton
						label="À ouvrir"
						classes="border border-purple-600 {route.toOpen
							? 'bg-white text-purple-600'
							: 'bg-purple-600 text-white'}"
						onclick={() => state.updateCurrent((r) => ({ toOpen: !r.toOpen }))}
					>
						{#snippet icon()}<Icon
								name="construction"
								color={route.toOpen ? '#9333ea' : '#fff'}
								size="30px"
							/>{/snippet}
					</ActionButton>

					<ActionButton
						label="Supprimer"
						classes="bg-red-500 text-white"
						onclick={() => state.deleteCurrent()}
					>
						{#snippet icon()}<Icon name="trashcan" color="#fff" size="30px" />{/snippet}
					</ActionButton>
				{/if}
			</div>
		</div>

		<div class="w-1/6"><ColorPicker /></div>
	</div>
</div>
