<script lang="ts">
  import {getInkHex, getColorClasses} from '$lib/domain/colors'
  import {isLive} from '$lib/domain/routes'
  import type {Route} from '$lib/domain/types'

  let {route, showTaken = false}: {route: Route; showTaken?: boolean} = $props()
</script>

<div
  class="relative overflow-hidden text-xs border border-black ml-1 w-7 rounded h-7 flex justify-center items-center {getColorClasses(
    route.color,
  )} {isLive(route) ? '' : 'line-through'}"
  title={route.author}
>
  {#if showTaken && route.author}
    <div
      class="absolute top-0 left-0"
      style="border-top: 10px solid {getInkHex(route.color)}; border-right: 10px solid transparent;"
    ></div>
  {/if}
  {route.grade}
</div>
