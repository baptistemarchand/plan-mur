import { countRoutes, deleteClub, listClubs, setClub } from "./clubs.ts";
import { getKv, kvTarget } from "./kv.ts";
import { Route } from "./types.ts";

const kv = await getKv();

const showClubs = async () => {
  const clubs = await listClubs();
  if (clubs.length === 0) {
    console.log("Aucun club enregistré.");
    return;
  }
  for (const club of clubs) {
    console.log(`${club.slug}\t${club.name}`);
  }
};

const listRoutes = async (club: string) => {
  const lines = (await kv.get<Route[][]>(["lines", club])).value;

  console.log(lines);
};

const usage = `Usage: deno task migrate <commande> [club]

  list-clubs                 liste les clubs enregistrés (slug et nom)
  set-club <club> <nom...>   crée ou renomme un club
  remove-club <club>         supprime un club et toutes ses voies (irréversible)
  list-routes <club>         affiche les lignes d'un club

Cible la base locale par défaut. Pour la prod :
  KV_URL=https://api.deno.com/v2/databases/<id>/connect \\
    DENO_KV_ACCESS_TOKEN=ddo_... deno task migrate <commande>`;

const [command, club, ...rest] = Deno.args;

console.log(`Base ciblée : ${kvTarget()}`);

const requireClub = (): string => {
  if (!club) {
    console.error(`Commande "${command}" : argument <club> manquant.\n`);
    console.error(usage);
    Deno.exit(1);
  }
  return club;
};

switch (command) {
  case "list-clubs":
    await showClubs();
    break;
  case "set-club": {
    const slug = requireClub();
    const name = rest.join(" ").trim();
    if (!name) {
      console.error(`Le nom du club est manquant.`);
      console.error(usage);
      Deno.exit(1);
    }
    await setClub(slug, name);
    console.log(`Le club ${slug} est enregistré sous le nom "${name}".`);
    break;
  }
  case "remove-club": {
    const slug = requireClub();
    const count = await countRoutes(slug);
    if (!confirm(`Supprimer le club ${slug} et ses ${count} voies ?`)) {
      console.log("Annulé.");
      break;
    }
    await deleteClub(slug);
    console.log(`Le club ${slug} et ses ${count} voies sont supprimés.`);
    break;
  }
  case "list-routes":
    await listRoutes(requireClub());
    break;
  default:
    console.log(usage);
    Deno.exit(command ? 1 : 0);
}

kv.close();
