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
- **Zufallsrad für Challenges, die eine ausgeloste Zahl brauchen** – erscheint automatisch neben
  der Challenge und kann innerhalb einer Runde beliebig oft neu gedreht werden.
- **2 bis 16 Spieler**, Namen frei wählbar, 5 bis 10 Runden.
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
4. Bei **Zweigespann** und **Duell** werden zuerst Paare gebildet – reihum ab dem Startspieler:
   Wer dran ist, ist vorausgewählt und tippt nur noch seinen Partner an. Bleibt bei ungerader
   Spielerzahl jemand übrig, ist diese Person **Joker** und setzt ganz normal ihren Chip mit.
5. **Alle** Spieler setzen verdeckt einen ihrer verbleibenden Chips: Antippen markiert die Karte
   nur als *gesetzt*, der Wert bleibt verborgen. Erst *Einsätze aufdecken* zeigt allen, wer wie
   viel riskiert hat.
6. Die Challenge wird gespielt und ausgewertet:
   - *Solo* – jeder für sich geschafft oder nicht.
   - *Meisterschaft* – die Sieger antippen, der Rest geht leer aus.
   - *Zweigespann* – das Ergebnis gilt für das ganze Paar.
   - *Duell* – pro Paar gewinnt genau einer der beiden.
   - Der **Joker** wartet, bis alle Paare entschieden haben, und wählt sich dann eine bereits
     gepaarte Person für eine zweite, eigene Runde derselben Challenge. Ihr erstes Ergebnis
     zählt danach nicht mehr – nur das Ergebnis dieser zweiten Runde entscheidet, für beide.
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

Alle Challenges des vorbereiteten Modus stehen in **`src/data/challenges.ts`**. Aktuell sind zehn
Challenges rund um Pool und Garten hinterlegt: drei Solo, zwei Meisterschaft, zwei Zweigespann und
drei Duell. Hänge beliebig viele weitere an:

```ts
{
  id: 'solo-04',                          // eindeutig
  category: 'SOLO',                       // SOLO | MEISTERSCHAFT | ZWEIGESPANN | DUELL
  title: 'Becherturm',                    // kurze Überschrift
  text: 'Stapel in 30 Sekunden zehn Becher zu einer Pyramide.',
  timeLimitSec: 30,                       // optional, erscheint als "Zeitlimit: 30 Sekunden"
  material: ['10 Becher'],                // optional, ein Chip pro Eintrag
}
```

Es muss nicht in jeder Kategorie gleich viele geben – die App zieht pro Runde zufällig aus allen
noch nicht gespielten Challenges, optional auf eine Kategorie gefiltert.

Danach `npm run build` ausführen und die App neu bereitstellen. Doppelte IDs oder leere Texte
meldet die App beim Start in der Browser-Konsole.

## Zufallsrad

Manche Challenges brauchen vor jedem Durchgang eine ausgeloste Zahl – etwa das Zielgewicht beim
Wet-T-Shirt-Contest oder die zu schätzende Distanz. Diese Räder stehen in
**`src/data/wheels.ts`**, gebunden an die ID der Challenge:

```ts
'duell-02': {
  title:  'Zielgewicht drehen',
  hint:   'Vor jedem Duell einmal drehen.',
  unit:   'g',
  values: [300, 325, 350, 400, 425, 450, 500],
}
```

Taucht eine Challenge-ID dort auf, zeigt die App das Rad automatisch unter der Karte an – in der
Challenge-, Einsatz- und Auswertungsphase, so dass pro Paar neu gedreht werden kann. Das Ergebnis
bleibt über die Phasen einer Runde stehen und verfällt, sobald eine andere Challenge gezogen wird.
Die Anzahl der Felder ist frei; die Farben werden zyklisch vergeben.

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
| `src/data/wheels.ts` | Zufallsräder, pro Challenge-ID |
| `src/screens/` | Start, Setup, Runde, Endstand |
| `src/components/` | Chips, Spielerkarten, Paarbildung, Auswertung, Übersicht, Zufallsrad |
| `src/styles.css` | Farbtokens und Layout |

Die Spiellogik ist bewusst vollständig von der Oberfläche getrennt und in
`src/game/reducer.test.ts` mit 25 Tests abgedeckt; `src/data/wheels.test.ts` prüft mit fünf
weiteren, dass jedes Radfeld sauber unter dem Zeiger landet.

### Farben

Die Oberfläche übernimmt die Farbwelt des Originalspiels: oranger Akzent wie der Kartenkopf,
weiße Karten auf hellem Grund und die vier Kategoriefarben der Kartenleisten – Solo orange,
Meisterschaft pink, Zweigespann türkis, Duell lila. Alle Werte stehen als CSS-Variablen im
`:root`-Block von `src/styles.css`; `--cat-*` färbt Rand und Badge der Challenge-Karte, die
Kategorie-Kacheln und die Filterknöpfe.
