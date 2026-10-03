<script lang="ts">
  import {tick} from 'svelte'
  import {enhance} from '$app/forms'
  import Breakdown from '$lib/components/Breakdown.svelte'
  import ColorChip from '$lib/components/ColorChip.svelte'
  import ErrorBox from '$lib/components/ErrorBox.svelte'
  import {
    isLive,
    openedLines,
    distinctValues,
    plannedRoutes,
    withLineIndex,
    type RouteWithLineIndex,
  } from '$lib/domain/routes'
  import {byLine} from '$lib/domain/stats'
  import {getSuggestions, MAX_ROUTES_PER_LINE} from '$lib/domain/suggestions'
  import PickerPopup from '$lib/editor/PickerPopup.svelte'

  let {data, form} = $props()

  const lineLabel = (route: RouteWithLineIndex): string => `ligne ${route.lineIndex + 1}`

  const lines = $derived(openedLines(data.lines))
  const live = $derived(withLineIndex(lines).filter(isLive))
  const planned = $derived(plannedRoutes(data.lines))
  const suggestions = $derived(getSuggestions(lines))

  const free = $derived(planned.filter(route => !route.author).length)
  const authors = $derived(distinctValues(data.lines, route => route.author))

  let assigning = $state<RouteWithLineIndex | null>(null)
  let picked = $state('')
  let takeForm = $state<HTMLFormElement>()

  const assign = async (name: string) => {
    picked = name
    await tick()
    takeForm?.requestSubmit()
    assigning = null
  }
</script>

<svelte:window onkeydown={event => event.key === 'Escape' && (assigning = null)} />

{#if assigning}
  <div
    class="fixed inset-0 z-10 flex flex-col bg-white text-black md:left-auto md:w-[28rem] md:border-l md:border-black"
  >
    <div class="shrink-0 flex items-center gap-3 border-b border-black p-3">
      <div>ligne {assigning.lineIndex + 1}</div>
      <ColorChip color={assigning.color} classes="w-24 text-center" />
      <div class="text-xl font-semibold">{assigning.grade}</div>
    </div>
    <div class="relative grow">
      <PickerPopup
        values={authors}
        current={null}
        placeholder="Chris Sharma"
        onpick={assign}
        onclose={() => (assigning = null)}
      />
    </div>
  </div>
{/if}

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
        <form method="post" action="?/take" bind:this={takeForm} use:enhance>
          <input type="hidden" name="route" value={assigning?.id ?? ''} />
          <input type="hidden" name="name" value={picked} />
        </form>

        <form method="post" action="?/release" use:enhance class="mt-4">
          {#each planned as route (route.id)}
            <div class="flex items-center gap-3 border-b border-gray-200 py-3">
              <div class="w-16">ligne {route.lineIndex + 1}</div>
              <ColorChip color={route.color} classes="w-24 text-center" />
              <div class="text-xl font-semibold w-16">{route.grade}</div>
              <div class="flex-1 text-right">
                {#if route.author}
                  <button
                    type="submit"
                    name="route"
                    value={route.id}
                    title="Annuler cette inscription"
                    class="border border-green-600 bg-green-100 text-green-900 rounded px-3 py-2"
                  >
                    {route.author} ✕
                  </button>
                {:else}
                  <button
                    type="button"
                    class="border-2 border-black rounded px-3 py-2 hover:bg-gray-200"
                    onclick={() => (assigning = route)}
                  >
                    Attribuer
                  </button>
                {/if}
              </div>
            </div>
          {/each}
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
