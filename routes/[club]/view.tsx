import { RouteContext } from "$fresh/server.ts";
import { Color, colors, getBg, getTextColor } from "../../colors.ts";
import { RouteCard } from "../../components/RouteCard.tsx";
import { demo } from "../../demo.ts";
import { Route } from "../../types.ts";
import { getAuthors } from "../../utils.ts";

const Wall = ({ lines }: { lines: Route[][] }) => {
  return (
    <div class="flex space-x-1 ml-1">
      {lines.map((routes, i) => (
        <div>
          <div class="text-center text-xl mb-2">{i + 1}</div>
          <div class="border border-black">
            {routes.map((route) => (
              <div class="w-24 h-28">
                <RouteCard route={route} variant="small" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

type RouteWithLineIndex = Route & { lineIndex: number };

const Breakdown = (
  { label, allRoutes, getBucket, getBuckets, sortBy, showTotal }: {
    label: string;
    allRoutes: RouteWithLineIndex[];
    showTotal?: true;
    getBucket?: (r: RouteWithLineIndex) => string;
    getBuckets?: (r: RouteWithLineIndex) => string[];
    sortBy?: (
      [bucket, routes]: [string, RouteWithLineIndex[]],
    ) => string | number;
  },
) => {
  const routesByBucket: Record<string, RouteWithLineIndex[]> = {};
  for (const route of allRoutes) {
    const buckets = getBucket ? [getBucket(route)] : getBuckets!(route);
    for (const bucket of buckets) {
      if (!routesByBucket[bucket]) {
        routesByBucket[bucket] = [];
      }
      routesByBucket[bucket].push(route);
    }
  }

  const entries = Object.entries(routesByBucket);
  entries.sort((a, b) => {
    const sortKeyA = sortBy?.(a) ?? a[0];
    const sortKeyB = sortBy?.(b) ?? b[0];

    return (sortKeyA > sortKeyB) ? 1 : ((sortKeyB > sortKeyA) ? -1 : 0);
  });

  return (
    <div class="ml-3 mt-4">
      <div class="text-xl font-semibold">
        {label}
        {showTotal ? ` (${allRoutes.length})` : ""}
      </div>
      {entries.map(([bucket, routes]) => {
        return (
          <div
            class={`flex py-1`}
          >
            <div class="mr-3">{bucket}</div>
            {routes.map((r) => (
              <div
                class={`text-xs border border-black ml-1 w-7 rounded h-7 flex justify-center items-center ${
                  getBg(r.color)
                } ${getTextColor(r.color)}`}
              >
                {r.grade}
              </div>
            ))}
            {routes.length > 1
              ? (
                <div class="ml-2">
                  ({routes.length})
                </div>
              )
              : null}
          </div>
        );
      })}
    </div>
  );
};

const Stats = ({ lines }: { lines: Route[][] }) => {
  const allRoutes: RouteWithLineIndex[] = lines.flatMap((routes, index) =>
    routes.map((route) => ({
      ...route,
      lineIndex: index,
    }))
  );

  return (
    <div>
      <div class="text-xl ml-3">Nombre de voies : {allRoutes.length}</div>

      <div class="mt-3">
        <Breakdown
          label="Par couleur"
          allRoutes={allRoutes}
          getBucket={(r) => r.color}
          sortBy={([, routes]) => -routes.length}
        />
        <Breakdown
          label="Par cotation"
          allRoutes={allRoutes}
          getBucket={(r) =>
            r.grade.includes("4") ? "4" : r.grade.replace("+", "")}
        />
        <Breakdown
          label="Par session d'ouverture"
          allRoutes={allRoutes}
          getBucket={(r) => r.setAt ?? "Inconnue"}
          sortBy={([bucket]) =>
            bucket === "Inconnue"
              ? -Infinity
              : parseInt(bucket.replace(/[^0-9]/g, ""))}
        />
        <Breakdown
          label="Par ouvreur.euse"
          allRoutes={allRoutes.filter((r) => r.author)}
          sortBy={([, routes]) => -routes.length}
          getBuckets={(route) => getAuthors(route).map((a) => a.trim())}
        />
        <Breakdown
          label="À démonter"
          showTotal={true}
          allRoutes={allRoutes.filter((r) => r.toRemove)}
          getBucket={(r) => `ligne ${r.lineIndex + 1}`}
          sortBy={([, routes]) => routes[0].lineIndex}
        />
      </div>
    </div>
  );
};

const Suggestions = ({ lines }: { lines: Route[][] }) => {
  const isAvailable = (color: Color, lineIndex: number): boolean => {
    if (lineIndex < 0 || lineIndex >= lines.length) {
      return true;
    }
    return lines[lineIndex].every((route) =>
      route.color !== color || route.toRemove
    );
  };
  const canSet = (color: Color, lineIndex: number) => {
    if (lines[lineIndex].filter((r) => !r.toRemove).length >= 4) {
      return false;
    }
    return isAvailable(color, lineIndex) && isAvailable(color, lineIndex - 1) &&
      isAvailable(color, lineIndex + 1);
  };

  const suggestions: Partial<Record<Color, number[]>> = {};

  for (const color of colors) {
    for (let i = 0; i < lines.length; i++) {
      if (canSet(color, i)) {
        if (!suggestions[color]) {
          suggestions[color] = [];
        }
        suggestions[color]!.push(i + 1);
      }
    }
  }

  return (
    <div class="ml-3 mt-4">
      <div class="text-xl font-semibold">
        Possibilités d'ouverture
      </div>
      <div>
        Contraintes :
        <ul>
          <li>
            - ne pas avoir des voies de meme couleur dans deux lignes adjacentes
          </li>
          <li>- 4 voies max par ligne</li>
        </ul>
      </div>
      <div>
        (Part du principe que les voies marquées "à démonter" sont démontées)
      </div>
      {Object.entries(suggestions).map(([color, indexes]) => (
        <div class="flex mt-1">
          <div
            class={`border border-black mr-2 px-2 rounded ${
              getBg(color as Color)
            } ${getTextColor(color as Color)}`}
          >
            {color}
          </div>
          {indexes.join(", ")}
        </div>
      ))}
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
      <Suggestions lines={lines} />
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
          class="text-xl border border-black rounded px-4 py-2 inline-block ml-2 my-3"
        >
          PDF
        </a>
      </div>
    </div>
  );
}
