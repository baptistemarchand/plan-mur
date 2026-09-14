import { getKv, kvTarget } from "./kv.ts";
import { Club, Route } from "./types.ts";

// Recharge un dump dans la base LOCALE, pour comparer l'ancienne et la
// nouvelle app sur les mêmes données. Jamais vers la prod.
if (Deno.env.get("DENO_DEPLOY") || Deno.env.get("KV_URL")) {
  console.error("Refus : cette commande ne vise que la base locale.");
  Deno.exit(1);
}

const path = Deno.args[0];
if (!path) {
  console.error("Usage: deno run -A restore-kv.ts <dump.json>");
  Deno.exit(1);
}

type Dump = {
  clubs: { key: string[]; value: Club }[];
  lines: { key: string[]; value: Route[][] }[];
};

const dump: Dump = JSON.parse(await Deno.readTextFile(path));
const kv = await getKv();

for (const prefix of ["clubs", "lines"]) {
  for await (const entry of kv.list({ prefix: [prefix] })) {
    await kv.delete(entry.key);
  }
}
for (const entry of [...dump.clubs, ...dump.lines]) {
  await kv.set(entry.key, entry.value);
}

console.log(
  `${kvTarget()} : ${dump.clubs.length} clubs et ${
    dump.lines.reduce((n, e) => n + e.value.flat().length, 0)
  } voies restaurés depuis ${path}`,
);
kv.close();
