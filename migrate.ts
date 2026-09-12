import { Route } from "./types.ts";
import { nanoid } from "./utils.ts";

const kv = await Deno.openKv();

const processRoute = (route: Route): Route => {
  return ({
    ...route,
    id: nanoid(),
  });
};

const processClub = async (club: string, lines: Route[][]) => {
  const newLines = lines.map((routes) => routes.map(processRoute));
  await kv.set(["lines", club], newLines);
};

const processAllRoutes = async (club?: string) => {
  const entries = kv.list<Route[][]>({ prefix: ["lines"] });

  for await (const entry of entries) {
    console.log(
      `Processing club [${String(entry.key[1])}] (${
        entry.value.flatMap((x) => x).length
      } routes)`,
    );
    if (club && club !== entry.key[1]) {
      console.log("Skipping");
      continue;
    }
    await processClub(entry.key[1] as string, entry.value);
  }
};

const listClubs = async () => {
  const entries = kv.list<Route[][]>({ prefix: ["lines"] });
  for await (const entry of entries) {
    console.log(entry.key);
  }
};

const listRoutes = async (club: string) => {
  const lines = (await kv.get<Route[][]>(["lines", club])).value;

  console.log(lines);
};

const usage = `Usage: deno task migrate <commande> [club]

  list-clubs              liste les clés présentes en base
  list-routes <club>      affiche les lignes d'un club
  regenerate-ids [club]   réattribue un id à chaque voie (tous les clubs si omis)`;

const [command, club] = Deno.args;

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
    await listClubs();
    break;
  case "list-routes":
    await listRoutes(requireClub());
    break;
  case "regenerate-ids":
    await processAllRoutes(club);
    break;
  default:
    console.log(usage);
    Deno.exit(command ? 1 : 0);
}

kv.close();
