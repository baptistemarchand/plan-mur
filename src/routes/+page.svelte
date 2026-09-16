<script lang="ts">
  import {getColorClasses, type Color} from '$lib/domain/colors'

  let {data} = $props()

  // Écho de la palette du mur, en guise de signature visuelle.
  const accent: Color[] = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose']

  const countRoutes = (colors: {count: number}[]) => colors.reduce((total, {count}) => total + count, 0)

  const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`
</script>

<svelte:head>
  <title>plan-mur — choisir un club</title>
</svelte:head>

<div class="min-h-screen bg-stone-50 text-stone-900">
  <header class="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
    <div class="flex justify-center gap-1.5">
      {#each accent as color (color)}
        <span class="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 {getColorClasses(color)}"></span>
      {/each}
    </div>

    <h1 class="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Gestion de murs d'escalade</h1>
    <p class="mt-3 text-stone-500">Choisissez un club pour ouvrir le plan de son mur.</p>
  </header>

  <main class="mx-auto max-w-3xl px-6 pb-20">
    {#if data.clubs.length === 0}
      <div class="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
        <div class="font-semibold">Aucun club enregistré</div>
        <p class="mt-1 text-sm text-stone-500">Les clubs apparaîtront ici dès qu'ils seront créés.</p>
      </div>
    {:else}
      <ul class="grid gap-4 {data.clubs.length > 1 ? 'sm:grid-cols-2' : ''}">
        {#each data.clubs as club (club.slug)}
          {@const routeCount = countRoutes(club.colors)}
          <li>
            <a
              href="/{club.slug}/view"
              class="group block h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <div class="flex items-baseline justify-between gap-3">
                <span class="text-xl font-semibold">{club.name}</span>
                <span class="text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-stone-900">→</span>
              </div>

              <div class="mt-1 text-sm text-stone-500">
                {#if routeCount === 0}
                  Mur vide
                {:else}
                  {plural(routeCount, 'voie')} · {plural(club.sessions, 'session')} ·
                  {plural(club.authors, 'ouvreur.euse')}
                {/if}
              </div>

              <!-- Le mur en une barre : chaque couleur occupe sa part des voies posées. -->
              <div class="mt-4 flex h-3 gap-px overflow-hidden rounded-full bg-stone-200 ring-1 ring-black/10">
                {#each club.colors as { color, count } (color)}
                  <div class={getColorClasses(color)} style="flex: {count} 1 0" title="{color} : {count}"></div>
                {/each}
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
</div>
