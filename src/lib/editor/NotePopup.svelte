<script lang="ts">
  let {
    current,
    onsave,
    onclose,
  }: {
    current: string | null
    onsave: (note: string | null) => void
    onclose: () => void
  } = $props()

  // svelte-ignore state_referenced_locally
  let draft = $state(current ?? '')
  let input = $state<HTMLInputElement>()

  $effect(() => input?.focus())
</script>

<form
  class="h-full absolute w-full z-10 flex flex-col justify-center bg-white"
  onsubmit={event => {
    event.preventDefault()
    onsave(draft.trim() || null)
  }}
>
  <div class="text-2xl font-semibold text-center">Note</div>
  <input
    type="text"
    class="border-black rounded border-2 text-center mx-8 mt-4 h-12 text-2xl"
    placeholder="Départ assis, nom de voie"
    maxlength="60"
    bind:this={input}
    bind:value={draft}
  />
  <!-- Sur téléphone, les trois boutons ne tiennent pas côte à côte : on les empile. -->
  <div class="mx-8 mt-4 flex flex-col gap-3 sm:mx-auto sm:flex-row sm:gap-4">
    <button type="submit" class="text-2xl bg-green-500 sm:w-36 text-white rounded py-2 px-4">Enregistrer</button>
    {#if current}
      <button
        type="button"
        class="text-2xl bg-red-500 sm:w-36 text-white rounded py-2 px-4"
        onclick={() => onsave(null)}
      >
        Retirer
      </button>
    {/if}
    <button type="button" class="text-2xl bg-gray-500 sm:w-36 text-white rounded py-2 px-4" onclick={onclose}>
      Fermer
    </button>
  </div>
</form>
