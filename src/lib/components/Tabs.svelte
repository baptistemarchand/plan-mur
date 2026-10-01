<script lang="ts">
  import {page} from '$app/state'
  import type {Club} from '$lib/domain/types'

  let {club}: {club: Club} = $props()

  const TABS = [
    {label: 'plan', path: ''},
    {label: 'edit', path: '/edit'},
    {label: 'stats', path: '/stats'},
    {label: 'ouvertures', path: '/ouvertures'},
    {label: 'étiquettes', path: '/pdf'},
  ]

  const tabs = $derived(
    TABS.map(tab => ({
      label: tab.label,
      href: `/${club.slug}${tab.path}`,
      current: page.url.pathname === `/${club.slug}${tab.path}`,
    })),
  )
</script>

<div class="flex items-center gap-1 sm:gap-2 overflow-x-auto border-b border-black px-1 sm:px-2 py-2">
  {#each tabs as tab (tab.href)}
    <a
      href={tab.href}
      aria-current={tab.current ? 'page' : undefined}
      class="text-sm sm:text-xl whitespace-nowrap border border-black rounded px-1.5 sm:px-4 py-2 {tab.current
        ? 'bg-black text-white'
        : ''}"
    >
      {tab.label}
    </a>
  {/each}
</div>
