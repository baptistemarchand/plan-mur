<script lang="ts">
  import ErrorBox from '$lib/components/ErrorBox.svelte'
  import {isLive, withLineIndex} from '$lib/domain/routes'

  const ALL = ''

  let {data} = $props()

  // La session retenue est dérivée, pas copiée : changer de club sans
  // remonter la page ne doit pas garder une session qui n'existe plus.
  // Sans choix valide, on retombe sur l'export de toutes les voies au mur.
  let chosen = $state(ALL)
  const session = $derived(data.sessions.includes(chosen) ? chosen : ALL)
  let building = $state(false)
  let failure = $state('')

  // Une voie supprimée n'est plus au mur : lui imprimer une étiquette n'a
  // pas de sens. La version Fresh ne faisait pas ce tri.
  const live = $derived(withLineIndex(data.lines).filter(isLive))
  const routes = $derived(session === ALL ? live : live.filter(route => route.setAt === session))

  const build = async () => {
    building = true
    failure = ''
    try {
      // pdf-lib et la police ne sont chargés qu'au clic : ils pèsent plus
      // lourd que toute l'app et ne servent qu'ici.
      const [{createLabelsPdf}, fontResponse] = await Promise.all([import('$lib/pdf/labels'), fetch('/garamond.ttf')])
      if (!fontResponse.ok) {
        throw new Error('police introuvable')
      }

      const bytes = await createLabelsPdf(routes, await fontResponse.arrayBuffer())
      const url = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}))
      const link = document.createElement('a')
      link.href = url
      const suffix = session === ALL ? 'toutes-voies' : session.replace(/\s+/g, '-')
      link.download = `etiquettes-${data.club.slug}-${suffix}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error)
    } finally {
      building = false
    }
  }
</script>

<div class="max-w-2xl p-4">
  <div class="text-2xl font-semibold">Étiquettes à imprimer</div>

  {#if live.length === 0 && data.sessions.length === 0}
    <div class="text-gray-600 mt-1">Aucune voie au mur pour ce club : il n'y a rien à imprimer.</div>
  {:else}
    <div class="text-gray-600 mt-1">Neuf étiquettes par page A4, à découper.</div>

    <label class="flex items-center gap-2 mt-4">
      <span class="font-semibold whitespace-nowrap">Session</span>
      <select
        value={session}
        onchange={event => (chosen = event.currentTarget.value)}
        class="border-2 border-black rounded px-2 py-1 flex-1"
      >
        <option value={ALL}>Toutes voies actuelles</option>
        {#each data.sessions as value (value)}
          <option {value}>{value}</option>
        {/each}
      </select>
    </label>

    <div class="mt-4">
      {routes.length} voie{routes.length > 1 ? 's' : ''}
      {session === ALL ? 'actuellement au mur' : 'dans cette session'}.
    </div>

    <button
      type="button"
      disabled={building || routes.length === 0}
      onclick={build}
      class="text-xl border-2 border-black rounded px-4 py-2 mt-4 disabled:opacity-40"
    >
      {building ? 'Génération…' : 'Télécharger le PDF'}
    </button>

    {#if failure}
      <ErrorBox>Échec de la génération : {failure}</ErrorBox>
    {/if}
  {/if}
</div>
