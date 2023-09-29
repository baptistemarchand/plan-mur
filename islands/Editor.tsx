import { colors, getBg, getBorderColor, getTextColor } from "../colors.ts";
import { authors, Grade, Route } from "../types.ts";
import type { Signal } from "@preact/signals";
import { useSignal } from "@preact/signals";

const LinePicker = (
  { selectedLine, selectedRoute }: {
    selectedLine: Signal<number>;
    selectedRoute: Signal<number>;
  },
) => {
  return (
    <div class="grid grid-cols-8 h-full gap-px bg-black border border-black">
      {[...Array(16).keys()].map((i) => (
        <div
          class={`flex items-center justify-center bg-white text-xl ${
            selectedLine.value === i ? "bg-gray-300" : ""
          }`}
          onClick={() => {
            selectedLine.value = i;
            selectedRoute.value = 0;
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
};

const GradePicker = (
  { lines, selectedLine, selectedRoute }: {
    lines: Signal<Route[][]>;
    selectedLine: Signal<number>;
    selectedRoute: Signal<number>;
  },
) => {
  const currentRoute = lines.value[selectedLine.value][selectedRoute.value];
  if (!currentRoute) {
    return null;
  }
  return (
    <div class="grid grid-rows-4 grid-flow-col gap-px bg-black border border-black h-full text-3xl font-semibold">
      {[4, 5, 6, 7].map((n) => (
        <div
          class={`flex items-center justify-center bg-white ${
            currentRoute.grade.includes(n.toString())
              ? "bg-gray-300"
              : "bg-white"
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route, j) =>
                  j === selectedRoute.value
                    ? {
                      ...route,
                      grade: route.grade.replace(
                        /[4567]/g,
                        n.toString(),
                      ) as Grade,
                    }
                    : route
                )
                : routes
            );
          }}
        >
          {n}
        </div>
      ))}
      {["a", "b", "c"].map((l) => (
        <div
          class={`flex items-center justify-center bg-white ${
            currentRoute.grade.includes(l) ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route, j) =>
                  j === selectedRoute.value
                    ? {
                      ...route,
                      grade: route.grade.replace(
                        /[abc]/g,
                        l,
                      ) as Grade,
                    }
                    : route
                )
                : routes
            );
          }}
        >
          {l}
        </div>
      ))}
      <div
        class={`flex items-center justify-center  ${
          currentRoute.grade.includes("+") ? "bg-gray-300" : "bg-white"
        }`}
        onClick={() => {
          lines.value = lines.value.map((routes, i) =>
            i === selectedLine.value
              ? routes.map((route, j) =>
                j === selectedRoute.value
                  ? {
                    ...route,
                    grade: (route.grade.includes("+")
                      ? route.grade.replace("+", "")
                      : `${route.grade}+`) as Grade,
                  }
                  : route
              )
              : routes
          );
        }}
      >
        +
      </div>
    </div>
  );
};

const ColorPicker = (
  { lines, selectedLine, selectedRoute }: {
    lines: Signal<Route[][]>;
    selectedLine: Signal<number>;
    selectedRoute: Signal<number>;
  },
) => {
  const currentRoute = lines.value[selectedLine.value][selectedRoute.value];
  if (!currentRoute) {
    return null;
  }
  return (
    <div class="grid grid-cols-1 h-full gap-px bg-black border border-black text-xl">
      {colors.map((color) => (
        <div
          class={`flex items-center justify-center bg-white ${getBg(color)} ${
            getTextColor(color)
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route, j) =>
                  j === selectedRoute.value ? { ...route, color } : route
                )
                : routes
            );
          }}
        >
          {color}
        </div>
      ))}
    </div>
  );
};

const RouteCard = (
  { selectedRoute, selectedLine, lines, route, selected }: {
    selectedRoute: Signal<number>;
    selectedLine: Signal<number>;
    lines: Signal<Route[][]>;
    route: Route;
    selected: boolean;
  },
) => {
  return (
    <div
      class={`p-3 h-full ${getBg(route.color)} ${getTextColor(route.color)} ${
        selected ? `border-dashed ${getBorderColor(route.color)} border-4` : ""
      }`}
    >
      <div class="text-5xl font-semibold mb-3">{route.grade}</div>
      <div class="text-xl">
        {(route.setAtYear !== "vieux" && route.setAtMonth !== "?")
          ? route.setAtMonth
          : ""} {route.setAtYear}
      </div>
      <div class="text-xl">{route.author}</div>
      {selected && (
        <div
          class="text-xl font-semibold"
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.filter((_, i) => selectedRoute.value !== i)
                : routes
            );
            console.log(lines.value[selectedLine.value]);
          }}
        >
          supprimer
        </div>
      )}
    </div>
  );
};

const NewRouteCard = (
  { selectedRoute, selectedLine, lines }: {
    selectedRoute: Signal<number>;
    selectedLine: Signal<number>;
    lines: Signal<Route[][]>;
  },
) => (
  <div class="p-3 h-full">
    <div
      class="text-5xl font-semibold"
      onClick={() => {
        lines.value = lines.value.map((routes, i) =>
          i === selectedLine.value
            ? [...routes, {
              grade: "4a",
              color: "blanc",
              setAtMonth: "?",
              setAtYear: new Date().getFullYear().toString(),
            }]
            : routes
        );
        selectedRoute.value = lines.value[selectedLine.value].length - 1;
      }}
    >
      +
    </div>
  </div>
);

const Line = (
  { selectedRoute, selectedLine, lines }: {
    selectedRoute: Signal<number>;
    selectedLine: Signal<number>;
    lines: Signal<Route[][]>;
  },
) => {
  const routes = lines.value[selectedLine.value];
  return (
    <div class="h-full">
      {routes.map((route, i) => (
        <div
          class="h-1/4"
          onClick={() => {
            selectedRoute.value = i;
          }}
        >
          <RouteCard
            route={route}
            selected={i === selectedRoute.value}
            selectedLine={selectedLine}
            selectedRoute={selectedRoute}
            lines={lines}
          />
        </div>
      ))}
      {routes.length < 4 && (
        <NewRouteCard
          selectedLine={selectedLine}
          selectedRoute={selectedRoute}
          lines={lines}
        />
      )}
    </div>
  );
};

const SetAtPicker = (
  { lines, selectedLine, selectedRoute }: {
    lines: Signal<Route[][]>;
    selectedLine: Signal<number>;
    selectedRoute: Signal<number>;
  },
) => {
  const currentRoute = lines.value[selectedLine.value][selectedRoute.value];
  if (!currentRoute) {
    return null;
  }

  const y = new Date().getFullYear();

  return (
    <div class="grid grid-rows-4 grid-flow-col gap-px bg-black border border-black h-full text-2xl">
      {["Oct", "Avr", "Fev", "?"].map((m) => (
        <div
          class={`flex items-center justify-center ${
            currentRoute.setAtMonth === m ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route, j) =>
                  j === selectedRoute.value
                    ? {
                      ...route,
                      setAtMonth: m,
                    }
                    : route
                )
                : routes
            );
          }}
        >
          {m}
        </div>
      ))}
      {[y, y - 1, y - 2, "vieux"].map((y_) => (
        <div
          class={`flex items-center justify-center bg-white ${
            currentRoute.setAtYear === y_.toString()
              ? "bg-gray-300"
              : "bg-white"
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route, j) =>
                  j === selectedRoute.value
                    ? {
                      ...route,
                      setAtYear: y_.toString(),
                    }
                    : route
                )
                : routes
            );
          }}
        >
          {y_}
        </div>
      ))}
    </div>
  );
};

const AuthorPicker = (
  { lines, selectedLine, selectedRoute }: {
    lines: Signal<Route[][]>;
    selectedLine: Signal<number>;
    selectedRoute: Signal<number>;
  },
) => {
  const currentRoute = lines.value[selectedLine.value][selectedRoute.value];
  if (!currentRoute) {
    return null;
  }

  return (
    <div class="grid grid-rows-5 grid-flow-col gap-px bg-black border border-black h-full">
      {authors.map((author) => (
        <div
          class={`flex items-center justify-center ${
            currentRoute.author === author ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route, j) =>
                  j === selectedRoute.value
                    ? {
                      ...route,
                      author,
                    }
                    : route
                )
                : routes
            );
          }}
        >
          {author}
        </div>
      ))}
    </div>
  );
};

export default function Editor({ lines: lines_ }: { lines: Route[][] }) {
  const selectedLine = useSignal(0);
  const selectedRoute = useSignal(0);
  const lines = useSignal(lines_);
  return (
    <div class="h-screen">
      <div class="h-1/6">
        <LinePicker selectedLine={selectedLine} selectedRoute={selectedRoute} />
      </div>
      <div class="h-5/6 flex">
        {/* Column1 */}
        <div class="w-2/6">
          <Line
            lines={lines}
            selectedRoute={selectedRoute}
            selectedLine={selectedLine}
          />
        </div>

        {/* Column2 */}
        <div class="w-3/6">
          <div class="h-1/3">
            <GradePicker
              lines={lines}
              selectedLine={selectedLine}
              selectedRoute={selectedRoute}
            />
          </div>
          <div class="h-1/3">
            <SetAtPicker
              lines={lines}
              selectedLine={selectedLine}
              selectedRoute={selectedRoute}
            />
          </div>
          <div class="h-1/3">
            <AuthorPicker
              lines={lines}
              selectedLine={selectedLine}
              selectedRoute={selectedRoute}
            />
          </div>
        </div>

        {/* Column3 */}
        <div class="w-1/6">
          <ColorPicker
            lines={lines}
            selectedLine={selectedLine}
            selectedRoute={selectedRoute}
          />
        </div>
      </div>
    </div>
  );
}
