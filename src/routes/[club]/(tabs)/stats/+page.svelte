<script lang="ts">
  import Breakdown from '$lib/components/Breakdown.svelte'
  import {getAuthors, isLive, openedLines, withLineIndex} from '$lib/domain/routes'
  import {byCountDesc, gradeBucket, sessionSortKey, UNKNOWN_SESSION} from '$lib/domain/stats'

  let {data} = $props()

  // Les voies planifiées ne sont pas encore posées. Les supprimées, elles,
  // restent ici : les découpages par session et par ouvreur.euse les montrent,
  // barrées. `live` est le sous-ensemble réellement au mur aujourd'hui.
  const lines = $derived(openedLines(data.lines))
  const routes = $derived(withLineIndex(lines))
  const live = $derived(routes.filter(isLive))

  // Une session dont toutes les voies ont été démontées a quand même eu lieu,
  // et son ouvreur.euse a quand même ouvert : les deux comptes partent de
  // `routes`, supprimées comprises.
  const authors = $derived(new Set(routes.flatMap(route => getAuthors(route).map(author => author.trim()))).size)
  const sessions = $derived(new Set(routes.map(route => route.setAt).filter(Boolean)).size)
</script>

<div class="p-4">
  <!-- Colonnes taillées sur leur contenu, collées à gauche : à colonnes égales,
       un grand écran creusait un trou entre elles. Elles se resserrent quand la
       place manque plutôt que de déborder. -->
  <div class="grid gap-x-12 gap-y-8 md:grid-cols-[repeat(3,minmax(0,max-content))] md:items-start md:justify-start">
    <Breakdown label="Par couleur" routes={live} getBuckets={route => [route.color]} sortBy={byCountDesc} />
    <Breakdown label="Par cotation" routes={live} getBuckets={route => [gradeBucket(route.grade)]} />

    <div>
      <div class="text-2xl font-semibold">Statistiques</div>
      <div class="py-1">Voies au mur : {live.length}</div>
      <div class="py-1">Voies ouvertes en tout : {routes.length}</div>
      <div class="py-1">Ouvreur.euses : {authors}</div>
      <div class="py-1">Sessions : {sessions}</div>
    </div>

    <Breakdown
      label="Par ouvreur.euse"
      routes={routes.filter(route => route.author)}
      getBuckets={route => getAuthors(route).map(author => author.trim())}
      sortBy={byCountDesc}
    />
    <Breakdown
      label="Par session d'ouverture"
      {routes}
      getBuckets={route => [route.setAt ?? UNKNOWN_SESSION]}
      sortBy={bucket => sessionSortKey(bucket.label)}
    />
  </div>
</div>
