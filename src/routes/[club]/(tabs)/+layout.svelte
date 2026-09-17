<script lang="ts">
  import {page} from '$app/state'
  import {SOURCE_URL} from '$lib/domain/source'

  let {data, children} = $props()

  // L'éditeur est plein écran : il vit hors de ce groupe et n'a donc pas la
  // barre, mais son onglet reste ici pour qu'on puisse y aller.
  const TABS = [
    {label: 'plan', path: ''},
    {label: 'edit', path: '/edit'},
    {label: 'stats', path: '/stats'},
    {label: 'ouvertures', path: '/ouvertures'},
    {label: 'étiquettes', path: '/pdf'},
  ]

  const club = $derived(data.club)
  const tabs = $derived(
    TABS.map(tab => ({
      label: tab.label,
      href: `/${club.slug}${tab.path}`,
      current: page.url.pathname === `/${club.slug}${tab.path}`,
    })),
  )
</script>

<div class="flex flex-wrap items-center gap-2 border-b border-black px-2 py-2">
  {#each tabs as tab (tab.href)}
    <a
      href={tab.href}
      aria-current={tab.current ? 'page' : undefined}
      class="text-xl border border-black rounded px-4 py-2 {tab.current ? 'bg-black text-white' : ''}"
    >
      {tab.label}
    </a>
  {/each}
</div>

{@render children()}

<footer class="px-2 py-4 text-center text-sm text-stone-400">
  <a class="underline underline-offset-2 hover:text-stone-600" href={SOURCE_URL}>Code source</a>
  &middot; AGPL-3.0
</footer>
