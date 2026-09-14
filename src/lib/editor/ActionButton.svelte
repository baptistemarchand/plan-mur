<script lang="ts">
  import type {Snippet} from 'svelte'

  let {label, classes, onclick, icon}: {label: string; classes: string; onclick: () => void; icon: Snippet} = $props()
</script>

<button
  type="button"
  class="text-xl font-semibold rounded m-1 flex-1 min-h-0 flex items-center justify-center gap-1 {classes}"
  {onclick}
>
  {@render icon()}
  <div>{label}</div>
</button>
