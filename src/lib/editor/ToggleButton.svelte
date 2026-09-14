<script lang="ts">
  import type {Snippet} from 'svelte'

  // Tous les sélecteurs de l'éditeur ont le même bouton : un carré centré,
  // gris quand il porte la valeur courante.
  let {
    selected = false,
    classes = '',
    onclick,
    children,
  }: {
    selected?: boolean
    classes?: string
    onclick: () => void
    children: Snippet
  } = $props()
</script>

<button
  type="button"
  class="flex items-center justify-center {selected ? 'bg-gray-300' : 'bg-white'} {classes}"
  {onclick}
>
  {@render children()}
</button>
