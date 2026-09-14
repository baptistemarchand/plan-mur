<script lang="ts">
  import ToggleButton from './ToggleButton.svelte'
  import {getEditorState} from './state.svelte'

  const state = getEditorState()
</script>

<div class="grid grid-cols-8 h-full gap-px bg-black border border-black">
  {#each state.lines as _, i (i)}
    <ToggleButton selected={state.selectedLine === i} classes="text-xl" onclick={() => state.selectLine(i)}>
      {i + 1}
    </ToggleButton>
  {/each}
  {#if state.canAddLine}
    <ToggleButton classes="text-xl font-bold" onclick={() => state.addLine()}>+</ToggleButton>
  {/if}
</div>
