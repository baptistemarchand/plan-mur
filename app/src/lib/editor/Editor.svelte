<script lang="ts">
	import { untrack } from 'svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import Construction from '$lib/components/Construction.svelte';
	import Person from '$lib/components/Person.svelte';
	import Tools from '$lib/components/Tools.svelte';
	import Trashcan from '$lib/components/Trashcan.svelte';
	import type { Club, Route } from '$lib/domain/types';
	import ActionButton from './ActionButton.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import GradePicker from './GradePicker.svelte';
	import Line from './Line.svelte';
	import LinePicker from './LinePicker.svelte';
	import PickerPopup from './PickerPopup.svelte';
	import { EditorState, setEditorState } from './state.svelte';

	let { club, lines, revision }: { club: Club; lines: Route[][]; revision: number } = $props();

	// L'éditeur s'approprie l'état au montage et devient la source de vérité :
	// les props ne sont qu'une graine. La page remonte le composant quand on
	// change de club, cf. le {#key} dans +page.svelte.
	// svelte-ignore state_referenced_locally
	const state = new EditorState(club, lines, revision);
	setEditorState(state);

	// Seul `lines` doit déclencher une synchro : untrack garde le corps hors du
	// graphe de dépendances, sinon toute lecture réactive qu'il ferait
	// relancerait l'effet à chaque synchro et écrirait le mur en boucle.
	// Le premier passage est le rendu initial, pas une modification.
	let initial = true;
	$effect(() => {
		state.lines;
		untrack(() => {
			if (initial) {
				initial = false;
				return;
			}
			state.markDirty();
		});
	});

	const indicator = $derived(
		{
			DIRTY: 'bg-yellow-300',
			LOADING: 'bg-yellow-500',
			SYNCED: 'bg-green-400',
			CONFLICT: 'bg-red-500'
		}[state.syncState]
	);
</script>

<div class="h-[calc(100dvh)]">
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

	<div class="{indicator} h-1"></div>

	{#if state.syncState === 'CONFLICT'}
		<div class="bg-red-500 text-white text-center py-2 text-lg">
			Le mur a été modifié ailleurs. Recharge la page, tes dernières retouches ne sont pas
			enregistrées.
		</div>
	{/if}

	<div class="h-1/6"><LinePicker /></div>

	<div class="h-5/6 flex">
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
						{#snippet icon()}<Calendar color="#fff" size="30px" />{/snippet}
					</ActionButton>

					<ActionButton
						label="Ouvreur.euse"
						classes="bg-blue-500 text-white"
						onclick={() => (state.authorPopup = true)}
					>
						{#snippet icon()}<Person color="#fff" size="30px" />{/snippet}
					</ActionButton>

					<ActionButton
						label="À démonter"
						classes="border border-yellow-500 {route.toRemove
							? 'bg-white text-yellow-500'
							: 'bg-yellow-500 text-white'}"
						onclick={() => state.updateCurrent((r) => ({ toRemove: !r.toRemove }))}
					>
						{#snippet icon()}<Tools color={route.toRemove ? '#f59e0b' : '#fff'} size="30px" />{/snippet}
					</ActionButton>

					<ActionButton
						label="À ouvrir"
						classes="border border-purple-600 {route.toOpen
							? 'bg-white text-purple-600'
							: 'bg-purple-600 text-white'}"
						onclick={() => state.updateCurrent((r) => ({ toOpen: !r.toOpen }))}
					>
						{#snippet icon()}<Construction
								color={route.toOpen ? '#9333ea' : '#fff'}
								size="30px"
							/>{/snippet}
					</ActionButton>

					<ActionButton
						label="Supprimer"
						classes="bg-red-500 text-white"
						onclick={() => state.deleteCurrent()}
					>
						{#snippet icon()}<Trashcan color="#fff" size="30px" />{/snippet}
					</ActionButton>
				{/if}
			</div>
		</div>

		<div class="w-1/6"><ColorPicker /></div>
	</div>
</div>
