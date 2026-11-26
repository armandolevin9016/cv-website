# Website von Armando Weder

Persönliche Einzelseite für Bewerbungen auf Lehrstellen in der Schweiz, als Applikationsentwickler EFZ und als ICT-Fachmann EFZ.

Die Seite ist eine **Demo**. Persönliche Angaben sind Beispieldaten und direkt an der Stelle markiert, mit dem Hinweis «Platzhalter». Dazu gehören die E-Mail `kontakt@example.com`, der Wohnort Schweiz und die Sekundarschule Musterdorf. Vor einer echten Bewerbung diese Angaben in `index.html` ersetzen und das PDF austauschen.

Die Seite ist statisch: HTML, CSS und etwas JavaScript, ohne Build. Cloudflare Pages kann das Repository direkt veröffentlichen.

## Ausgabeverzeichnis

**`/`**

Die Website-Dateien liegen im Stamm des Repositorys. In Cloudflare Pages ist das Build-Ausgabeverzeichnis deshalb `/`.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html` | Texte und Aufbau der Seite |
| `styles.css` | Gestaltung, hell und dunkel |
| `script.js` | Menü, Farbschema, aktueller Abschnitt |
| `favicon.svg` | Seitensymbol |
| `404.html` | Hinweis, wenn eine Adresse nicht existiert |
| `functions/_middleware.js` | Passwortschutz für die ganze Seite (Cloudflare Pages Function) |
| `_headers` | Sicherheits- und Cache-Header für Cloudflare Pages |
| `assets/og.png` | Bild für Linkvorschauen |
| `assets/lebenslauf-platzhalter.pdf` | Lebenslauf zum Herunterladen, mit denselben Beispieldaten |

## Inhalt ändern

1. `index.html` öffnen und die Texte anpassen. Den Hinweis «Platzhalter» entfernen, sobald die echte Angabe steht.
2. Das eigene PDF nach `assets/` legen. In `index.html` den Link `assets/lebenslauf-platzhalter.pdf` anpassen, wenn der Dateiname sich ändert.
3. Speichern, committen und auf den Branch `main` pushen.

Cloudflare Pages veröffentlicht danach automatisch neu. Ein lokaler Build ist nicht nötig.

Optional lokal ansehen:

```bash
python3 -m http.server 8080
```

Danach im Browser `http://localhost:8080` öffnen.

## Cloudflare Pages

Neues Projekt aus diesem GitHub-Repository, Production-Branch `main`.

| Einstellung | Wert |
| --- | --- |
| Framework preset | None |
| Build command | leer lassen |
| Build output directory | `/` |
| Root directory | leer lassen (Stamm des Repositorys) |

`_headers` im Stamm liest Pages beim Veröffentlichen und liefert die Datei nicht als Seite aus. Die Regeln setzen unter anderem:

- `Content-Security-Policy` (nur eigene Dateien, keine Frames)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (Kamera, Mikrofon, Standort und Ähnliches aus)
- `Strict-Transport-Security` (ohne Preload, 180 Tage)
- `Cross-Origin-Opener-Policy: same-origin`

HTML behält den Seiten-Standard von Cloudflare (`Cache-Control: public, max-age=0, must-revalidate`). CSS und JavaScript bleiben eine Stunde im Browser, `favicon.svg` und `assets/` einen Tag. Die Dateinamen sind nicht gehasht, deshalb ist der Cache kurz und eine neue Fassung nach dem Push bald sichtbar.

## Passwortschutz

Die ganze Seite liegt hinter einer Anmeldeseite, die nur ein Passwort verlangt. Das erledigt `functions/_middleware.js` als Cloudflare Pages Function, direkt bei Cloudflare und ohne Build.

- Das Passwort steht **nicht** im Code und nicht im Repository, auch nicht als Hash. Es ist ein verschlüsseltes Secret mit dem Namen `SITE_PASSWORD` im Cloudflare-Projekt.
- Ohne gültiges Passwort liefert die Seite nur die Anmeldeseite. Das gilt auch für CSS, Bilder und das PDF.
- Nach der Anmeldung setzt die Seite ein Cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, 30 Tage gültig). Es enthält nur eine Signatur, nicht das Passwort.
- Abmelden: `/?logout` aufrufen.
- Alle Antworten haben `X-Robots-Tag: noindex`, die Anmeldeseite zusätzlich `<meta name="robots" content="noindex">`.
- Fehlt das Secret, kommt niemand hinein (die Seite meldet «Die Anmeldung ist noch nicht eingerichtet»).

**Passwort ändern:**

1. Cloudflare-Dashboard öffnen: Workers & Pages, Projekt `armando-weder-cv`, Settings, Variables and Secrets.
2. `SITE_PASSWORD` bei **Production** auf den neuen Wert setzen (Typ Secret).
3. Neu veröffentlichen: unter Deployments beim letzten Eintrag «Retry deployment», oder einen neuen Commit auf `main` pushen. Erst danach gilt das neue Passwort. Alle bisherigen Anmeldungen werden dabei ungültig.

Lokal testen: Datei `.dev.vars` mit der Zeile `SITE_PASSWORD=dein-testpasswort` anlegen (nicht committen) und `npx wrangler pages dev .` starten.

## Eigene Domain

Keine Domain ist fest eingetragen. Links auf der Seite sind relativ (`styles.css`, `assets/...`) und funktionieren mit `*.pages.dev` und mit einer späteren eigenen Domain.

Das Vorschaubild für Open Graph und Twitter ist wurzelrelativ (`/assets/og.png`), ebenfalls ohne feste Domain. Manche Netzwerke zeigen die Linkvorschau nur, wenn die Adresse absolut ist. Sobald die Domain feststeht, kann man in `index.html` aus `/assets/og.png` eine absolute URL machen.

## Farbschema

Ohne gespeicherte Wahl folgt die Seite der Systemeinstellung (`prefers-color-scheme`). Der Schalter speichert hell oder dunkel in `localStorage` dieses Browsers. Die Wahl bleibt, bis sie wieder geändert wird.

## Sprache

Deutsch mit Schweizer Schreibung (`ss`, kein Eszett). Das `lang` der Seite ist `de-CH`.
