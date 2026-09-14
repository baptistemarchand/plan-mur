<script lang="ts">
	import ErrorBox from '$lib/components/ErrorBox.svelte';
	import { isLive } from '$lib/domain/routes';
	import type { Route } from '$lib/domain/types';

	let { data } = $props();

	// La session retenue est dérivée, pas copiée : changer de club sans
	// remonter la page ne doit pas garder une session qui n'existe plus.
	let chosen = $state('');
	const session = $derived(data.sessions.includes(chosen) ? chosen : (data.sessions[0] ?? ''));
	let building = $state(false);
	let failure = $state('');

	// Une voie supprimée n'est plus au mur : lui imprimer une étiquette n'a
	// pas de sens. La version Fresh ne faisait pas ce tri.
	const routes = $derived(
		data.lines.flat().filter((route: Route) => isLive(route) && route.setAt === session)
	);

	const build = async () => {
		building = true;
		failure = '';
		try {
			// pdf-lib et la police ne sont chargés qu'au clic : ils pèsent plus
			// lourd que toute l'app et ne servent qu'ici.
			const [{ createLabelsPdf }, fontResponse] = await Promise.all([
				import('$lib/pdf/labels'),
				fetch('/garamond.ttf')
			]);
			if (!fontResponse.ok) {
				throw new Error('police introuvable');
			}

			const bytes = await createLabelsPdf(routes, await fontResponse.arrayBuffer());
			const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = `etiquettes-${data.club.slug}-${session.replace(/\s+/g, '-')}.pdf`;
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			failure = error instanceof Error ? error.message : String(error);
		} finally {
			building = false;
		}
	};
</script>

<div class="max-w-2xl mx-auto p-4">
	<div class="text-2xl font-semibold">Étiquettes à imprimer</div>

	{#if data.sessions.length === 0}
		<div class="text-gray-600 mt-4">
			Aucune session d'ouverture enregistrée pour ce club : il n'y a rien à imprimer.
		</div>
	{:else}
		<div class="text-gray-600 mt-1">Neuf étiquettes par page A4, à découper.</div>

		<label class="flex items-center gap-2 mt-6">
			<span class="font-semibold whitespace-nowrap">Session</span>
			<select
				value={session}
				onchange={(event) => (chosen = event.currentTarget.value)}
				class="border-2 border-black rounded px-2 py-1 flex-1"
			>
				{#each data.sessions as value (value)}
					<option {value}>{value}</option>
				{/each}
			</select>
		</label>

		<div class="mt-4">
			{routes.length} voie{routes.length > 1 ? 's' : ''} dans cette session.
		</div>

		<button
			type="button"
			disabled={building || routes.length === 0}
			onclick={build}
			class="text-xl border-2 border-black rounded px-4 py-2 mt-4 disabled:opacity-40"
		>
			{building ? 'Génération…' : 'Télécharger le PDF'}
		</button>

		{#if failure}
			<ErrorBox>Échec de la génération : {failure}</ErrorBox>
		{/if}
	{/if}

	<a href="/{data.club.slug}/view" class="inline-block mt-8 underline">Retour au plan du mur</a>
</div>
