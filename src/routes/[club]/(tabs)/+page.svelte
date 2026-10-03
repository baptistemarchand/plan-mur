<script lang="ts">
  import RouteCard from '$lib/components/RouteCard.svelte'
  import {isLive, openedLines} from '$lib/domain/routes'

  let {data} = $props()

  const lines = $derived(openedLines(data.lines))
</script>

<div class="flex space-x-1 px-1 pb-3 overflow-x-auto">
  {#each lines as line, i (i)}
    <div class="shrink-0">
      <div class="text-center text-xl mb-2">{i + 1}</div>
      <div class="border border-black">
        {#each line.filter(isLive) as route (route.id)}
          <div class="w-24 h-28"><RouteCard {route} variant="small" /></div>
        {/each}
      </div>
    </div>
  {/each}
</div>
