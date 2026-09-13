import { countRoutes, deleteClub, listClubs, setClub } from "./clubs.ts";
import { Route } from "./types.ts";

const kv = await Deno.openKv();

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

// TODO : supprimer après usage, rattrapage historique :
// enregistre les clubs qui ont des voies en base mais pas encore de nom.
const importClubs = async () => {
  const registered = new Set((await listClubs()).map((club) => club.slug));
  const slugs: string[] = [];

  for await (const entry of kv.list<Route[][]>({ prefix: ["lines"] })) {
    const slug = String(entry.key[1]);
    if (!registered.has(slug)) {
      slugs.push(slug);
    }
  }

  if (slugs.length === 0) {
    console.log("Tous les clubs ayant des voies sont déjà enregistrés.");
    return;
  }
  for (const slug of slugs) {
    await setClub(slug, slug);
    console.log(`[${slug}] enregistré (nom à préciser avec set-club).`);
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
  import-clubs               enregistre les clubs ayant des voies mais pas de nom
  list-routes <club>         affiche les lignes d'un club`;

const [command, club, ...rest] = Deno.args;

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
  case "import-clubs":
    await importClubs();
    break;
  case "list-routes":
    await listRoutes(requireClub());
    break;
  default:
    console.log(usage);
    Deno.exit(command ? 1 : 0);
}

kv.close();
