<script lang="ts">
  import type {Snippet} from 'svelte'

  let {label, classes, onclick, icon}: {label: string; classes: string; onclick: () => void; icon: Snippet} = $props()
</script>

<button
  type="button"
  class="text-xl font-semibold rounded m-1 px-2 flex-1 min-h-0 min-w-0 flex items-center justify-center gap-1 {classes}"
  {onclick}
>
  {@render icon()}
  <div class="truncate">{label}</div>
</button>
