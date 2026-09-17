**Kysely plutôt qu'un ORM.** Pas de schéma TypeScript déclaratif : les fichiers
`migrations/*.sql` font foi et s'appliquent tels quels à D1 comme à un fichier
SQLite. `db/schema.ts` est écrit à la main et doit rester synchrone avec eux.

**Une migration déjà appliquée quelque part ne se réécrit plus.** D1 tient sa
propre table `d1_migrations` : un fichier modifié sur place n'est pas rejoué, la
base garde l'ancien schéma et le code ne lui parle plus. C'est arrivé le 14
septembre, `0001_initial.sql` ayant été retouché après que la base distante l'eut
appliquée. Vérifier avec `wrangler d1 execute plan-mur --remote --command "select
sql from sqlite_master where name='club'"` avant de supposer quoi que ce soit.
