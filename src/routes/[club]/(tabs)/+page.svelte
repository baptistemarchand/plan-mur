<script lang="ts">
  import RouteCard from '$lib/components/RouteCard.svelte'
  import {isLive, openedLines} from '$lib/domain/routes'

  let {data} = $props()

  const lines = $derived(openedLines(data.lines))

  // La note d'une voie s'affiche au survol ou appui sur tel
  let shownNote = $state<string | null>(null)
</script>

<svelte:window
  onclick={event => {
    if (!(event.target instanceof Element && event.target.closest('[data-note]'))) {
      shownNote = null
    }
  }}
/>

<div class="flex space-x-1 px-1 pb-3 overflow-x-auto">
  {#each lines as line, i (i)}
    <div class="shrink-0">
      <div class="text-center text-xl mb-2">{i + 1}</div>
      <div class="border border-black">
        {#each line.filter(isLive) as route (route.id)}
          <div class="w-24 h-28 relative group">
            <RouteCard {route} variant="small" />
            {#if route.note}
              <button
                type="button"
                data-note
                aria-label="Note : {route.note}"
                class="absolute inset-0 w-full"
                onclick={() => (shownNote = shownNote === route.id ? null : route.id)}
              >
                <span
                  class="absolute inset-0 items-center justify-center p-1 text-center text-sm italic leading-tight wrap-anywhere overflow-hidden bg-white/95 text-black {shownNote ===
                  route.id
                    ? 'flex'
                    : 'hidden group-hover:flex'}"
                >
                  {route.note}
                </span>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
