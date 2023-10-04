import { Route } from "./types.ts";

const kv = await Deno.openKv();
// const kv = await Deno.openKv(
//   "https://api.deno.com/databases/4a0e1486-4bdc-4d13-af33-5d9587041906/connect",
// );

const deleteClub = async (club: string) => {
  await kv.delete(["lines", club]);
};

const processRoute = (route: Route): Route => {
  return ({
    ...route,
    setAt: route.setAt?.toLowerCase(),
  });
};

const processClub = async (club: string, lines: Route[][]) => {
  for (const routes of lines) {
    for (const route of routes) {
      route.author = route.author?.toLowerCase();
    }
  }
  const newLines = lines.map((routes) => routes.map(processRoute));
  // console.log(newLines);
  await kv.set(["lines", club], newLines);
};

const processAllRoutes = async (club?: string) => {
  const entries = kv.list<Route[][]>({ prefix: ["lines"] });

  for await (const entry of entries) {
    console.log(
      `Processing club [${entry.key[1]}] (${
        entry.value.flatMap((x) => x).length
      } routes)`,
    );
    if (club && club !== entry.key[1]) {
      console.log("Skipping");
      continue;
    }
    processClub(entry.key[1] as string, entry.value);
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

// await processAllRoutes();
// await listClubs();
await listRoutes("picetcol");
