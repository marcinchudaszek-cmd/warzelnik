import type { Malt } from "@/types";

export const MALTS: Malt[] = [
  // ── Słody bazowe ──────────────────────────────────────────────
  {
    id: "pilznenski",
    name: "Słód pilzneński",
    type: "bazowy",
    ebc: 3.5,
    extract: 81,
    maxPercent: 100,
    description:
      "Najjaśniejszy słód bazowy, podstawa lagerów i pilsów. Delikatny, słodowy, lekko miodowy charakter. Może stanowić 100% zasypu.",
  },
  {
    id: "pale-ale",
    name: "Słód pale ale",
    type: "bazowy",
    ebc: 6,
    extract: 81,
    maxPercent: 100,
    description:
      "Klasyczna baza piw górnej fermentacji. Pełniejszy, lekko biszkoptowy smak. Idealny do angielskich i amerykańskich ale.",
  },
  {
    id: "wiedenski",
    name: "Słód wiedeński",
    type: "bazowy",
    ebc: 8,
    extract: 80,
    maxPercent: 100,
    description:
      "Nadaje złocistą barwę i tostowy, lekko orzechowy charakter. Baza wiedeńskich lagerów i märzenów.",
  },
  {
    id: "monachijski-jasny",
    name: "Słód monachijski jasny",
    type: "bazowy",
    ebc: 15,
    extract: 79,
    maxPercent: 100,
    description:
      "Wyraźnie słodowy, chlebowy charakter. Podstawa piw w stylu monachijskim, świetny dodatek do bocków i ciemnych lagerów.",
  },
  {
    id: "monachijski-ciemny",
    name: "Słód monachijski ciemny",
    type: "bazowy",
    ebc: 25,
    extract: 78,
    maxPercent: 80,
    description:
      "Głęboki słodowo-chlebowy profil z nutą skórki chleba. Do bocków, dunkli i ciemniejszych lagerów.",
  },
  {
    id: "pszeniczny-jasny",
    name: "Słód pszeniczny jasny",
    type: "bazowy",
    ebc: 4,
    extract: 83,
    maxPercent: 70,
    description:
      "Podstawa piw pszenicznych (40–70% zasypu). Daje pełnię, mętność i trwałą pianę. Zawiera dużo białka.",
  },
  {
    id: "pszeniczny-ciemny",
    name: "Słód pszeniczny ciemny",
    type: "bazowy",
    ebc: 16,
    extract: 82,
    maxPercent: 70,
    description: "Do ciemnych pszenic (dunkelweizen). Chlebowy, lekko karmelowy charakter.",
  },
  {
    id: "zytni",
    name: "Słód żytni",
    type: "bazowy",
    ebc: 7,
    extract: 80,
    maxPercent: 50,
    description:
      "Korzenny, lekko pikantny charakter żyta. Zwiększa pełnię i gęstość. Uwaga: duży udział utrudnia filtrację zacieru.",
  },
  // ── Słody karmelowe ───────────────────────────────────────────
  {
    id: "carapils",
    name: "Carapils / Carafoam",
    type: "karmelowy",
    ebc: 4,
    extract: 77,
    maxPercent: 15,
    description:
      "Bardzo jasny słód karmelowy. Poprawia pianę i pełnię bez wpływu na kolor i smak. Częsty dodatek do jasnych lagerów i IPA.",
  },
  {
    id: "carahell",
    name: "Carahell",
    type: "karmelowy",
    ebc: 25,
    extract: 76,
    maxPercent: 15,
    description: "Jasny karmel, delikatna słodycz i miodowe nuty. Do hellesów, pszenic i pale ale.",
  },
  {
    id: "caramunich",
    name: "Caramunich",
    type: "karmelowy",
    ebc: 120,
    extract: 76,
    maxPercent: 10,
    description:
      "Średni karmel o wyraźnym karmelowo-tofi charakterze. Pogłębia barwę do miedzianej. Do ambery, bocków, brown ale.",
  },
  {
    id: "caraaroma",
    name: "Caraaroma",
    type: "karmelowy",
    ebc: 350,
    extract: 74,
    maxPercent: 8,
    description:
      "Ciemny karmel: rodzynki, suszone owoce, mocny karmel. Do ciemnych ale, porterów i piw belgijskich.",
  },
  {
    id: "crystal-60",
    name: "Crystal 60L",
    type: "karmelowy",
    ebc: 120,
    extract: 75,
    maxPercent: 12,
    description:
      "Angielski karmel średni. Tofi, karmel, lekka owocowość. Klasyka w bitterach, ESB i amerykańskich amberach.",
  },
  {
    id: "special-b",
    name: "Special B",
    type: "karmelowy",
    ebc: 300,
    extract: 72,
    maxPercent: 8,
    description:
      "Belgijski ciemny karmel. Intensywne nuty rodzynek i śliwek. Nieodzowny w dubblach i quadruplach.",
  },
  // ── Słody palone ──────────────────────────────────────────────
  {
    id: "czekoladowy",
    name: "Słód czekoladowy",
    type: "palony",
    ebc: 800,
    extract: 68,
    maxPercent: 7,
    description:
      "Nuty gorzkiej czekolady, kawy i tostów. Podstawowy słód ciemnych piw: porterów, stoutów, ciemnych lagerów.",
  },
  {
    id: "czekoladowy-jasny",
    name: "Słód czekoladowy jasny",
    type: "palony",
    ebc: 500,
    extract: 70,
    maxPercent: 8,
    description: "Łagodniejsza wersja czekoladowego: mleczna czekolada, orzechy. Do brown ale i mild.",
  },
  {
    id: "carafa-special-2",
    name: "Carafa Special II",
    type: "palony",
    ebc: 1100,
    extract: 65,
    maxPercent: 5,
    description:
      "Palony słód pozbawiony łuski – barwi bez ostrej goryczki palonej. Idealny do schwarzbierów i ciemnych lagerów.",
  },
  {
    id: "palony-jeczmien",
    name: "Jęczmień palony (roasted barley)",
    type: "palony",
    ebc: 1300,
    extract: 65,
    maxPercent: 5,
    description:
      "Niesłodowany palony jęczmień. Wyrazista kawowa goryczka i sucha, palona końcówka. Znak rozpoznawczy irlandzkich stoutów.",
  },
  {
    id: "barwiacy",
    name: "Słód barwiący (Sinamar/black)",
    type: "palony",
    ebc: 1400,
    extract: 65,
    maxPercent: 3,
    description: "Najciemniejszy słód. Używany oszczędnie do pogłębienia barwy. Duże ilości dają ostrą, palą goryczkę.",
  },
  // ── Słody specjalne ───────────────────────────────────────────
  {
    id: "melanoidynowy",
    name: "Słód melanoidynowy",
    type: "specjalny",
    ebc: 70,
    extract: 76,
    maxPercent: 15,
    description:
      "Imituje efekt dekokcji: intensywnie słodowy, chlebowy charakter. Do bocków, dunkli, piw czerwonych.",
  },
  {
    id: "wedzony",
    name: "Słód wędzony (rauchmalz)",
    type: "specjalny",
    ebc: 6,
    extract: 80,
    maxPercent: 100,
    description:
      "Wędzony dymem bukowym. Od subtelnej wędzonki (10%) po pełny rauchbier (100%). Klasyka z Bambergu.",
  },
  {
    id: "kwaskowy",
    name: "Słód kwaskowy (sauermalz)",
    type: "specjalny",
    ebc: 5,
    extract: 75,
    maxPercent: 10,
    description:
      "Zakwaszony naturalnie kwasem mlekowym. Obniża pH zacieru (1% ≈ -0,1 pH). Do jasnych lagerów i berliner weisse.",
  },
  {
    id: "platki-owsiane",
    name: "Płatki owsiane",
    type: "specjalny",
    ebc: 3,
    extract: 70,
    maxPercent: 20,
    description:
      "Nadają jedwabistą, kremową pełnię i mętność. Nieodzowne w oatmeal stoutach i NEIPA. Wymagają zacierania ze słodem bazowym.",
  },
  {
    id: "platki-pszenne",
    name: "Płatki pszenne",
    type: "specjalny",
    ebc: 3,
    extract: 72,
    maxPercent: 40,
    description: "Poprawiają pianę i mętność. Klasyka w witbierach i NEIPA. Wymagają zacierania ze słodem bazowym.",
  },
  // ── Dodatki (bez zacierania) ─────────────────────────────────
  {
    id: "cukier-bialy",
    name: "Cukier biały",
    type: "dodatek",
    ebc: 0,
    extract: 100,
    maxPercent: 20,
    description:
      "W 100% fermentowalny – wysusza piwo i podnosi ABV bez pełni. Do belgijskich mocnych ale i wzmacniania IPA.",
  },
  {
    id: "cukier-kandyzowany-ciemny",
    name: "Cukier kandyzowany ciemny",
    type: "dodatek",
    ebc: 500,
    extract: 80,
    maxPercent: 20,
    description:
      "Belgijski syrop kandyzowany. Nuty rodzynek, śliwek i karmelu. Podstawa dubbli i quadrupli.",
  },
  {
    id: "miod",
    name: "Miód",
    type: "dodatek",
    ebc: 2,
    extract: 78,
    maxPercent: 30,
    description:
      "Prawie w pełni fermentowalny. Delikatny miodowy aromat najlepiej zachowuje się przy dodaniu pod koniec fermentacji.",
  },
  {
    id: "laktoza",
    name: "Laktoza",
    type: "dodatek",
    ebc: 0,
    extract: 76,
    maxPercent: 10,
    description:
      "Cukier niefermentowalny przez drożdże piwowarskie. Dodaje słodyczy i pełni. Podstawa milk stoutów i pastry sourów.",
  },
];

export const MALT_TYPE_LABELS: Record<Malt["type"], string> = {
  bazowy: "Bazowe",
  karmelowy: "Karmelowe",
  palony: "Palone",
  specjalny: "Specjalne",
  dodatek: "Dodatki",
};
