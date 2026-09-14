<script lang="ts">
  import {getInkHex, getSwatch} from '$lib/domain/colors'
  import {isLive, type RouteWithLineIndex} from '$lib/domain/routes'
  import {bucketize, type Bucket} from '$lib/domain/stats'

  let {
    label,
    routes,
    getBuckets,
    sortBy,
    showTotal = false,
    showTaken = false,
  }: {
    label: string
    routes: RouteWithLineIndex[]
    getBuckets: (route: RouteWithLineIndex) => string[]
    sortBy?: (bucket: Bucket<RouteWithLineIndex>) => string | number
    showTotal?: boolean
    showTaken?: boolean
  } = $props()

  const buckets = $derived(bucketize(routes, {getBuckets, sortBy}))
</script>

<div class="ml-3 mt-4">
  <div class="text-xl font-semibold">
    {label}{showTotal ? ` (${routes.length})` : ''}
  </div>
  {#each buckets as bucket (bucket.label)}
    <div class="flex py-1">
      <div class="mr-3">{bucket.label}</div>
      {#each bucket.items as route}
        <div
          class="relative overflow-hidden text-xs border border-black ml-1 w-7 rounded h-7 flex justify-center items-center {getSwatch(
            route.color,
          )} {isLive(route) ? '' : 'line-through'} {showTaken && route.author ? 'cursor-help' : ''}"
          title={showTaken ? route.author : undefined}
        >
          {#if showTaken && route.author}
            <div
              class="absolute top-0 left-0"
              style="border-top: 10px solid {getInkHex(route.color)}; border-right: 10px solid transparent;"
            ></div>
          {/if}
          {route.grade}
        </div>
      {/each}
      {#if bucket.items.length > 1}
        <div class="ml-2">({bucket.items.length})</div>
      {/if}
    </div>
  {/each}
</div>
