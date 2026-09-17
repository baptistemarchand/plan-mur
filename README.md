# plan-mur

Gestionnaire de mur d'escalade simple, destiné aux clubs et associations.

<img width="1024" height="605" alt="image" src="https://github.com/user-attachments/assets/da26b3d8-1035-4868-a7c8-9ca70e6e81a6" />
<img width="501" height="877" alt="image" src="https://github.com/user-attachments/assets/bb19210b-7b1b-49cd-9fcb-e2df5dd9e0e4" />
<img width="390" height="768" alt="image" src="https://github.com/user-attachments/assets/e76674a7-5a2f-48cd-b0f0-d3315248d250" />

Chaque club a son mur, découpé en lignes, et chaque ligne porte ses voies :
couleur, cotation, session d'ouverture, ouvreur.euse. L'application sert à
tenir cet inventaire à jour, à préparer les prochaines sessions (voies à
démonter, voies à ouvrir), à en tirer des statistiques et à imprimer les
étiquettes à coller au pied du mur.

La consultation est publique, l'édition demande le mot de passe du club.

## Stack

- Hosting : Cloudflare
- Compute : Cloudflare Workers
- DB : Cloudflare D1 (SQLite)
- ORM : Kysely

## Prérequis

Node 24 ou plus (la CI tourne sur 24). Un compte Cloudflare n'est nécessaire
que pour déployer : tout le développement se fait sur une D1 locale.

## Lancer

```
npm install
npm run cf:migrate -- --local    # applique migrations/*.sql à D1 local
npm run db:seed                  # remplit la bdd avec des datas de test
npm run dev                      # ou cf:dev pour workerd + D1
```

## Vérifier

```
npm test            # vitest
npm run check       # svelte-check
npm run format:check
```

## Créer un vrai club

Il n'y a pas d'inscription : un club s'ajoute à la main.

```
wrangler d1 execute plan-mur --remote --command \
  "INSERT INTO club (slug, name, maxLines, passwordHash, createdAt)
   VALUES ('mon-club', 'Mon club', 16, '!', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))"
```

Puis :

```
node scripts/set-password.ts mon-club '<mot-de-passe>'
wrangler d1 execute plan-mur --remote --file=seeds/password-mon-club.sql
```

## Déployer sur Cloudflare

Un push sur main déploie le code.
Pour la base de donnée :

```
wrangler login
npm run cf:migrate -- --remote
```

Pour déployer votre propre instance, remplacez dans
[`wrangler.jsonc`](wrangler.jsonc) le `name` du Worker et le `database_id`,
qui pointent vers la base de ce projet, par ceux de la D1 que vous aurez créée
(`wrangler d1 create <nom>`).

Une migration déjà appliquée ne se réécrit pas : D1 tient sa propre table
`d1_migrations` et ne rejoue pas un fichier modifié sur place. Toute évolution
du schéma passe par un nouveau fichier dans `migrations/`.

## Licence

[GNU AGPL-3.0-or-later](LICENSE).

La police [EB Garamond](https://github.com/octaviopardo/EBGaramond12)
(`static/garamond.ttf`, SemiBold 1.001), utilisée pour les étiquettes PDF, est
distribuée sous SIL Open Font License 1.1 : voir
[`static/garamond-OFL.txt`](static/garamond-OFL.txt). Sa licence est
indépendante de celle du code.
