# bookspire.de

Webseite der App [Bookspire](https://github.com/greedyOdin/bookspire) (App-Repo
privat): eine Startseite für die BookTok-Zielgruppe mit Warteliste, dazu die
Rechtstexte. Reines HTML, CSS und ein kleines Skript, ohne Build-Schritt,
veröffentlicht über GitHub Pages unter der Domain aus `CNAME`.

## Seiten

| Deutsch (verbindlich) | Englisch | Inhalt |
|---|---|---|
| `index.html` | `en/index.html` | Startseite mit Clips aus der App und Warteliste |
| `nutzungsbedingungen.html` | `en/terms.html` | Nutzungsbedingungen (Konto ab 16, Verhaltensregeln, Melden) |
| `datenschutz.html` | `en/privacy.html` | Datenschutzerklärung |
| `impressum.html` | `en/imprint.html` | Impressum |
| `konto-loeschen.html` | `en/delete-account.html` | Konto löschen ohne App (verlangt Google Play) |
| `bestaetigen.html` | `en/confirm.html` | Link aus der Bestätigungsmail der Warteliste |
| `abmelden.html` | `en/unsubscribe.html` | Abmeldelink der Warteliste |
| `404.html` | (dieselbe) | Fehlerseite für alle fehlenden Adressen, zweisprachig, nur absolute Pfade |

Jede Seite hat oben rechts einen Umschalter zur anderen Sprache. Die
indexierbaren Paare (Start, Datenschutz, Nutzungsbedingungen, Konto löschen)
haben `canonical` und `hreflang` für de, en und `x-default` (= Deutsch); dieselben
Paare stehen in `sitemap.xml`. Neue Seiten dort mit eintragen, `noindex`-Seiten
nicht. Bevorzugt der Browser die andere Sprache, blendet `site.js` auf den
Startseiten unten einen Hinweis ein – nur bei Besuch von außerhalb
(`document.referrer`), ohne Cookie oder localStorage. Die englischen Rechtstexte weisen darauf hin, dass die
deutsche Fassung verbindlich ist. Die App öffnet die Rechtstexte in ihrer
Sprache (`legalUrl` in `src/constants/links.ts` im App-Repo) – Adressen
deshalb nicht umbenennen.

## Aufbau

```
style.css        alle Stile; Farben wie in der App, helles und dunkles Schema
site.js          Clips beim Hinscrollen laden, Warteliste, Bestätigen/Abmelden,
                 Hinweis auf die andere Sprache
robots.txt       erlaubt alles, verweist auf sitemap.xml
fonts/           Fraunces und Nunito als WOFF2 (Latein und Umlaute), Lizenz OFL
images/          Logo (logo.png, logo-80.png für die Kopfzeile), Icons,
                 og.jpg / og-en.jpg (Vorschaubilder zum Teilen, 1200×630)
images/app/      Clips (MP4) und Standbilder (WebP) aus der App
images/app/en/   dieselben Motive mit englischer App-Oberfläche (für en/);
                 Raum, Saisons und Turmwachstum ohne Text teilen sich beide
CNAME            bookspire.de
```

## Regeln für die Startseite

- **Kein Spoiler:** Der Drache und sein Schloss erscheinen nirgends, weder in
  Clips noch in Bildern – nur das Ei. Bei neuen Aufnahmen das Erdgeschoss vor
  dem Schlüpfen oder ein Obergeschoss nehmen.
- **Wortwahl wie in der App:** Man liest nicht in der App, man *erfasst*, was
  man liest („log“ auf Englisch).
- **Erfundene Buchtitel:** In Clips und Bildern nur ausgedachte Titel und
  Autoren, keine echten Bücher und keine Verlagscover.
- **Schnell bleiben:** Lighthouse (Handy) lag am 11.10.2026 bei
  99 / 100 / 100 / 100, 337 KB beim ersten Laden. Dafür:
  - Clips mit `preload="none"` und `data-src`; `site.js` lädt sie erst kurz
    vor dem Sichtbarwerden und pausiert sie außerhalb des Bildes
  - Animationen nur per CSS und nur mit `transform` und `opacity`; alles in
    `@media (prefers-reduced-motion: no-preference)`, sonst Standbilder
  - Überschrift und Einleitung oben nicht animieren (sie bestimmen, wann die
    Seite als geladen gilt)
  - jedes Video und Bild mit `width`/`height`, damit nichts verrutscht
  - Schriften nur als WOFF2, keine Inhalte von fremden Servern (auch aus
    Datenschutzgründen)

## Clips und Bilder aus der App

Aufgenommen im Android-Emulator mit dem Testkonto „tester“ (433 + 45 Testbücher,
eingerichtetes Erdgeschoss, Avatar „Mia“). Der Emulator schafft nur etwa
10 Bilder pro Sekunde: Ruhige Szenen gehen, schnelle Animationen (z. B. das
Turmwachstum) besser am Handy per Bildschirmaufnahme aufnehmen.

1. Im Entwicklermenü von Expo Go (`adb shell input keyevent 82`) den
   „Tools button“ ausschalten, sonst schwebt ein Zahnrad im Bild.
2. Aufnehmen: `adb shell screenrecord --bit-rate 8000000 --time-limit 20 /sdcard/clip.mp4`,
   dann `adb pull /sdcard/clip.mp4`. Ohne Bewegung zeichnet der Emulator keine
   Bilder auf – ein Clip endet also mit der letzten Bewegung.
3. Schneiden mit ffmpeg (z. B. aus dem npm-Paket `ffmpeg-static`):
   - Hochformat im Handyrahmen, ohne Statusleiste:
     `-vf "trim=START:ENDE,setpts=PTS-STARTPTS,crop=1080:2310:0:90,scale=360:-2,fps=24"`
   - nur der Raum (Lesezimmer-Tab): `crop=1080:1000:0:596,scale=640:-2`
   - Ende länger stehen lassen: `tpad=stop_mode=clone:stop_duration=3`
   - Kodierung: `-an -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart`
4. Standbild als Vorschau (`poster`):
   `ffmpeg -sseof -0.3 -i clip.mp4 -frames:v 1 -c:v libwebp -quality 75 clip.webp`
   (oder `-ss SEKUNDE` statt `-sseof`)

Ein Clip sollte unter etwa 150 KB bleiben.

Für die englische Seite dieselben Motive mit App-Sprache Englisch aufnehmen
(Profil → Sprache, danach zurückstellen) und nach `images/app/en/` legen. Die
Buchtitel des Testkontos sind deutsch; Motive mit Titeln (Regal, Bibliothek,
Statistik) deshalb in einem eigenen Android-Benutzerprofil ohne Anmeldung
aufnehmen (`pm create-user`), dort englische Test-CSVs importieren und das Profil
danach löschen – so bleibt „tester“ unberührt (Stand 13.10.2026). „Neu freigeschaltet“ erscheint nur, wenn die
Zahl gelesener Bücher steigt: ein Buch kurz auf „Gelesen“ setzen, danach
zurück.

## Warteliste

- Das Formular ruft mit dem öffentlichen Supabase-Schlüssel (derselbe wie in
  der App) die Funktion `join_waitlist` auf; sie liegt mit `confirm_waitlist`
  und `leave_waitlist` in `supabase/11-waitlist.sql` im App-Repo.
- Supabase schickt über Mailjet eine Bestätigungsmail (Double-Opt-in); erst
  nach dem Klick gilt die Adresse (Spalte `confirmed_at` in der Tabelle
  `waitlist`). Unbestätigte Einträge löscht ein nächtlicher Job nach 7 Tagen.
- Ob eine Adresse schon eingetragen ist, verrät die Seite nie. Ein verstecktes
  Feld fängt Bots ab, höchstens 200 neue Einträge pro Stunde.
- Zum Store-Start: bestätigte Adressen exportieren und einmal anschreiben,
  jede Mail mit dem Abmeldelink `abmelden.html?t=<token>` und dem Code für das
  Set „Erste Seite“ (Spalte `code`, als XXXX-XXXX; einmal einlösbar, siehe
  `supabase/13-first-page.sql` und `14-first-page-once.sql` im App-Repo).

### Set „Erste Seite“ als Anreiz

- Oben neben „Auf die Warteliste“ eine kleine goldene Zeile mit Federkiel
  („Wer sich vor dem Start einträgt, bekommt ein Set, das es sonst nie gibt.“),
  die zur Warteliste springt (`.cta-notes`, `.gift`); bewusst ohne Namen, Bild,
  Countdown oder Banner
- In der Frage „Wann kann ich loslegen?“ ein Satz mit Link zur Warteliste
- Bei der Warteliste selbst Bild und Satz zum Set (`.set-picture`,
  `.set-note`). Das Bild ist Inline-SVG, gezeichnet aus den Formen der App
  (Teppich `firstPage`, Avatar im `readingCloak` mit `goldenQuill`); neu
  erzeugen, wenn sich die Zeichnungen in der App ändern: per Jest-Test mit
  `react-dom/server` rendern (react-native-svg auf kleine SVG-Tags gemockt)

## Vorschaubilder zum Teilen

`images/og.jpg` und `images/og-en.jpg` (1200×630) zeigen das nächtliche
Lesezimmer mit der Überschrift. Neu erzeugen: eine kleine HTML-Seite in dieser
Größe mit den Schriften der Seite bauen und mit
`msedge --headless=new --window-size=1200,630 --screenshot=og.png seite.html`
abfotografieren, dann als JPEG speichern.

## Domain und Veröffentlichung

- Jeder Push auf `main` veröffentlicht die Seite (GitHub Pages, Quelle: Wurzel
  von `main`).
- Domain bei IONOS. DNS: vier A-Einträge auf `185.199.108–111.153`, vier
  AAAA-Einträge auf `2606:50c0:8000–8003::153`, `www` als CNAME auf
  `greedyodin.github.io`; TTL 1 Stunde. Nicht anfassen: die MX-Einträge
  (Weiterleitung von kontakt@bookspire.de) und den SPF-Eintrag für Mailjet.
- **HTTPS:** Stand 11.10.2026 hat GitHub das Zertifikat noch nicht
  ausgestellt, obwohl die Domain als gültig gilt. Sobald es da ist, unter
  Settings → Pages „Enforce HTTPS“ einschalten. Kommt es nicht, die Domain
  dort entfernen, ein paar Minuten warten und neu eintragen.
- Lokal ansehen: `npx http-server -p 8090 .` und `http://localhost:8090`.

## Rechtstexte pflegen

- Ändert die App, welche Daten sie wohin schickt, müssen `datenschutz.html`
  und `en/privacy.html` mitgezogen werden (Abschnitte zu App, Konto,
  Fehlerberichten und Warteliste).
- Noch offen: den genauen Vertragspartner bei Mailjet (Mailjet SAS oder Mailjet
  GmbH) nachsehen; in beiden Datenschutzerklärungen steht vorerst „Sinch
  Mailjet SAS, Paris“.
- Neue Pflichtangaben gelb markieren (`class="todo"`), bis sie ausgefüllt sind.
