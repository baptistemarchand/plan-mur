<script lang="ts">
  import {getColorClasses, type Color} from '$lib/domain/colors'

  let {color, classes = ''}: {color: Color; classes?: string} = $props()
</script>

<div class="border border-black rounded px-2 {getColorClasses(color)} {classes}">{color}</div>
