# bookspire.de

Webseite der App Bookspire: Startseite, Nutzungsbedingungen, Datenschutzerklärung,
Impressum und eine Seite zum Löschen des Kontos (für Google Play).
Reines HTML und CSS, ohne Build-Schritt, veröffentlicht über GitHub Pages
unter der Domain aus `CNAME`.

- Farben und Schriften wie in der App (Fraunces und Nunito als WOFF2, auf
  Latein und Umlaute reduziert, unter `fonts/`, Lizenz OFL)
- Gelb markierte Stellen (`class="todo"`) müssen vor dem Start ausgefüllt sein
- Ändert die App, welche Daten sie verarbeitet, muss `datenschutz.html`
  mitgezogen werden
- Startseite für BookTok: Clips aus der App unter `images/app/` (MP4, laden erst
  beim Hinscrollen, siehe `site.js`), Animationen nur per CSS und nur ohne
  „Bewegung reduzieren“. Der Drache wird nie gezeigt, nur das Ei.
- Warteliste mit Double-Opt-in: `site.js` ruft die Supabase-Funktionen aus
  `supabase/11-waitlist.sql` (App-Repo) auf; Bestätigen und Abmelden über
  `bestaetigen.html` / `abmelden.html` bzw. `en/confirm.html` / `en/unsubscribe.html`
- Vorschaubilder zum Teilen: `images/og.jpg` und `images/og-en.jpg` (1200×630)
