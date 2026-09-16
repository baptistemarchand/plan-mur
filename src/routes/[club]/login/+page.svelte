<script lang="ts">
  import ErrorBox from '$lib/components/ErrorBox.svelte'

  let {data, form} = $props()
</script>

<div class="bg-white text-black min-h-screen">
  <div class="max-w-2xl mx-auto p-4">
    <div class="text-2xl font-semibold">{data.club.name}</div>

    {#if data.authenticated}
      <div class="text-gray-600 mt-1">Édition déverrouillée sur cet appareil.</div>

      <a href={data.next} class="inline-block mt-4 border-2 border-black rounded px-4 py-2">Ouvrir l'éditeur</a>

      <form method="post" action="?/logout" class="mt-4">
        <button type="submit" class="border border-black rounded px-4 py-2">Se déconnecter</button>
      </form>
    {:else}
      <div class="text-gray-600 mt-1">Le mot de passe du club est demandé pour éditer le mur.</div>

      {#if form?.message}
        <ErrorBox>{form.message}</ErrorBox>
      {/if}

      <form method="post" action="?/login" class="mt-4">
        <input type="hidden" name="next" value={data.next} />
        <label class="flex items-center gap-2">
          <span class="font-semibold whitespace-nowrap">Mot de passe</span>
          <input
            type="password"
            name="password"
            required
            autocomplete="current-password"
            class="border-2 border-black rounded px-2 py-1 flex-1"
          />
        </label>
        <button type="submit" class="mt-4 border-2 border-black rounded px-4 py-2 hover:bg-gray-200">
          Déverrouiller
        </button>
      </form>
    {/if}

    <a href="/{data.club.slug}" class="inline-block mt-8 underline">Retour au plan du mur</a>
  </div>
</div>
