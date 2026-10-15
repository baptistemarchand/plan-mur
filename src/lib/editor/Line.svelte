<script lang="ts">
  import {tick} from 'svelte'
  import RouteCard from '$lib/components/RouteCard.svelte'
  import {getEditorState} from './state.svelte'

  const editor = getEditorState()

  let list: HTMLDivElement | undefined = $state()
  let overflows = $state(false)
  let atBottom = $state(false)

  const measure = () => {
    if (!list) {
      return
    }
    overflows = list.scrollHeight > list.clientHeight + 1
    atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1
  }

  $effect(() => {
    void editor.visibleRoutes.length
    tick().then(measure)
  })

  $effect(() => {
    if (!list) {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  })

  const jump = () => list?.scrollTo({top: atBottom ? 0 : list.scrollHeight, behavior: 'smooth'})
</script>

<div class="h-full relative">
  <div class="h-full overflow-y-auto" bind:this={list} onscroll={measure}>
    {#each editor.visibleRoutes as route (route.id)}
      <button type="button" class="h-1/5 w-full block text-left" onclick={() => (editor.selectedRouteId = route.id)}>
        <RouteCard {route} selected={route.id === editor.selectedRouteId} variant="big" />
      </button>
    {/each}
    <button
      type="button"
      class="h-1/5 w-full block p-3 text-left text-5xl font-semibold"
      onclick={() => editor.addRoute()}
    >
      +
    </button>
  </div>

  {#if overflows}
    <button
      type="button"
      class="absolute bottom-3 right-3 h-12 w-12 rounded-full bg-black text-white ring-2 ring-white shadow-lg flex items-center justify-center"
      aria-label={atBottom ? 'Remonter en haut de la ligne' : 'Voir la suite de la ligne'}
      onclick={jump}
    >
      <svg
        viewBox="0 0 24 24"
        class="h-7 w-7 transition-transform {atBottom ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 4v16M5 13l7 7 7-7" />
      </svg>
    </button>
  {/if}
</div>
