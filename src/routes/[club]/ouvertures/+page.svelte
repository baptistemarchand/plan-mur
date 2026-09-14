<script lang="ts">
  import ColorChip from '$lib/components/ColorChip.svelte'
  import ErrorBox from '$lib/components/ErrorBox.svelte'

  let {data, form} = $props()

  const free = $derived(data.planned.filter(route => !route.author).length)
</script>

<div class="bg-white text-black min-h-screen">
  <div class="max-w-2xl mx-auto p-4">
    <div class="text-2xl font-semibold">Voies à ouvrir</div>
    <div class="text-gray-600 mt-1">
      {#if data.planned.length === 0}
        Rien à ouvrir pour le moment.
      {:else}
        {free} libre{free > 1 ? 's' : ''} sur {data.planned.length}.
      {/if}
    </div>

    {#if form?.message}
      <ErrorBox>{form.message}</ErrorBox>
    {/if}

    {#if data.planned.length > 0}
      <form method="post" class="mt-4">
        <label class="flex items-center gap-2">
          <span class="font-semibold whitespace-nowrap">Ton prénom</span>
          <input
            type="text"
            name="name"
            required
            maxlength="40"
            placeholder="seb bouin"
            class="border-2 border-black rounded px-2 py-1 flex-1"
          />
        </label>

        <div class="mt-4">
          {#each data.planned as route (route.id)}
            <div class="flex items-center gap-3 border-b border-gray-200 py-3">
              <div class="w-16">ligne {route.lineIndex + 1}</div>
              <ColorChip color={route.color} classes="w-24 text-center" />
              <div class="text-xl font-semibold w-16">{route.grade}</div>
              <div class="flex-1 text-right">
                {#if route.author}
                  <button
                    type="submit"
                    formaction="?/release"
                    name="route"
                    value={route.id}
                    formnovalidate
                    title="Annuler cette inscription"
                    class="border border-green-600 bg-green-100 text-green-900 rounded px-3 py-2"
                  >
                    {route.author} ✕
                  </button>
                {:else}
                  <button
                    type="submit"
                    formaction="?/take"
                    name="route"
                    value={route.id}
                    class="border-2 border-black rounded px-3 py-2 hover:bg-gray-200"
                  >
                    Je la prends
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </form>
    {/if}

    <a href="/{data.club.slug}/view" class="inline-block mt-8 underline">Retour au plan du mur</a>
  </div>
</div>
