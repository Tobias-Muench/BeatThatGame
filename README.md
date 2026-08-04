# Beat That! – Digitaler Spielleiter

Web-App für das Partyspiel **Beat That!** (Gutter Games), optimiert für ein Android-Tablet, das
in der Mitte des Tisches liegt. Die App übernimmt Chips, Punkte und Rundenführung – komplett
offline, ohne Konto und ohne Server.

## Was die App kann

- **Zwei Betriebsarten**
  - *Karten am Tisch* – ihr zieht die Challenges wie gewohnt von den echten Karten, die App fragt
    pro Runde nur nach der Kategorie.
  - *Vorbereitet in der App* – die hinterlegten Challenges werden pro Runde gezogen und groß
    angezeigt.
- **2 bis 8 Spieler**, Namen frei wählbar, 5 bis 10 Runden.
- **Chip-Verwaltung nach Originalregel**: jeder startet mit 5×1 + 3×3 + 2×5 Chips. Jeder Chip ist
  genau einmal einsetzbar.
- **Alle vier Kategorien**: Solo, Meisterschaft, Zweigespann, Duell – inklusive Paarbildung und
  der Joker-Regel bei ungerader Spielerzahl.
- **Übersicht auf Knopfdruck**: Punktestand, verbleibende Chips samt Restbudget, maximal noch
  erreichbarer Endstand und das komplette Rundenprotokoll.
- **Zurück-Knopf** für jeden Schritt, falls sich jemand vertippt.
- **Spielstand bleibt auf dem Gerät** – App schließen und später fortsetzen funktioniert.

## Spielregeln, wie die App sie umsetzt

1. Jeder Spieler bekommt 10 Chips: fünf Einer, drei Dreier, zwei Fünfer (maximal 24 Punkte).
2. Der Startspieler wechselt jede Runde reihum und wird oben angezeigt.
3. Die Challenge wird gezogen und vorgelesen.
4. Bei **Zweigespann** und **Duell** werden zuerst Paare gebildet. Bleibt bei ungerader
   Spielerzahl jemand übrig, ist diese Person **Joker**: sie setzt ganz normal vorher ihren Chip,
   schaut sich die anderen Paare an und schließt sich erst danach einem Paar an.
5. **Alle** Spieler setzen einen ihrer verbleibenden Chips.
6. Die Challenge wird gespielt und ausgewertet:
   - *Solo* – jeder für sich geschafft oder nicht.
   - *Meisterschaft* – die Sieger antippen, der Rest geht leer aus.
   - *Zweigespann* – das Ergebnis gilt für das ganze Paar.
   - *Duell* – pro Paar gewinnt einer; „Keiner" ist auch möglich.
7. Wer bestanden hat, bankt die Punkte seines Chips. Wer scheitert, verliert sie an die Bank.
   Der Chip ist in beiden Fällen aufgebraucht.
8. Nach der letzten Runde gewinnt der höchste Punktestand.

## Auf das Tablet bringen

Die App ist eine PWA – sie wird einmal im Browser geöffnet und danach wie eine normale App
gestartet.

1. Die gebaute App irgendwo über **HTTPS** bereitstellen. Am einfachsten über GitHub Pages:
   In den Repository-Einstellungen unter *Settings → Pages* als Quelle **GitHub Actions**
   auswählen. Der Workflow in `.github/workflows/deploy.yml` baut und veröffentlicht dann bei
   jedem Push auf `main`.
2. Die Adresse auf dem Tablet in Chrome öffnen.
3. Menü (drei Punkte) → **Zum Startbildschirm hinzufügen**.
4. Die App vom Startbildschirm starten – sie läuft im Vollbild und funktioniert danach auch im
   Flugmodus.

Zum Testen im heimischen WLAN reicht auch `npm run build && npm run preview -- --host` und die
angezeigte Netzwerkadresse. Der Offline-Modus greift dabei allerdings nur über `localhost` oder
HTTPS – Service Worker sind auf ungesicherten Adressen abgeschaltet.

## Eigene Challenges hinterlegen

Alle Challenges des vorbereiteten Modus stehen in **`src/data/challenges.ts`**. Die Datei enthält
aktuell acht klar markierte Platzhalter, damit der Modus sofort läuft. Ersetze sie durch die Texte
deiner Karten und hänge beliebig viele weitere an:

```ts
{
  id: 'solo-03',                          // eindeutig
  category: 'SOLO',                       // SOLO | MEISTERSCHAFT | ZWEIGESPANN | DUELL
  title: 'Becherturm',                    // kurze Überschrift
  text: 'Stapel in 30 Sekunden zehn Becher zu einer Pyramide.',
  timeLimitSec: 30,                       // optional
  material: ['10 Becher'],                // optional
}
```

Danach `npm run build` ausführen und die App neu bereitstellen. Doppelte IDs oder leere Texte
meldet die App beim Start in der Browser-Konsole.

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Spiellogik (Vitest)
npm run build      # Typprüfung + Produktionsbuild nach dist/
npm run preview    # gebauten Stand lokal ansehen
```

### Oberflächen-Tests

Die Skripte unter `scripts/` fahren mit Playwright komplette Spiele durch und prüfen dabei auch
Layout, Touch-Ziele und den Offline-Betrieb. Sie brauchen einen laufenden `npm run preview`:

```bash
npm run build
npm run preview -- --port 5180 &
npm run test:e2e
```

### Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/game/types.ts` | Datenmodell, Chip-Werte, Kategorien |
| `src/game/reducer.ts` | komplette Spiellogik als pure Funktion |
| `src/game/selectors.ts` | Rangliste, Restbudget, maximal erreichbarer Endstand |
| `src/game/storage.ts` | Spielstand im `localStorage` |
| `src/data/challenges.ts` | **hier kommen deine Challenges rein** |
| `src/screens/` | Start, Setup, Runde, Endstand |
| `src/components/` | Chips, Spielerkarten, Paarbildung, Auswertung, Übersicht |

Die Spiellogik ist bewusst vollständig von der Oberfläche getrennt und in
`src/game/reducer.test.ts` mit 25 Tests abgedeckt.
