import type { Recipe } from "@/types";

/** Przykładowe receptury dodawane przy pierwszym uruchomieniu. */
export const SAMPLE_RECIPES: Recipe[] = [
  {
    id: "sample-apa",
    name: "Pierwsze APA",
    style: "American Pale Ale",
    batchL: 20,
    efficiency: 70,
    malts: [
      { maltId: "pale-ale", kg: 4.2 },
      { maltId: "caramunich", kg: 0.3 },
      { maltId: "carapils", kg: 0.2 },
    ],
    hops: [
      { hopId: "magnum", grams: 10, time: 60 },
      { hopId: "cascade", grams: 25, time: 15 },
      { hopId: "citra", grams: 30, time: 0 },
    ],
    yeastId: "us-05",
    mashSteps: [
      { name: "Zacieranie właściwe", temp: 66, minutes: 60 },
      { name: "Mash-out", temp: 76, minutes: 10 },
    ],
    notes: "Chmielenie na zimno: 40 g Citra na 4 dni pod koniec fermentacji.",
  },
  {
    id: "sample-pils",
    name: "Domowy pils",
    style: "Czeski pilzner",
    batchL: 20,
    efficiency: 72,
    malts: [{ maltId: "pilznenski", kg: 4.5 }],
    hops: [
      { hopId: "saaz", grams: 30, time: 60 },
      { hopId: "saaz", grams: 25, time: 30 },
      { hopId: "lubelski", grams: 20, time: 10 },
    ],
    yeastId: "w-34-70",
    mashSteps: [
      { name: "Przerwa maltozowa", temp: 63, minutes: 40 },
      { name: "Dekstrynizacja", temp: 72, minutes: 30 },
      { name: "Mash-out", temp: 76, minutes: 10 },
    ],
    notes: "Lagerowanie min. 4 tygodnie w 2–4°C.",
  },
];
