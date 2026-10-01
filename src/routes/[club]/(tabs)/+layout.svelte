<script lang="ts">
  import Tabs from '$lib/components/Tabs.svelte'
  import {SOURCE_URL} from '$lib/domain/source'

  let {data, children} = $props()
</script>

<!-- L'éditeur est plein écran : il vit hors de ce groupe, sans le pied de page,
     et rend lui-même la barre d'onglets. -->
<!-- La hauteur d'écran se règle ici, une fois : une page qui poserait son propre
     min-h-screen s'ajouterait à la barre et au pied, et ferait défiler dans le vide. -->
<div class="min-h-dvh flex flex-col">
  <Tabs club={data.club} />

  <div class="grow">{@render children()}</div>

  <footer class="px-2 py-4 text-center text-sm text-stone-400">
    <a class="underline underline-offset-2 hover:text-stone-600" href={SOURCE_URL}>Code source</a>
    &middot; AGPL-3.0
  </footer>
</div>
