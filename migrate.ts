import { Route } from "./types.ts";

const kv = await Deno.openKv();

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

await processAllRoutes();
