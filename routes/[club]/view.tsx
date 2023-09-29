import { RouteContext } from "$fresh/server.ts";
import { colors, getBg, getTextColor } from "../../colors.ts";
import { demo } from "../../demo.ts";
import { Route } from "../../types.ts";

const Wall = ({ lines }: { lines: Route[][] }) => {
  return (
    <div class="flex space-x-3 m-8">
      {lines.map((routes, i) => (
        <div>
          <div class="text-center text-xl mb-2">{i + 1}</div>
          <div class="border border-black">
            {routes.map((route) => (
              <div
                class={`p-3 text-center ${getBg(route.color)} ${
                  getTextColor(route.color)
                }`}
              >
                <div class="text-xl">
                  {route.grade}
                </div>
                <div class="text-xs">{route.setAtMonth} {route.setAtYear}</div>
                <div class="text-xs">{route.author}</div>
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

  return (
    <div class="">
      <div class="text-xl mt-6 ml-3">Par couleur</div>
      <div class="">
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
      <div class="text-xl mt-6 ml-3">Par cotation</div>
      <div class="">
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
    </div>
  );
};

export default async function Mur(_req: Request, ctx: RouteContext) {
  const kv = await Deno.openKv();
  const result = await kv.get<Route[][]>(["lines", ctx.params.club]);
  const lines = result.value ?? demo;

  return (
    <div>
      <Wall lines={lines} />
      <Stats lines={lines} />
      <a
        href={`/${ctx.params.club}/edit`}
        class="text-xl border border-black rounded px-4 py-2"
      >
        EDIT
      </a>
    </div>
  );
}
