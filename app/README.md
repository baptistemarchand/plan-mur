# plan-mur (SvelteKit)

Réécriture de l'app Fresh/Deno KV restée à la racine du dépôt. Les deux
coexistent jusqu'à la bascule : l'ancienne reste en production et sert de
plan de retour arrière.

## Lancer

Deux cibles, toutes deux à garder vivantes.

```
# Cloudflare, la cible de production
npm run cf:migrate -- --local        # applique migrations/*.sql à D1 local
npx wrangler d1 execute plan-mur --local --file=seeds/import.sql
npm run cf:dev                       # workerd + D1, sur le port 8787

# Node + SQLite, la cible self-host
npm run db:migrate                   # applique migrations/*.sql sur local.db
npm run build:node && DATABASE_PATH=local.db node build/index.js
```

`npm run dev` lance Vite seul, pratique pour l'UI mais sans workerd : **faire
tourner `cf:dev` avant tout déploiement**. Les deux bugs les plus coûteux de la
mise sur Cloudflare (plafond de paramètres liés de D1, module natif empaqueté)
étaient invisibles autrement.

```
npm test
npm run check                        # types
npm run cf:types                     # régénère les types des bindings
```

## Pourquoi cette stack

**SvelteKit.** Un seul modèle de composants pour les pages SSR et l'éditeur
interactif, là où la version Fresh en avait deux. Les adapters (node,
cloudflare, vercel) font que le framework n'enferme pas.

**Cloudflare Workers + D1.** Le seul hébergeur qui fournisse l'app et la base
dans la même offre gratuite, sans tiers. Le verrou que l'on quittait n'était
pas Fresh mais `Deno.openKv()` : aucune implémentation tierce, aucun protocole
standard, donc aucune sortie automatisée pour les données.

**D1 est un driver, pas une plateforme.** Le dialecte et le format sont du
SQLite : le schéma vaut pour un fichier local comme pour D1. Le seul point de
variation est l'objet `Dialect` de Kysely, dans `db/client.ts`.

**Kysely plutôt qu'un ORM.** Pas de schéma TypeScript déclaratif : les fichiers
`migrations/*.sql` font foi et s'appliquent tels quels aux deux cibles.
`db/schema.ts` est écrit à la main et doit rester synchrone avec eux.

**PDF côté client.** Workers n'a pas de système de fichiers et la génération PDF
est du CPU pur, le profil que Workers pénalise le plus. Générer dans le
navigateur supprime le problème, sort `pdf-lib` du bundle serveur, et donne le
même comportement sur toutes les cibles. `pdf-lib` et `static/garamond.ttf` ne
sont chargés qu'au clic sur le bouton.

Contrepartie assumée : plus d'URL renvoyant directement un PDF, et la page ne
fonctionne pas sans JavaScript.

## Frontières

Une dépendance plateforme n'apparaît qu'à un seul endroit.

| Dossier | Rôle |
|---|---|
| `src/lib/domain/` | TypeScript pur, testable sans base ni serveur |
| `src/lib/server/repo/` | le seul endroit où l'on écrit des requêtes |
| `src/lib/server/db/` | le seul endroit qui connaît la plateforme |

Interdits, pour que la cible self-host (adapter-node + SQLite) reste à quelques
dizaines de lignes :

- pas de `node:fs`, `Buffer`, `path` en code serveur, et ne pas activer `nodejs_compat`
- pas de KV, R2, Durable Objects, Queues
- pas de `platform.env` hors `db/client.ts`
- pas de requête hors `repo/`
- pas d'import de `lib/server/` depuis `lib/domain/`

Le repository rend du `Route[][]`, la forme historique : on normalise le
stockage sans imposer la normalisation à l'UI.

## Routes

| Route | Accès |
|---|---|
| `/` | public |
| `/[club]/view` | public |
| `/[club]/ouvertures` | public |
| `/[club]/pdf` | public |
| `/[club]/edit` | **à protéger**, remplace l'ancien `edit2` |
| `POST /[club]/sync` | **à protéger**, remplace `POST /api/sync?club=` |

L'authentification par mot de passe de club n'est pas encore branchée : les deux
routes d'édition sont ouvertes, comme dans la version Fresh. La colonne
`club.password_hash` existe déjà et vaut `'!'` après import.

## Déployer sur Cloudflare

La base D1 existe et son identifiant est dans `wrangler.jsonc`. Reste :

```
wrangler login
npm run cf:migrate -- --remote
wrangler d1 execute plan-mur --remote --file=seeds/import.sql
wrangler deploy
```

Le seed vient de `npm run db:import` sur un export KV frais, cf. plus bas. Les
mots de passe de club y valent `'!'` : l'édition est à ouvrir séparément.

Le script Worker pèse environ 180 Ko une fois compressé, police et bundle
client exclus puisqu'ils partent en assets. Vérifier la limite en vigueur sur
la documentation Cloudflare avant de s'en satisfaire.

## Migration depuis Deno KV

```
cd ..  && deno task export-kv          # dump brut, depuis l'app Fresh
cd app && npm run db:import ../export/kv-<date>.json
sqlite3 local.db < seeds/import.sql
```

L'import ne normalise qu'une chose : la casse de `setAt`, incohérente en base
alors que le filtre PDF comparait en minuscules. Il signale les identifiants
absents ou dupliqués et les couleurs inconnues.

La suppression est portée par `deleted_at` seul, nul tant que la voie est au
mur. Deno KV ne gardait qu'un booléen : les voies déjà supprimées reçoivent
l'époque Unix, qui se lit comme « supprimée, date inconnue » sans inventer une
date plausible. Les suppressions faites depuis l'éditeur portent l'heure réelle
et la gardent, même si l'éditeur renvoie le mur entier à chaque sauvegarde.

Les mots de passe importés valent `'!'` : aucun hachage ne peut correspondre.
Il faut les définir avant d'ouvrir l'accès à l'édition.
