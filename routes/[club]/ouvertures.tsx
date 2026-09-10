import { Handlers, PageProps } from "$fresh/server.ts";
import { getBg, getTextColor } from "../../colors.ts";
import { demo } from "../../demo.ts";
import { Route } from "../../types.ts";

type Planned = Route & { line: number };

type Data = { club: string; planned: Planned[] };

const readLines = async (club: string) => {
  const kv = await Deno.openKv();
  return (await kv.get<Route[][]>(["lines", club])).value ?? demo;
};

const toPlanned = (lines: Route[][]): Planned[] =>
  lines.flatMap((routes, i) =>
    routes
      .filter((route) => route.toOpen && !route.deleted)
      .map((route) => ({ ...route, line: i + 1 }))
  );

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    return ctx.render({
      club: ctx.params.club,
      planned: toPlanned(await readLines(ctx.params.club)),
    });
  },

  async POST(req, ctx) {
    const club = ctx.params.club;
    const form = await req.formData();
    const take = form.get("take");
    const release = form.get("release");
    const name = String(form.get("name") ?? "").trim();

    const lines = await readLines(club);
    const next = lines.map((routes) =>
      routes.map((route) => {
        if (route.id === release) {
          return { ...route, author: undefined };
        }
        if (route.id === take && name && !route.author) {
          return { ...route, author: name.slice(0, 40) };
        }
        return route;
      })
    );

    const kv = await Deno.openKv();
    await kv.set(["lines", club], next);

    // PRG : un rafraîchissement ne rejoue pas le formulaire.
    return new Response(null, {
      status: 303,
      headers: { location: `/${club}/ouvertures` },
    });
  },
};

export default function Ouvertures({ data }: PageProps<Data>) {
  const { club, planned } = data;
  const libres = planned.filter((r) => !r.author).length;

  return (
    <div class="bg-white text-black min-h-screen">
      <div class="max-w-2xl mx-auto p-4">
        <div class="text-2xl font-semibold">Voies à ouvrir</div>
        <div class="text-gray-600 mt-1">
          {planned.length === 0
            ? "Rien à ouvrir pour le moment."
            : `${libres} libre${libres > 1 ? "s" : ""} sur ${planned.length}.`}
        </div>

        {planned.length > 0 && (
          <form method="post" class="mt-4">
            <label class="flex items-center gap-2">
              <span class="font-semibold whitespace-nowrap">Ton prénom</span>
              <input
                type="text"
                name="name"
                required
                maxLength={40}
                placeholder="quentin"
                class="border-2 border-black rounded px-2 py-1 flex-1"
              />
            </label>

            <div class="mt-4">
              {planned.map((route) => (
                <div
                  key={route.id}
                  class="flex items-center gap-3 border-b border-gray-200 py-3"
                >
                  <div class="w-16">ligne {route.line}</div>
                  <div
                    class={`border border-black rounded px-2 w-24 text-center ${
                      getBg(route.color)
                    } ${getTextColor(route.color)}`}
                  >
                    {route.color}
                  </div>
                  <div class="text-xl font-semibold w-16">{route.grade}</div>
                  <div class="flex-1 text-right">
                    {route.author
                      ? (
                        <button
                          type="submit"
                          name="release"
                          value={route.id}
                          formNoValidate
                          title="Annuler cette inscription"
                          class="border border-green-600 bg-green-100 text-green-900 rounded px-3 py-2"
                        >
                          {route.author} ✕
                        </button>
                      )
                      : (
                        <button
                          type="submit"
                          name="take"
                          value={route.id}
                          class="border-2 border-black rounded px-3 py-2 hover:bg-gray-200"
                        >
                          Je la prends
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </form>
        )}

        <a href={`/${club}/view`} class="inline-block mt-8 underline">
          Retour au plan du mur
        </a>
      </div>
    </div>
  );
}
