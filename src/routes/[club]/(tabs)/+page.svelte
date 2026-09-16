<script lang="ts">
  import RouteCard from '$lib/components/RouteCard.svelte'
  import {isLive, openedLines} from '$lib/domain/routes'

  let {data} = $props()

  // Les voies planifiées ne sont pas encore posées : elles n'ont pas de place
  // au mur.
  const lines = $derived(openedLines(data.lines))
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
