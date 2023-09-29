import { createContext } from "preact";
import { colors, getBg, getBorderColor, getTextColor } from "../colors.ts";
import { authors, Route } from "../types.ts";
import { computed, signal } from "@preact/signals";
import { useContext } from "preact/hooks";

const createAppContext = (lines_: Route[][]) => {
  const selectedLine = signal(0);
  const selectedRoute = signal(0);
  const lines = signal(lines_);

  return ({
    selectedLine,
    selectedRoute,
    lines,
    currentRoute: computed(() =>
      lines.value[selectedLine.value][selectedRoute.value]
    ),
  });
};

const AppContext = createContext<ReturnType<typeof createAppContext>>(
  {} as ReturnType<typeof createAppContext>,
);

const NewLineCard = () => {
  const { lines, selectedLine } = useContext(AppContext);
  return (
    <div
      class={`flex items-center justify-center bg-white text-xl font-bold`}
      onClick={() => {
        lines.value = [...lines.value, []];
        selectedLine.value = lines.value.length - 1;
      }}
    >
      +
    </div>
  );
};

const LinePicker = () => {
  const { lines, selectedLine, selectedRoute } = useContext(AppContext);
  return (
    <div class="grid grid-cols-8 h-full gap-px bg-black border border-black">
      {lines.value.map((_, i) => (
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
      {lines.value.length < 16 && <NewLineCard />}
    </div>
  );
};

const updateCurrentRoute = (
  { lines, selectedLine, selectedRoute }: ReturnType<typeof createAppContext>,
  updater: (route: Route) => Partial<Route>,
) => {
  lines.value = lines.value.map((routes, i) =>
    i === selectedLine.value
      ? routes.map((route, j) =>
        j === selectedRoute.value
          ? {
            ...route,
            ...updater(route),
          }
          : route
      )
      : routes
  );
};

const GradePicker = () => {
  const context = useContext(
    AppContext,
  );
  const { currentRoute } = context;

  if (!currentRoute.value) {
    return null;
  }
  return (
    <div class="grid grid-rows-4 grid-flow-col gap-px bg-black border border-black h-full text-3xl font-semibold">
      {[4, 5, 6, 7].map((n) => (
        <div
          class={`flex items-center justify-center bg-white ${
            currentRoute.value.grade.includes(n.toString())
              ? "bg-gray-300"
              : "bg-white"
          }`}
          onClick={() => {
            updateCurrentRoute(context, (route) => ({
              grade: route.grade.replace(
                /[4567]/g,
                n.toString(),
              ),
            }));
          }}
        >
          {n}
        </div>
      ))}
      {["a", "b", "c"].map((l) => (
        <div
          class={`flex items-center justify-center bg-white ${
            currentRoute.value.grade.includes(l) ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => {
            updateCurrentRoute(context, (route) => ({
              grade: route.grade.replace(
                /[abc]/g,
                l,
              ),
            }));
          }}
        >
          {l}
        </div>
      ))}
      <div
        class={`flex items-center justify-center  ${
          currentRoute.value.grade.includes("+") ? "bg-gray-300" : "bg-white"
        }`}
        onClick={() => {
          updateCurrentRoute(context, (route) => ({
            grade: (route.grade.includes("+")
              ? route.grade.replace("+", "")
              : `${route.grade}+`),
          }));
        }}
      >
        +
      </div>
    </div>
  );
};

const ColorPicker = () => {
  const { lines, selectedLine, selectedRoute, currentRoute } = useContext(
    AppContext,
  );

  if (!currentRoute.value) {
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
  { route, selected }: {
    route: Route;
    selected: boolean;
  },
) => {
  const { lines, selectedLine, selectedRoute } = useContext(AppContext);
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

const NewRouteCard = () => {
  const { lines, selectedLine, selectedRoute } = useContext(AppContext);
  return (
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
};

const Line = () => {
  const { lines, selectedLine, selectedRoute } = useContext(AppContext);
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
          />
        </div>
      ))}
      {routes.length < 4 && <NewRouteCard />}
    </div>
  );
};

const SetAtPicker = () => {
  const { lines, selectedLine, selectedRoute, currentRoute } = useContext(
    AppContext,
  );

  if (!currentRoute.value) {
    return null;
  }

  const y = new Date().getFullYear();

  return (
    <div class="grid grid-rows-4 grid-flow-col gap-px bg-black border border-black h-full text-2xl">
      {["Oct", "Avr", "Fev", "?"].map((m) => (
        <div
          class={`flex items-center justify-center ${
            currentRoute.value.setAtMonth === m ? "bg-gray-300" : "bg-white"
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
            currentRoute.value.setAtYear === y_.toString()
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

const AuthorPicker = () => {
  const { lines, selectedLine, selectedRoute, currentRoute } = useContext(
    AppContext,
  );

  if (!currentRoute.value) {
    return null;
  }

  return (
    <div class="grid grid-rows-5 grid-flow-col gap-px bg-black border border-black h-full">
      {authors.map((author) => (
        <div
          class={`flex items-center justify-center ${
            currentRoute.value.author === author ? "bg-gray-300" : "bg-white"
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

export default function Editor({ lines }: { lines: Route[][] }) {
  return (
    <AppContext.Provider
      value={createAppContext(lines)}
    >
      <div class="h-screen">
        <div class="h-1/6">
          <LinePicker />
        </div>
        <div class="h-5/6 flex">
          {/* Column1 */}
          <div class="w-2/6">
            <Line />
          </div>

          {/* Column2 */}
          <div class="w-3/6">
            <div class="h-1/3">
              <GradePicker />
            </div>
            <div class="h-1/3">
              <SetAtPicker />
            </div>
            <div class="h-1/3">
              <AuthorPicker />
            </div>
          </div>

          {/* Column3 */}
          <div class="w-1/6">
            <ColorPicker />
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
