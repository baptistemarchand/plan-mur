import { listClubs } from "../clubs.ts";

export default async function Home() {
  const clubs = await listClubs();

  return (
    <div class="flex flex-col">
      <div class="text-2xl bold text-center my-8">
        Gestion de murs d'escalade
      </div>
      {clubs.length === 0
        ? (
          <div class="text-center mx-16">
            Aucun club enregistré.
          </div>
        )
        : clubs.map((club) => (
          <a
            key={club.slug}
            href={`/${club.slug}/view`}
            class="px-4 py-2 border border-black rounded text-center mx-16"
          >
            {club.name}
          </a>
        ))}
    </div>
  );
}
