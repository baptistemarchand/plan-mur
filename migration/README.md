# Export Deno KV

Ne sert qu'à la bascule. La production tourne encore sur Deno KV et son contenu
bougera d'ici au jour J : il faudra réexporter à ce moment-là, pas se contenter
du dump de septembre.

```
cd migration
deno task export-kv                                    # base locale
KV_URL=https://api.deno.com/v2/databases/<id>/connect \
  DENO_KV_ACCESS_TOKEN=ddo_... deno task export-kv     # production
```

Le dump atterrit dans `export/`, ignoré par git : il contient les prénoms des
ouvreurs. Il se transforme ensuite en SQL avec `npm run db:import`, à la racine.

Une fois la bascule faite et la base KV fermée, ce dossier n'a plus de raison
d'être.
