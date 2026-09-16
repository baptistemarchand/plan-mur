<script lang="ts">
  import Breakdown from '$lib/components/Breakdown.svelte'
  import ColorChip from '$lib/components/ColorChip.svelte'
  import ErrorBox from '$lib/components/ErrorBox.svelte'
  import {isLive, openedLines, plannedRoutes, withLineIndex, type RouteWithLineIndex} from '$lib/domain/routes'
  import {byLine} from '$lib/domain/stats'
  import {getSuggestions, MAX_ROUTES_PER_LINE} from '$lib/domain/suggestions'

  let {data, form} = $props()

  const lineLabel = (route: RouteWithLineIndex): string => `ligne ${route.lineIndex + 1}`

  // « À démonter » ne parle que des voies réellement au mur : les planifiées
  // n'y sont pas encore, les supprimées n'y sont plus.
  const lines = $derived(openedLines(data.lines))
  const live = $derived(withLineIndex(lines).filter(isLive))
  const planned = $derived(plannedRoutes(data.lines))
  const suggestions = $derived(getSuggestions(lines))

  const free = $derived(planned.filter(route => !route.author).length)
</script>

<div class="bg-white text-black min-h-screen">
  <div class="p-4 flex flex-col md:flex-row md:items-start gap-x-12 gap-y-8">
    <div class="w-full max-w-2xl">
      <div class="text-2xl font-semibold">À ouvrir</div>
      <div class="text-gray-600 mt-1">
        {#if planned.length === 0}
          Rien à ouvrir pour le moment.
        {:else}
          {free} libre{free > 1 ? 's' : ''} sur {planned.length}.
        {/if}
      </div>

      {#if form?.message}
        <ErrorBox>{form.message}</ErrorBox>
      {/if}

      {#if planned.length > 0}
        <form method="post" class="mt-4">
          <label class="flex items-center gap-2">
            <span class="font-semibold whitespace-nowrap">Ton prénom</span>
            <input
              type="text"
              name="name"
              required
              maxlength="40"
              placeholder="seb bouin"
              class="border-2 border-black rounded px-2 py-1 flex-1"
            />
          </label>

          <div class="mt-4">
            {#each planned as route (route.id)}
              <div class="flex items-center gap-3 border-b border-gray-200 py-3">
                <div class="w-16">ligne {route.lineIndex + 1}</div>
                <ColorChip color={route.color} classes="w-24 text-center" />
                <div class="text-xl font-semibold w-16">{route.grade}</div>
                <div class="flex-1 text-right">
                  {#if route.author}
                    <button
                      type="submit"
                      formaction="?/release"
                      name="route"
                      value={route.id}
                      formnovalidate
                      title="Annuler cette inscription"
                      class="border border-green-600 bg-green-100 text-green-900 rounded px-3 py-2"
                    >
                      {route.author} ✕
                    </button>
                  {:else}
                    <button
                      type="submit"
                      formaction="?/take"
                      name="route"
                      value={route.id}
                      class="border-2 border-black rounded px-3 py-2 hover:bg-gray-200"
                    >
                      Je la prends
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </form>
      {/if}
    </div>

    <!-- « À démonter » est étroit et tient sur son contenu ; les deux autres
         colonnes se partagent ce qui reste. -->
    <div class="shrink-0">
      <Breakdown
        label="À démonter"
        showTotal
        routes={live.filter(route => route.toRemove)}
        getBuckets={route => [lineLabel(route)]}
        sortBy={byLine}
      />
    </div>

    <div>
      <div class="text-2xl font-semibold">Possibilités d'ouverture</div>
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
