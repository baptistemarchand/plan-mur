# plan-mur

Gestionnaire de mur d'escalade simple, déstinés aux clubs et associations.

## Stack

- Hosting : Cloudflare
- Compute : Cloudflare Workers
- DB : Cloudflare D1 (SQLite)
- ORM : Kysely

## Lancer

```
npm install
npm run cf:migrate -- --local    # applique migrations/*.sql à D1 local
npm run db:seed                  # remplit la bdd avec des datas de test
npm run dev                      # ou cf:dev pour workerd + D1
```

## Déployer sur Cloudflare

Un push sur main deploie le code.
Pour la base de donnée :

```
wrangler login
npm run cf:migrate -- --remote
```
