import { setClub } from "./clubs.ts";
import { demo } from "./demo.ts";

if (Deno.env.get("DENO_DEPLOY")) {
  console.error(
    "Attention ne pas seed en prod",
  );
  Deno.exit(1);
}

// Réinitialise la base KV locale avec le jeu de démo

const clubs = [
  { slug: "club1", name: "Club 1" },
  { slug: "club2", name: "Club 2" },
];

const kv = await Deno.openKv();

for (const prefix of ["lines", "clubs"]) {
  for await (const entry of kv.list({ prefix: [prefix] })) {
    await kv.delete(entry.key);
    console.log(`supprimé ${JSON.stringify(entry.key)}`);
  }
}

for (const { slug, name } of clubs) {
  await setClub(slug, name);
  await kv.set(["lines", slug], demo);
  console.log(
    `Club slug ${slug}, nom "${name}" : ${demo.flat().length} voies de démo.`,
  );
}

kv.close();
