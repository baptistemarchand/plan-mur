<script lang="ts">
  import {tick} from 'svelte'
  import {enhance} from '$app/forms'
  import ColorChip from '$lib/components/ColorChip.svelte'
  import ErrorBox from '$lib/components/ErrorBox.svelte'
  import TinyRouteCard from '$lib/components/TinyRouteCard.svelte'
  import {
    isLive,
    openedLines,
    canonicalName,
    distinctValues,
    plannedRoutes,
    withLineIndex,
    type RouteWithLineIndex,
  } from '$lib/domain/routes'
  import {getSuggestions, MAX_ROUTES_PER_LINE} from '$lib/domain/suggestions'
  import PickerPopup from '$lib/editor/PickerPopup.svelte'

  let {data, form} = $props()

  const lines = $derived(openedLines(data.lines))
  const live = $derived(withLineIndex(lines).filter(isLive))
  const planned = $derived(plannedRoutes(data.lines))
  const suggestions = $derived(getSuggestions(lines))
  const toRemove = $derived(live.filter(route => route.toRemove))

  const free = $derived(planned.filter(route => !route.author).length)
  const authors = $derived(distinctValues(data.lines, route => route.author))

  let assigning = $state<RouteWithLineIndex | null>(null)
  let picked = $state('')
  let takeForm = $state<HTMLFormElement>()

  let confirming = $state<string | null>(null)

  const assign = async (name: string) => {
    picked = canonicalName(name, authors)
    await tick()
    takeForm?.requestSubmit()
    assigning = null
  }
</script>

<svelte:window
  onkeydown={event => {
    if (event.key === 'Escape') {
      assigning = null
      confirming = null
    }
  }}
  onclick={event => {
    if (!(event.target instanceof Element && event.target.closest('[data-confirm]'))) {
      confirming = null
    }
  }}
/>

{#if assigning}
  <button
    type="button"
    aria-label="Annuler l'attribution"
    class="fixed inset-0 z-10 hidden md:block bg-black/30 cursor-default"
    onclick={() => (assigning = null)}
  ></button>
  <div
    class="fixed inset-0 z-20 flex flex-col bg-white text-black md:left-auto md:w-[28rem] md:border-l md:border-black"
  >
    <div class="shrink-0 flex items-center gap-3 border-b border-black p-3">
      <div>ligne {assigning.lineIndex + 1}</div>
      <TinyRouteCard route={assigning} />
      <button
        type="button"
        aria-label="Annuler l'attribution"
        class="ml-auto border-2 border-black rounded w-10 h-10 text-xl hover:bg-gray-200"
        onclick={() => (assigning = null)}
      >
        ✕
      </button>
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

<div class="bg-white text-black">
  <div
    class="p-4 grid gap-x-12 gap-y-8 md:grid-cols-[repeat(2,max-content)] md:justify-start xl:grid-cols-3 xl:gap-x-16 md:items-start"
  >
    <div class="w-full md:w-[22rem] xl:w-auto xl:max-w-md">
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
            <!-- Même libellé et même pastille que la colonne « À démonter ». -->
            <div class="flex items-center gap-2 border-b border-gray-200 py-1.5">
              <div class="w-16">ligne {route.lineIndex + 1}</div>
              <TinyRouteCard {route} />
              <div class="flex-1 text-right">
                {#if route.author}
                  <button
                    type="submit"
                    name="route"
                    value={route.id}
                    title="Annuler l'inscription de {route.author}"
                    class="inline-flex w-40 items-center justify-center gap-2 border-2 border-green-600 bg-green-100 text-green-900 rounded px-3 py-1"
                  >
                    <span class="truncate">{route.author}</span>
                    <span>✕</span>
                  </button>
                {:else}
                  <button
                    type="button"
                    class="w-40 border-2 border-black rounded px-3 py-1 hover:bg-gray-200"
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

    <div class="w-full md:w-[22rem] xl:w-auto xl:max-w-md">
      <div class="text-2xl font-semibold">À démonter</div>
      <div class="text-gray-600 mt-1">
        {#if toRemove.length === 0}
          Rien à démonter pour le moment.
        {:else}
          {toRemove.length} voie{toRemove.length > 1 ? 's' : ''}.
        {/if}
      </div>

      {#if toRemove.length > 0}
        <form
          method="post"
          action="?/remove"
          class="mt-4"
          use:enhance={() =>
            async ({update}) => {
              confirming = null
              await update()
            }}
        >
          {#each toRemove as route (route.id)}
            <div class="flex items-center gap-2 border-b border-gray-200 py-1.5">
              <div class="w-16">ligne {route.lineIndex + 1}</div>
              <TinyRouteCard {route} />
              <div class="flex-1 text-right">
                {#if confirming === route.id}
                  <button
                    type="submit"
                    name="route"
                    value={route.id}
                    data-confirm
                    class="w-40 border-2 border-red-500 bg-red-500 text-white rounded px-3 py-1"
                  >
                    Confirmer
                  </button>
                {:else}
                  <button
                    type="button"
                    data-confirm
                    class="w-40 border-2 border-black rounded px-3 py-1 hover:bg-gray-200"
                    onclick={() => (confirming = route.id)}
                  >
                    Démontée
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </form>
      {/if}
    </div>

    <div>
      <div class="text-2xl font-semibold">Possibilités d'ouverture</div>
      <div class="text-gray-600 mt-1 max-w-sm">
        Pas deux fois la même couleur sur des lignes voisines, {MAX_ROUTES_PER_LINE} voies max par ligne. Les voies à démonter
        sont comptées comme démontées.
      </div>
      <div class="mt-4 grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        {#each suggestions as suggestion (suggestion.color)}
          <ColorChip color={suggestion.color} classes="w-24 text-center" />
          <div>{suggestion.lines.join(', ')}</div>
        {/each}
      </div>
    </div>
  </div>
</div>
