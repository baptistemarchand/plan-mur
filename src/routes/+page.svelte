<script lang="ts">
  let {data} = $props()
</script>

<div class="flex flex-col">
  <div class="text-2xl bold text-center my-8">Gestion de murs d'escalade</div>
  {#if data.clubs.length === 0}
    <div class="text-center mx-16">Aucun club enregistré.</div>
  {:else}
    {#each data.clubs as club (club.slug)}
      <a href="/{club.slug}/view" class="px-4 py-2 border border-black rounded text-center mx-16">
        {club.name}
      </a>
    {/each}
  {/if}
</div>
