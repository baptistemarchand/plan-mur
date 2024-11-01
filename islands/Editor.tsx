import { createContext } from "preact";
import { colors, getBg, getTextColor } from "../colors.ts";
import { Route } from "../types.ts";
import { computed, effect, Signal, signal } from "@preact/signals";
import { useContext } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { RouteCard } from "../components/RouteCard.tsx";
import { Trashcan } from "../components/icons/Trashcan.tsx";
import { Calendar } from "../components/icons/Calendar.tsx";
import { Person } from "../components/icons/Person.tsx";
import { Tools } from "../components/icons/Tools.tsx";
import { nanoid } from "../utils.ts";

const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number,
) => {
  let timeout: number;

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
};

type DirtyState = "DIRTY" | "LOADING" | "SYNCED";
const sync_ = async (
  club: string,
  lines: Route[][],
  dirtySate: Signal<DirtyState>,
) => {
  if (!IS_BROWSER) {
    return;
  }
  dirtySate.value = "LOADING";
  await fetch(`/api/sync?club=${club}`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lines),
  });
  dirtySate.value = "SYNCED";
};

const sync = debounce(sync_, 3000);

const SyncIndicator = () => {
  const { dirtySate } = useContext(AppContext);
  const color = (() => {
    if (dirtySate.value === "DIRTY") {
      return "bg-yellow-300";
    }
    if (dirtySate.value === "LOADING") {
      return "bg-yellow-500";
    }
    return "bg-green-400";
  })();
  return <div class={`${color} h-1`}></div>;
};

const getFirstRouteId = (line: Route[]) => {
  return line.find((route) => !route.deleted)!.id;
};

const createAppContext = (lines_: Route[][], club: string) => {
  const selectedLine = signal(0);
  const selectedRouteId = signal(getFirstRouteId(lines_[0]));
  const lines = signal(lines_);
  const dirtySate = signal<DirtyState>("SYNCED");

  effect(() => {
    dirtySate.value = "DIRTY";
    sync(club, lines.value, dirtySate);
  });

  return ({
    club,
    dirtySate,
    selectedLine,
    selectedRouteId,
    lines,
    openAuthorPopup: signal(false),
    openSetAtPopup: signal(false),
    currentRoute: computed(() =>
      lines.value[selectedLine.value].find((route) =>
        route.id === selectedRouteId.value
      )!
    ),
    allAuthors: computed(
      () =>
        [
          ...new Set(
            lines.value.flatMap((routes) =>
              routes.map((route) => route.author!)
            )
              .filter(Boolean).filter((author) =>
                !author.includes("+") && !author.includes("/") &&
                !author.includes("&")
              ),
          ),
        ].sort(),
    ),
    allSetAts: computed(
      () =>
        [
          ...new Set(
            lines.value.flatMap((routes) => routes.map((route) => route.setAt!))
              .filter(Boolean),
          ),
        ].sort(),
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
  const { lines, selectedLine, selectedRouteId, club } = useContext(AppContext);
  return (
    <div class="grid grid-cols-8 h-full gap-px bg-black border border-black">
      {lines.value.map((line, i) => (
        <div
          class={`flex items-center justify-center text-xl ${
            selectedLine.value === i ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => {
            selectedLine.value = i;
            selectedRouteId.value = getFirstRouteId(line);
          }}
        >
          {i + 1}
        </div>
      ))}
      {lines.value.length < (club === "faverges" ? 24 : 16) && <NewLineCard />}
    </div>
  );
};

const updateCurrentRoute = (
  { lines, selectedLine, selectedRouteId }: ReturnType<typeof createAppContext>,
  updater: (route: Route) => Partial<Route>,
) => {
  lines.value = lines.value.map((routes, i) =>
    i === selectedLine.value
      ? routes.map((route) =>
        route.id === selectedRouteId.value
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
    <div class="grid grid-rows-4 grid-flow-col gap-px bg-black h-full text-4xl font-semibold">
      {[4, 5, 6, 7].map((n) => (
        <div
          class={`flex items-center justify-center ${
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
          class={`flex items-center justify-center ${
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
  const { lines, selectedLine, selectedRouteId, currentRoute } = useContext(
    AppContext,
  );

  if (!currentRoute.value) {
    return null;
  }
  return (
    <div class="grid grid-cols-1 h-full gap-px bg-black text-xl">
      {colors.map((color) => (
        <div
          class={`flex items-center justify-center bg-white ${getBg(color)} ${
            getTextColor(color)
          }`}
          onClick={() => {
            lines.value = lines.value.map((routes, i) =>
              i === selectedLine.value
                ? routes.map((route) =>
                  route.id === selectedRouteId.value
                    ? { ...route, color }
                    : route
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

const NewRouteCard = () => {
  const { lines, selectedLine, selectedRouteId } = useContext(AppContext);
  return (
    <div class="p-3 h-full">
      <div
        class="text-5xl font-semibold"
        onClick={() => {
          const newId = nanoid();
          lines.value = lines.value.map((routes, i) =>
            i === selectedLine.value
              ? [...routes, {
                id: newId,
                grade: "4a",
                color: "blanc",
                setAtMonth: "?",
                setAtYear: new Date().getFullYear().toString(),
              }]
              : routes
          );
          selectedRouteId.value = newId;
        }}
      >
        +
      </div>
    </div>
  );
};

const Line = () => {
  const { lines, selectedLine, selectedRouteId } = useContext(AppContext);
  const routes = lines.value[selectedLine.value].filter((route) =>
    !route.deleted
  );
  return (
    <div class="h-full">
      {routes.map((route) => (
        <div
          class="h-1/5"
          onClick={() => {
            selectedRouteId.value = route.id;
          }}
        >
          <RouteCard
            route={route}
            selected={route.id === selectedRouteId.value}
            variant="big"
          />
        </div>
      ))}
      {routes.length < 5 && <NewRouteCard />}
    </div>
  );
};

const SetAtPickerPopup = () => {
  const {
    lines,
    selectedLine,
    selectedRouteId,
    currentRoute,
    allSetAts,
    openSetAtPopup,
  } = useContext(
    AppContext,
  );

  if (!currentRoute.value || !openSetAtPopup.value) {
    return null;
  }

  const newSetAt = signal("");

  const addSetAt = (setAt: string) => {
    lines.value = lines.value.map((routes, i) =>
      i === selectedLine.value
        ? routes.map((route) =>
          route.id === selectedRouteId.value
            ? {
              ...route,
              setAt: setAt.toLowerCase().trim(),
            }
            : route
        )
        : routes
    );
    openSetAtPopup.value = false;
  };

  return (
    <div class="h-full absolute w-full">
      <div class="grid bg-black grid-rows-5 grid-flow-col gap-px h-4/5 w-full">
        {allSetAts.value.map((setAt) => (
          <div
            class={`flex items-center justify-center ${
              currentRoute.value.setAt === setAt ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => addSetAt(setAt)}
          >
            {setAt}
          </div>
        ))}
      </div>
      <div class="bg-white flex flex-col h-2/5 border-t border-black pt-4">
        <input
          type="text"
          class="border border-black rounded border-2 text-center mx-8 mt-4 h-10 text-2xl"
          placeholder="jan 2020"
          onInput={(
            e,
          ) => (newSetAt.value = (e.target as HTMLInputElement).value)}
        />
        <div class="mx-auto flex gap-4 bg-white">
          <button
            class="text-2xl bg-green-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
            onClick={() => {
              if (newSetAt.value) {
                addSetAt(newSetAt.value);
                newSetAt.value = "";
              }
            }}
          >
            Ajouter
          </button>
          <button
            class="text-2xl bg-gray-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
            onClick={() => {
              openSetAtPopup.value = false;
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const SetAtPicker = () => {
  const { openSetAtPopup, currentRoute } = useContext(
    AppContext,
  );

  if (!currentRoute.value) {
    return null;
  }

  return (
    <div
      class="text-xl bg-green-500 p-3 text-center font-semibold rounded m-2 text-white mt-4 flex gap-1 justify-center items-center"
      onClick={() => openSetAtPopup.value = true}
    >
      <Calendar color="#fff" size="30px" />
      <div>Date</div>
    </div>
  );
};

const AuthorPickerPopup = () => {
  const {
    lines,
    selectedLine,
    selectedRouteId,
    currentRoute,
    allAuthors,
    openAuthorPopup,
  } = useContext(
    AppContext,
  );

  if (!currentRoute.value || !openAuthorPopup.value) {
    return null;
  }

  const newAuthor = signal("");

  const addAuthor = (author: string) => {
    lines.value = lines.value.map((routes, i) =>
      i === selectedLine.value
        ? routes.map((route) =>
          route.id === selectedRouteId.value
            ? {
              ...route,
              author: author.toLowerCase().trim(),
            }
            : route
        )
        : routes
    );
    openAuthorPopup.value = false;
  };

  return (
    <div class="h-full absolute w-full">
      <div class="grid bg-black grid-rows-5 grid-flow-col gap-px h-4/5 w-full">
        {allAuthors.value.map((author) => (
          <div
            class={`flex items-center justify-center ${
              currentRoute.value.author === author ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => addAuthor(author)}
          >
            {author}
          </div>
        ))}
      </div>
      <div class="bg-white flex flex-col h-2/5 border-t border-black pt-4">
        <input
          type="text"
          class="border border-black rounded border-2 text-center mx-8 mt-4 h-10 text-2xl"
          placeholder="Chris Sharma"
          onInput={(
            e,
          ) => (newAuthor.value = (e.target as HTMLInputElement).value)}
        />
        <div class="mx-auto flex gap-4">
          <button
            class="text-2xl bg-green-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
            onClick={() => {
              if (newAuthor.value) {
                addAuthor(newAuthor.value);
                newAuthor.value = "";
              }
            }}
          >
            Ajouter
          </button>
          <button
            class="text-2xl bg-gray-500 w-32 mx-auto mt-4 text-white rounded py-2 px-4"
            onClick={() => {
              openAuthorPopup.value = false;
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthorPicker = () => {
  const { openAuthorPopup, currentRoute } = useContext(
    AppContext,
  );

  if (!currentRoute.value) {
    return null;
  }

  return (
    <div
      class="text-xl bg-blue-500 p-3 font-semibold rounded m-2 text-white mt-4 flex justify-center items-center gap-1"
      onClick={() => openAuthorPopup.value = true}
    >
      <Person color="#fff" size="30px" />
      <div>Ouvreur.euse</div>
    </div>
  );
};

const ToRemoveButton = () => {
  const context = useContext(
    AppContext,
  );

  if (!context.currentRoute.value) {
    return null;
  }

  return (
    <div
      class={`text-xl ${
        context.currentRoute.value.toRemove
          ? "bg-white text-yellow-500"
          : "bg-yellow-500 text-white"
      } p-3 font-semibold rounded m-2 mt-4 border-yellow-500 border flex items-center justify-center gap-1`}
      onClick={() =>
        updateCurrentRoute(context, (route) => ({
          toRemove: !route.toRemove,
        }))}
    >
      <Tools
        color={context.currentRoute.value.toRemove ? "#f59e0b" : "#fff"}
        size="30px"
      />
      <div>À démonter</div>
    </div>
  );
};

const DeleteButton = () => {
  const context = useContext(
    AppContext,
  );

  if (!context.currentRoute.value) {
    return null;
  }

  return (
    <div
      class="text-xl bg-red-500 p-3 font-semibold rounded m-2 text-white mt-4 flex items-center justify-center gap-1"
      onClick={() => {
        console.log(`Deleting route`, context.currentRoute.value);

        updateCurrentRoute(context, () => ({
          deleted: true,
        }));
        context.selectedRouteId.value = getFirstRouteId(
          context.lines.value[context.selectedLine.value],
        );
      }}
    >
      <Trashcan color="#fff" size="30px" />
      <div>Supprimer</div>
    </div>
  );
};

export default function Editor(
  { lines, club }: { lines: Route[][]; club: string },
) {
  return (
    <AppContext.Provider
      value={createAppContext(lines, club)}
    >
      <div class="h-[calc(100dvh)]">
        <AuthorPickerPopup />
        <SetAtPickerPopup />
        <SyncIndicator />
        <div class="h-1/6">
          <LinePicker />
        </div>
        <div class="h-5/6 flex">
          {/* Column1 */}
          <div class="w-2/6">
            <Line />
          </div>

          {/* Column2 */}
          <div class="w-3/6 border-black border-r border-l">
            <div class="h-1/2">
              <GradePicker />
            </div>
            <div class="h-1/2 border-black border-t">
              <SetAtPicker />
              <AuthorPicker />
              <ToRemoveButton />
              <DeleteButton />
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
