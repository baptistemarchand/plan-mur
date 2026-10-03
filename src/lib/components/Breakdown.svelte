<script lang="ts">
  import type {RouteWithLineIndex} from '$lib/domain/routes'
  import {bucketize, type Bucket} from '$lib/domain/stats'
  import TinyRouteCard from './TinyRouteCard.svelte'

  let {
    label = '',
    routes,
    getBuckets,
    sortBy,
    showTotal = false,
    showTaken = false,
  }: {
    label?: string
    routes: RouteWithLineIndex[]
    getBuckets: (route: RouteWithLineIndex) => string[]
    sortBy?: (bucket: Bucket<RouteWithLineIndex>) => string | number
    showTotal?: boolean
    showTaken?: boolean
  } = $props()

  const buckets = $derived(bucketize(routes, {getBuckets, sortBy}))
</script>

<div>
  {#if label}
    <div class="text-2xl font-semibold">
      {label}{showTotal ? ` (${routes.length})` : ''}
    </div>
  {/if}
  <div class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-2 gap-y-2 py-1">
    {#each buckets as bucket (bucket.label)}
      <div>{bucket.label}</div>
      <div class="flex">
        <div class="flex flex-wrap gap-y-1">
          {#each bucket.items as route}
            <TinyRouteCard {route} {showTaken} />
          {/each}
        </div>
        {#if bucket.items.length > 1}
          <div class="ml-2 shrink-0">({bucket.items.length})</div>
        {/if}
      </div>
    {/each}
  </div>
</div>
