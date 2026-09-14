<script lang="ts">
  import type {RouteWithLineIndex} from '$lib/domain/routes'
  import {bucketize, type Bucket} from '$lib/domain/stats'
  import TinyRouteCard from './TinyRouteCard.svelte'

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
        <TinyRouteCard {route} {showTaken} />
      {/each}
      {#if bucket.items.length > 1}
        <div class="ml-2">({bucket.items.length})</div>
      {/if}
    </div>
  {/each}
</div>
