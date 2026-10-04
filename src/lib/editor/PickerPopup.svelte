<script lang="ts">
  import ToggleButton from './ToggleButton.svelte'

  // Les popups date et ouvreur étaient deux copies du même écran dans la
  // version Fresh : liste des valeurs déjà utilisées, puis saisie libre.
  let {
    values,
    current,
    placeholder,
    onpick,
    onclose,
  }: {
    values: string[]
    current: string | null
    placeholder: string
    onpick: (value: string) => void
    onclose: () => void
  } = $props()

  let draft = $state('')
</script>

<div class="h-full absolute w-full flex flex-col">
  <div class="grow min-h-0 overflow-y-auto overscroll-contain bg-white">
    <div
      class="grid bg-black grid-cols-3 sm:grid-cols-4 md:grid-cols-5 auto-rows-[minmax(3.5rem,auto)] gap-px border-b border-black"
    >
      {#each values as value (value)}
        <ToggleButton
          selected={current === value}
          classes="min-w-0 px-2 py-1 text-center text-lg leading-tight wrap-anywhere"
          onclick={() => onpick(value)}
        >
          {value}
        </ToggleButton>
      {/each}
    </div>
  </div>
  <div class="bg-white flex flex-col shrink-0 border-t border-black pb-4">
    <input
      type="text"
      class="border-black rounded border-2 text-center mx-8 mt-4 h-10 text-2xl"
      {placeholder}
      bind:value={draft}
    />
    <div class="mx-auto flex gap-4">
      <button
        type="button"
        class="text-2xl bg-green-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
        onclick={() => {
          if (draft) {
            onpick(draft)
            draft = ''
          }
        }}
      >
        Ajouter
      </button>
      <button
        type="button"
        class="text-2xl bg-gray-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
        onclick={onclose}
      >
        Fermer
      </button>
    </div>
  </div>
</div>
