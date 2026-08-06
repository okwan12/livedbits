// Countries shown as flags under "countries visited" on the Currently card.
// Add a row to extend the list — name is for you; flag is what renders.
export type Country = {
  name: string;
  flag: string;
};

export const countriesVisited: Country[] = [
  { name: "Australia", flag: "🇦🇺" },
  { name: "Taiwan", flag: "🇹🇼" },
  { name: "China", flag: "🇨🇳" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Czech Republic", flag: "🇨🇿" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Dominican Republic", flag: "🇩🇴" },
  { name: "UK", flag: "🇬🇧" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Japan", flag: "🇯🇵" },
];
