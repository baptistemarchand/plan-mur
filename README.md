# plan-mur

Gestionnaire de mur d'escalade simple, déstinés aux clubs et associations.

<img width="1024" height="605" alt="image" src="https://github.com/user-attachments/assets/da26b3d8-1035-4868-a7c8-9ca70e6e81a6" />
<img width="501" height="877" alt="image" src="https://github.com/user-attachments/assets/bb19210b-7b1b-49cd-9fcb-e2df5dd9e0e4" />
<img width="390" height="768" alt="image" src="https://github.com/user-attachments/assets/e76674a7-5a2f-48cd-b0f0-d3315248d250" />

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
