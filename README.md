# plan-mur

Gestion des voies de murs d'escalade.

## Initialisation du projet

Installer Deno :

```
curl -fsSL https://deno.land/install.sh | sh
export PATH="$HOME/.deno/bin:$PATH" && deno --version
```

Puis si souhaité, seeder des données fictives pour dev local

```
deno task seed      # réinitialise la base locale avec le jeu de démo
```

## Lancer le projet

```
deno task start     # serveur de dev
deno task check     # fmt, lint et types
```

## Clubs

Chaque club est une entrée `["clubs", slug]` en base, avec son nom d'affichage.
Ses voies sont stockées à part, sous `["lines", slug]`.

Les commandes ciblent la base **locale** par défaut. Pour agir sur la prod,
préfixer par `KV_URL` (l'URL de connexion de la base, visible sur
console.deno.com) et `DENO_KV_ACCESS_TOKEN` :

```
KV_URL=https://api.deno.com/v2/databases/<id>/connect \
  DENO_KV_ACCESS_TOKEN=ddo_... deno task migrate list-clubs
```

Chaque commande annonce la base qu'elle vise avant d'agir.

### Commandes métier

```
deno task migrate list-clubs                            liste les clubs (slug et nom)
deno task migrate set-club <club> <"le nom du club">    crée ou renomme un club
deno task migrate remove-club <club>                    supprime un club et ses voies (attention, irréversible)
deno task migrate import-clubs                          enregistre les clubs ayant des voies mais pas encore de nom
deno task migrate list-routes <club>                    affiche les lignes d'un club
deno task migrate regenerate-ids [club]                 réattribue un id à chaque voie
```

## Scripts one shot

### import-clubs

Les clubs existaient avant le registre, en tant que simples clés
`["lines", slug]`, on vient les créer comme entrée à part pour éviter les noms
en dur dans le code À passer une fois en prod puis supprimer

```
deno task migrate import-clubs
deno task migrate set-club picetcol Pic et col
deno task migrate set-club faverges Faverges
```

### regenerate-ids

A priori joué aant que les voies n'aient leur id propre, à supprimer maintenant
je pense ?
