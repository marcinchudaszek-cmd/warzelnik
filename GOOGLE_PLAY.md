# Warzelnik — publikacja w Google Play

## Artefakty
- **AAB (do Play Console):** `android/app/build/outputs/bundle/release/app-release.aab`
- **APK (podpisany, do testów/side-load):** `android/app/build/outputs/apk/release/app-release.apk`
- Budowanie: `npm run build:cap && npx cap sync android`, potem w `android/`: `gradlew bundleRelease`

## Podpis
- Keystore: `android/app/warzelnik.jks` (poza gitem — `*.jks` w .gitignore)
- Dane podpisu (alias, hasła): `android/keystore.properties` — plik lokalny, poza gitem.
- **ZRÓB KOPIĘ ZAPASOWĄ PLIKU .jks ORAZ keystore.properties** — bez nich nie wydasz aktualizacji.
- Alternatywnie zmienne środowiskowe: `KEYSTORE_PATH`, `KEY_STORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## Wersjonowanie
- `versionCode` / `versionName` w `android/app/build.gradle` (domyślnie 1 / "1.0").
- Każde wydanie w Play wymaga podbicia `versionCode`:
  `gradlew bundleRelease -PversionCode=2 -PversionName=1.1`

## Karta sklepu (propozycje)

**Nazwa aplikacji:** Warzelnik — asystent piwowarski

**Krótki opis (max 80 znaków):**
Receptury, kalkulatory OG/IBU/EBC i dziennik warzenia piwa w jednej aplikacji.

**Pełny opis:**
Warzelnik to kompletny asystent piwowara domowego — od układania receptury po dziennik fermentacji.

🌾 BAZA SKŁADNIKÓW
• słody z barwą EBC i ekstraktywnością, chmiele z alfa-kwasami, drożdże z temperaturami i odfermentowaniem
• dodawaj własne składniki i importuj całe bazy z plików (BeerXML/JSON)

📖 RECEPTURY Z KALKULATORAMI
• automatyczne OG, FG, ABV, IBU (Tinseth) i barwa EBC (Morey) z podglądem koloru piwa
• chmielenie na gotowanie, whirlpool i na zimno
• kalkulator wody: zacieranie, wysładzanie, objętość przed gotowaniem
• skalowanie receptur do dowolnej objętości, import i eksport BeerXML

🍺 DZIEŃ WARZENIA
• timery przerw zacierania i odliczanie gotowania z alarmami dodatków chmielu
• dziennik fermentacji z porównaniem planu z pomiarami
• historia warek

🧮 NARZĘDZIA
• przelicznik Blg ↔ SG, korekta hydrometru, ABV z pomiarów, kalkulator refermentacji
• pełny eksport/import danych — przenoś wszystko między urządzeniami

Aplikacja działa w 100% offline. Twoje dane pozostają na Twoim urządzeniu.

**Kategoria:** Jedzenie i napoje (lub Narzędzia)

## Formularz "Bezpieczeństwo danych" w Play Console
- Aplikacja NIE zbiera i NIE udostępnia żadnych danych użytkownika.
- Wszystkie dane (receptury, dziennik) są przechowywane lokalnie (localStorage w WebView).
- Brak reklam, brak analityki, brak dostępu do internetu w czasie działania.

## Checklista publikacji
1. Konto dewelopera Google Play (25 USD jednorazowo).
2. Utwórz aplikację w Play Console (język: polski, nazwa: Warzelnik).
3. Wgraj `app-release.aab` do ścieżki testów wewnętrznych lub produkcji.
4. Uzupełnij kartę sklepu (opisy wyżej + zrzuty ekranu z telefonu, min. 2).
5. Grafika promocyjna 1024×500 i ikona 512×512 (mogę wygenerować).
6. Wypełnij ankietę o treściach (brak treści wrażliwych; aplikacja tematycznie dotyczy alkoholu — zaznacz "odniesienia do alkoholu", sugerowana ocena treści 18+ w niektórych regionach).
7. Bezpieczeństwo danych: patrz wyżej.
8. Opublikuj wydanie.

Uwaga: Google może wymagać adresu polityki prywatności — wystarczy prosta strona
"Aplikacja nie zbiera żadnych danych; wszystko jest przechowywane lokalnie na urządzeniu".
