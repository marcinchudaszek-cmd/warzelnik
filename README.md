# 🍺 Warzelnik — asystent piwowarski

Kompletna aplikacja dla piwowara domowego: baza składników, receptury z kalkulatorami,
asystent dnia warzenia i dziennik fermentacji. Po polsku, w 100% offline.
Web (PWA-style, single-file) + Android (Capacitor).

## Funkcje

- **🌾 Baza składników** — słody (EBC, ekstraktywność), chmiele (alfa-kwasy, aromaty),
  drożdże (odfermentowanie, temperatury). Własne składniki + import baz z plików BeerXML/JSON.
- **📖 Receptury** — automatyczne OG / FG / ABV / IBU (Tinseth) / barwa EBC (Morey)
  z podglądem koloru piwa; chmielenie na gotowanie, whirlpool i na zimno; kalkulator wody
  (zacieranie, wysładzanie, objętość przed gotowaniem); skalowanie do dowolnej objętości;
  import i eksport BeerXML.
- **🍺 Dzień warzenia** — timery przerw zacierania, odliczanie gotowania z alarmami dodatków
  chmielu, dziennik fermentacji z porównaniem planu z pomiarami, historia warek.
- **🧮 Narzędzia** — przelicznik Blg↔SG, korekta hydrometru, ABV z pomiarów, kalkulator
  refermentacji, pełny eksport/import danych (przenoszenie web ↔ Android).

## Rozwój

```bash
npm install
npm run dev          # wersja webowa (Vite)
npm run build        # build webowy -> dist/index.html (single file)
```

## Android

```bash
npm run build:cap && npx cap sync android
cd android
gradlew assembleDebug                                   # APK debug
gradlew bundleRelease -PversionCode=2 -PversionName=1.1 # AAB release (podpisany)
```

Wymagane lokalnie (poza gitem): `android/local.properties` (ścieżka SDK),
`android/keystore.properties` + `android/app/warzelnik.jks` (podpis release).
Szczegóły publikacji: [GOOGLE_PLAY.md](GOOGLE_PLAY.md).

## Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Capacitor 8 · localStorage (bez backendu)
