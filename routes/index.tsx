type Grade = `${"4" | "5" | "6" | "7"}${"a" | "b" | "c"}${"+" | ""}`;
const colors = [
  "bleu",
  "rouge",
  "beige",
  "violet",
  "rose",
  "vert",
  "jaune",
  "noir",
  "orange",
  "blanc",
  "gris",
] as const;
type Color = (typeof colors)[number];

type SetAt =
  | "Fev 2019"
  | "Oct 2021"
  | "Fev 2022"
  | "Avr 2022"
  | "Oct 2022"
  | "Fev 2023"
  | "?";
type Route = {
  color: Color;
  grade: Grade;
  setAt: SetAt;
};

const r = (grade: Grade, color: Color, setAt: SetAt) => ({
  grade,
  color,
  setAt,
});

const lines: Route[][] = [
  // 1
  [
    r("7a+", "bleu", "Oct 2021"),
    r("5b", "rouge", "Oct 2022"),
    r("4b", "beige", "Fev 2023"),
  ],
  // 2
  [
    r("5b", "violet", "Oct 2022"),
    r("5a+", "rose", "Oct 2022"),
    r("5c+", "vert", "Oct 2022"),
    r("5c+", "jaune", "Oct 2022"),
  ],
  // 3
  [
    r("6c", "noir", "Oct 2021"),
    r("5b", "orange", "Oct 2022"),
    r("6a+", "bleu", "Fev 2023"),
    r("5c+", "blanc", "Fev 2023"),
  ],
  // 4
  [
    r("5b", "rose", "Oct 2021"),
    r("6b", "jaune", "Fev 2023"),
    r("6a", "beige", "Oct 2021"),
  ],
  // 5
  [
    r("5b", "noir", "Oct 2022"),
    r("7a", "orange", "Oct 2022"),
    r("4c", "blanc", "Oct 2021"),
  ],
  // 6
  [
    r("5a", "vert", "Oct 2021"),
    r("5c", "bleu", "Oct 2022"),
    r("6b+", "violet", "Oct 2022"),
  ],
  // 7
  [
    r("6a", "gris", "?"),
    r("5b+", "rose", "Oct 2022"),
    r("6a+", "jaune", "Oct 2021"),
    r("6b+", "orange", "Oct 2021"),
  ],
  // 8
  [
    r("6a+", "bleu", "Oct 2022"),
    r("6a", "violet", "Fev 2023"),
    r("6b", "rouge", "Fev 2023"),
  ],
  // 9
  [
    r("5b+", "noir", "Fev 2023"),
    r("6b", "orange", "Fev 2022"),
    r("6b+", "vert", "Oct 2022"),
    r("6b", "rose", "Fev 2023"),
  ],
  // 10
  [
    r("6b+", "jaune", "Fev 2023"),
    r("5c+", "bleu", "Oct 2022"),
    r("7a", "beige", "Fev 2023"),
  ],
  // 11
  [
    r("6c", "blanc", "Avr 2022"),
    r("6c", "orange", "Avr 2022"),
    r("5c", "vert", "Avr 2022"),
  ],
  // 12
  [
    r("6a+", "rose", "Avr 2022"),
    r("6b+", "bleu", "Avr 2022"),
    r("6a", "jaune", "Avr 2022"),
  ],
  // 13
  [
    r("5a+", "orange", "Fev 2019"),
    r("6c", "rouge", "Oct 2022"),
    r("6b", "violet", "Fev 2023"),
  ],
  // 14
  [
    r("6a+", "bleu", "Fev 2022"),
    r("6a+", "jaune", "Avr 2022"),
    r("7a+", "vert", "Fev 2023"),
  ],
  // 15
  [
    r("5b+", "rose", "?"),
    r("6b", "blanc", "Fev 2019"),
    r("6a+", "rouge", "?"),
  ],
  // 16
  [
    r("6b", "bleu", "?"),
    r("5c+", "vert", "?"),
    r("7a", "orange", "Fev 2022"),
    r("6a", "noir", "Fev 2022"),
  ],
];
const allRoutes = lines.flatMap((line) => line);
const allGrades = [4, 5, 6, 7].flatMap((n) =>
  ["a", "b", "c"].map((l) => `${n}${l}`)
).filter((g) => g !== "4a" && g !== "7c");

const getBg = (color: Color) => {
  switch (color) {
    case "rouge":
      return "bg-rouge";
    case "beige":
      return "bg-beige";
    case "bleu":
      return "bg-bleu";
    case "violet":
      return "bg-violet";
    case "rose":
      return "bg-rose";
    case "vert":
      return "bg-vert";
    case "jaune":
      return "bg-jaune";
    case "noir":
      return "bg-noir";
    case "orange":
      return "bg-orange";
    case "gris":
      return "bg-gris";
  }
  return "";
};
const getTextColor = (color: Color) => {
  if (color === "noir" || color === "bleu" || color === "violet") {
    return "text-white";
  }
  return "text-black";
};

const Wall = () => {
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
                <div class="text-xs">{route.setAt}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Stats = () => {
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

export default function Home() {
  return (
    <div>
      <Wall />
      <Stats />
    </div>
  );
}
