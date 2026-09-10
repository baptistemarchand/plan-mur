import { demo } from "./demo.ts";

// Réinitialise la base KV locale avec le jeu de démo

const clubs = ["picetcol", "faverges"];

const kv = await Deno.openKv();

for await (const entry of kv.list({ prefix: ["lines"] })) {
  await kv.delete(entry.key);
  console.log(`supprimé ${JSON.stringify(entry.key)}`);
}

for (const club of clubs) {
  await kv.set(["lines", club], demo);
  console.log(`[${club}] ${demo.flat().length} voies de démo.`);
}

kv.close();
