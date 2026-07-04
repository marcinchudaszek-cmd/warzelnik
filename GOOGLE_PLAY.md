# Warzelnik â€” publikacja w Google Play

## Artefakty
- **AAB (do Play Console):** `android/app/build/outputs/bundle/release/app-release.aab`
- **APK (podpisany, do testÃ³w/side-load):** `android/app/build/outputs/apk/release/app-release.apk`
- Budowanie: `npm run build:cap && npx cap sync android`, potem w `android/`: `gradlew bundleRelease`

## Podpis
- Keystore: `android/app/warzelnik.jks` (poza gitem â€” `*.jks` w .gitignore)
- Dane podpisu (alias, hasÅ‚a): `android/keystore.properties` â€” plik lokalny, poza gitem.
- **ZRÃ“B KOPIÄ˜ ZAPASOWÄ„ PLIKU .jks ORAZ keystore.properties** â€” bez nich nie wydasz aktualizacji.
- Alternatywnie zmienne Å›rodowiskowe: `KEYSTORE_PATH`, `KEY_STORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## Wersjonowanie
- `versionCode` / `versionName` w `android/app/build.gradle` (domyÅ›lnie 1 / "1.0").
- KaÅ¼de wydanie w Play wymaga podbicia `versionCode`:
  `gradlew bundleRelease -PversionCode=2 -PversionName=1.1`

## Karta sklepu (propozycje)

**Nazwa aplikacji:** Warzelnik â€” asystent piwowarski

**KrÃ³tki opis (max 80 znakÃ³w):**
Receptury, kalkulatory OG/IBU/EBC i dziennik warzenia piwa w jednej aplikacji.

**PeÅ‚ny opis:**
Warzelnik to kompletny asystent piwowara domowego â€” od ukÅ‚adania receptury po dziennik fermentacji.

ðŸŒ¾ BAZA SKÅADNIKÃ“W
â€¢ sÅ‚ody z barwÄ… EBC i ekstraktywnoÅ›ciÄ…, chmiele z alfa-kwasami, droÅ¼dÅ¼e z temperaturami i odfermentowaniem
â€¢ dodawaj wÅ‚asne skÅ‚adniki i importuj caÅ‚e bazy z plikÃ³w (BeerXML/JSON)

ðŸ“– RECEPTURY Z KALKULATORAMI
â€¢ automatyczne OG, FG, ABV, IBU (Tinseth) i barwa EBC (Morey) z podglÄ…dem koloru piwa
â€¢ chmielenie na gotowanie, whirlpool i na zimno
â€¢ kalkulator wody: zacieranie, wysÅ‚adzanie, objÄ™toÅ›Ä‡ przed gotowaniem
â€¢ skalowanie receptur do dowolnej objÄ™toÅ›ci, import i eksport BeerXML

ðŸº DZIEÅƒ WARZENIA
â€¢ timery przerw zacierania i odliczanie gotowania z alarmami dodatkÃ³w chmielu
â€¢ dziennik fermentacji z porÃ³wnaniem planu z pomiarami
â€¢ historia warek

ðŸ§® NARZÄ˜DZIA
â€¢ przelicznik Blg â†” SG, korekta hydrometru, ABV z pomiarÃ³w, kalkulator refermentacji
â€¢ peÅ‚ny eksport/import danych â€” przenoÅ› wszystko miÄ™dzy urzÄ…dzeniami

Aplikacja dziaÅ‚a w 100% offline. Twoje dane pozostajÄ… na Twoim urzÄ…dzeniu.

**Kategoria:** Jedzenie i napoje (lub NarzÄ™dzia)

## Formularz "BezpieczeÅ„stwo danych" w Play Console
- Aplikacja NIE zbiera i NIE udostÄ™pnia Å¼adnych danych uÅ¼ytkownika.
- Wszystkie dane (receptury, dziennik) sÄ… przechowywane lokalnie (localStorage w WebView).
- Brak reklam, brak analityki, brak dostÄ™pu do internetu w czasie dziaÅ‚ania.

## Checklista publikacji
1. Konto dewelopera Google Play (25 USD jednorazowo).
2. UtwÃ³rz aplikacjÄ™ w Play Console (jÄ™zyk: polski, nazwa: Warzelnik).
3. Wgraj `app-release.aab` do Å›cieÅ¼ki testÃ³w wewnÄ™trznych lub produkcji.
4. UzupeÅ‚nij kartÄ™ sklepu (opisy wyÅ¼ej + zrzuty ekranu z telefonu, min. 2).
5. Grafika promocyjna 1024Ã—500 i ikona 512Ã—512 (mogÄ™ wygenerowaÄ‡).
6. WypeÅ‚nij ankietÄ™ o treÅ›ciach (brak treÅ›ci wraÅ¼liwych; aplikacja tematycznie dotyczy alkoholu â€” zaznacz "odniesienia do alkoholu", sugerowana ocena treÅ›ci 18+ w niektÃ³rych regionach).
7. BezpieczeÅ„stwo danych: patrz wyÅ¼ej.
8. Opublikuj wydanie.

Uwaga: Google moÅ¼e wymagaÄ‡ adresu polityki prywatnoÅ›ci â€” wystarczy prosta strona
"Aplikacja nie zbiera Å¼adnych danych; wszystko jest przechowywane lokalnie na urzÄ…dzeniu".
