<script lang="ts">
	import Breakdown from '$lib/components/Breakdown.svelte';
	import RouteCard from '$lib/components/RouteCard.svelte';
	import ColorChip from '$lib/components/ColorChip.svelte';
	import { getAuthors, isLive, openedLines, plannedRoutes, withLineIndex } from '$lib/domain/routes';
	import {
		byCountDesc,
		byLine,
		gradeBucket,
		lineLabel,
		sessionSortKey,
		UNKNOWN_SESSION
	} from '$lib/domain/stats';
	import { getSuggestions, MAX_ROUTES_PER_LINE } from '$lib/domain/suggestions';

	let { data } = $props();

	const club = $derived(data.club);
	// Les voies planifiées ne sont pas encore posées. Les supprimées, elles,
	// restent ici : les découpages par session et par ouvreur.euse les montrent,
	// barrées. `live` est le sous-ensemble réellement au mur aujourd'hui.
	const lines = $derived(openedLines(data.lines));
	const routes = $derived(withLineIndex(lines));
	const live = $derived(routes.filter(isLive));
	const planned = $derived(plannedRoutes(data.lines));
	const suggestions = $derived(getSuggestions(lines));
</script>

<div class="flex space-x-1 ml-1">
	{#each lines as line, i (i)}
		<div>
			<div class="text-center text-xl mb-2">{i + 1}</div>
			<div class="border border-black">
				{#each line.filter(isLive) as route (route.id)}
					<div class="w-24 h-28"><RouteCard {route} variant="small" /></div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<div class="flex flex-wrap gap-x-12 py-4">
	<div>
		<div class="text-3xl font-bold ml-3 mt-4 mb-2">Statistiques : {live.length} voies</div>

		<div class="mt-3">
			<Breakdown
				label="Par couleur"
				routes={live}
				getBuckets={(route) => [route.color]}
				sortBy={byCountDesc}
			/>
			<Breakdown
				label="Par cotation"
				routes={live}
				getBuckets={(route) => [gradeBucket(route.grade)]}
			/>
			<Breakdown
				label="Par session d'ouverture"
				routes={routes}
				getBuckets={(route) => [route.setAt ?? UNKNOWN_SESSION]}
				sortBy={(bucket) => sessionSortKey(bucket.label)}
			/>
			<Breakdown
				label="Par ouvreur.euse"
				routes={routes.filter((route) => route.author)}
				getBuckets={(route) => getAuthors(route).map((author) => author.trim())}
				sortBy={byCountDesc}
			/>
		</div>
	</div>

	<div>
		<div class="text-3xl font-bold ml-3 mt-4 mb-2">À faire</div>
		<Breakdown
			label="À démonter"
			showTotal
			routes={live.filter((route) => route.toRemove)}
			getBuckets={(route) => [lineLabel(route)]}
			sortBy={byLine}
		/>
		<Breakdown
			label="À ouvrir"
			showTotal
			showTaken
			routes={planned}
			getBuckets={(route) => [lineLabel(route)]}
			sortBy={byLine}
		/>
		<a
			href="/{club.slug}/ouvertures"
			class="text-xl border border-black rounded px-4 py-2 inline-block ml-3 mt-4"
		>
			OUVERTURES
		</a>

		<div class="ml-3 mt-4">
			<div class="text-xl font-semibold">Possibilités d'ouverture</div>
			<div>
				Contraintes :
				<ul>
					<li>- ne pas avoir des voies de meme couleur dans deux lignes adjacentes</li>
					<li>- {MAX_ROUTES_PER_LINE} voies max par ligne</li>
				</ul>
			</div>
			<div>(Part du principe que les voies marquées "à démonter" sont démontées)</div>
			{#each suggestions as suggestion (suggestion.color)}
				<div class="flex mt-1">
					<ColorChip color={suggestion.color} classes="mr-2" />
					{suggestion.lines.join(', ')}
				</div>
			{/each}
		</div>
	</div>
</div>

<div>
	<a
		href="/{club.slug}/pdf"
		class="text-xl border border-black rounded px-4 py-2 inline-block ml-2 my-3"
	>
		PDF
	</a>
</div>
