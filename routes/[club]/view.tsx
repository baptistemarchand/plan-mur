import { RouteContext } from "$fresh/server.ts";
import { colors, getBg, getTextColor } from "../../colors.ts";
import { RouteCard } from "../../components/RouteCard.tsx";
import { demo } from "../../demo.ts";
import { Route } from "../../types.ts";

const Wall = ({ lines }: { lines: Route[][] }) => {
  return (
    <div class="flex space-x-2 m-3">
      {lines.map((routes, i) => (
        <div>
          <div class="text-center text-xl mb-2">{i + 1}</div>
          <div class="border border-black">
            {routes.map((route) => (
              <div class="">
                <RouteCard route={route} variant="small" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Stats = ({ lines }: { lines: Route[][] }) => {
  const allRoutes = lines.flatMap((line) => line);
  const allGrades = [4, 5, 6, 7].flatMap((n) =>
    ["a", "b", "c"].map((l) => `${n}${l}`)
  ).filter((g) => g !== "4a" && g !== "7c");
  const allSetAts = [
    ...new Set(
      allRoutes.map((route) => route.setAt),
    ),
  ].sort((a, b) => {
    if (!a) {
      return 1;
    }
    if (!b) {
      return -1;
    }
    return parseInt(a.replace(/[^0-9]/g, "")) -
      parseInt(b.replace(/[^0-9]/g, ""));
  });
  const allAuthors = [
    ...new Set(
      allRoutes.map((route) => route.author).filter(
        Boolean,
      ),
    ),
  ].sort();

  return (
    <div>
      <div class="text-xl ml-3">Nombre de voies : {allRoutes.length}</div>
      <div class="md:flex gap-10 mt-3">
        <div class="">
          <div class="text-xl ml-3 font-semibold">Par couleur</div>
          {colors.map((color) => (
            <div
              class={`flex px-2 py-1`}
            >
              {allRoutes.filter((route) => route.color === color).map((r) => (
                <div
                  class={`text-xs border border-black ml-1 w-7 rounded h-7 flex justify-center items-center ${
                    getBg(color)
                  } ${getTextColor(color)}`}
                >
                  {r.grade}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div class="">
          <div class="text-xl ml-3 font-semibold">Par cotation</div>
          {allGrades.map((grade) => (
            <div
              class={`flex px-2 py-1`}
            >
              {allRoutes.filter((route) => route.grade.startsWith(grade)).map((
                r,
              ) => (
                <div
                  class={`text-xs border border-black ml-1 rounded w-7 h-7 flex justify-center items-center ${
                    getBg(r.color)
                  } ${getTextColor(r.color)}`}
                >
                  {r.grade}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <div class="text-xl ml-3 font-semibold">
            Par session d'ouverture
          </div>
          {allSetAts.map((setAt) => (
            <div
              class={`flex px-2 py-1`}
            >
              <div class="mr-3">{setAt ?? "Inconnue"}</div>
              {allRoutes.filter((route) => route.setAt === setAt).map((
                r,
              ) => (
                <div
                  class={`text-xs border border-black ml-1 rounded w-7 h-7 flex justify-center items-center ${
                    getBg(r.color)
                  } ${getTextColor(r.color)}`}
                >
                  {r.grade}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <div class="text-xl ml-3 font-semibold">
            Par ouvreur.euse
          </div>
          {allAuthors.map((author) => (
            <div
              class={`flex px-2 py-1`}
            >
              <div class="mr-3">{author}</div>
              {allRoutes.filter((route) => route.author === author).map((
                r,
              ) => (
                <div
                  class={`text-xs border border-black ml-1 rounded w-7 h-7 flex justify-center items-center ${
                    getBg(r.color)
                  } ${getTextColor(r.color)}`}
                >
                  {r.grade}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div class="text-xl ml-3 font-semibold">
          À démonter
        </div>
        {lines.map((routes, i) =>
          routes.some((r) => r.toRemove) && (
            <div
              class={`flex px-2 py-1`}
            >
              <div class="mr-3">{i + 1}</div>
              {routes.filter((route) => route.toRemove).map((
                r,
              ) => (
                <div
                  class={`text-xs border border-black ml-1 rounded w-7 h-7 flex justify-center items-center ${
                    getBg(r.color)
                  } ${getTextColor(r.color)}`}
                >
                  {r.grade}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default async function Mur(_req: Request, ctx: RouteContext) {
  const kv = await Deno.openKv();
  const result = await kv.get<Route[][]>(["lines", ctx.params.club], {
    consistency: "eventual",
  });
  const lines = result.value ?? demo;

  return (
    <div>
      <Wall lines={lines} />
      <Stats lines={lines} />
      <div>
        {
          /* <a
          href={`/${ctx.params.club}/edit`}
          class="text-xl border border-black rounded px-4 py-2 inline-block ml-2"
        >
          EDIT
        </a> */
        }
        <a
          href={`/${ctx.params.club}/pdf`}
          class="text-xl border border-black rounded px-4 py-2 inline-block ml-2"
        >
          PDF
        </a>
      </div>
    </div>
  );
}
