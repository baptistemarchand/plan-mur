<script lang="ts">
  import type {Snippet} from 'svelte'

  let {children}: {children: Snippet} = $props()
</script>

<div class="mt-4 border-2 border-red-600 bg-red-50 text-red-900 rounded px-3 py-2">
  {@render children()}
</div>
