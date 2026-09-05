# Two Wizards

Ein magisches Stichspiel für zwei – gemeinsam an einem Kartentisch,
egal wie weit ihr auseinander seid. Next.js im Frontend, Supabase für
Räume und Live-Updates.

## Zwei Oberflächen, ein Spiel

| Adresse | Was es ist |
| --- | --- |
| `/` | die aktuelle Fassung: aufgeteilter Code, sichtbare Stichauflösung, Stapel je Spieler, Layout für jede Bildschirmgröße |
| `/classic` | die ursprüngliche Fassung, unverändert aufbewahrt |

Beide greifen auf dieselbe Tabelle und dasselbe Zustandsformat zu –
ihr könnt also sogar über Kreuz spielen. Wenn `/v2` überzeugt, wird
daraus die Startseite (siehe unten).

## Loslegen

```bash
npm install
cp .env.example .env.local   # Werte aus dem Supabase-Dashboard eintragen
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen. Zum
Testen zu zweit: einmal normal, einmal im privaten Fenster – Spiel
erstellen, Code kopieren, beitreten.

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run test` | Tests der Spielregeln (Node-eigener Test-Runner, ohne Zusatzpakete) |
| `npm run typecheck` | TypeScript prüfen |
| `npm run lint` | ESLint |

## Aufbau

```
app/
  page.tsx            Startseite (aktuelle Fassung)
  classic/page.tsx    alte Fassung, unangetastet
components/
  TwoWizardsApp.tsx   verteilt auf die Bildschirme
  game/               Kartentisch: Karten, Stich, Ansage, Hand, Chat, Punkte
  screens/            Start, Erstellen, Beitreten, Lobby
lib/
  game/               Regeln und Spielzustand – reine Funktionen, ohne React
  supabase/           Datenbankzugriff an einer Stelle gebündelt
  hooks/              Live-Verbindung und Stich-Animation
tests/                Tests der Spielregeln
supabase/schema.sql   Tabelle, Live-Updates und Rechte
backup/               ältere Sicherungskopie, wird nicht gebaut
```

Die Trennung hat einen praktischen Grund: `lib/game` kennt weder
Browser noch Datenbank. Deshalb lassen sich Regeln testen, ohne etwas
zu starten – und eine spätere Prüfung der Züge auf dem Server kann
dieselben Funktionen benutzen.

## Datenbank

`supabase/schema.sql` im SQL-Editor von Supabase ausführen. Es legt die
Tabelle an, schaltet Live-Updates frei und setzt die Zugriffsregeln.

Ein ehrlicher Hinweis steht auch in der Datei: die App schreibt ohne
Login direkt in die Tabelle. Für den Freundeskreis ist das in Ordnung,
für eine öffentliche Version sollten Züge serverseitig geprüft werden.

## Veröffentlichen

1. Projekt zu GitHub pushen.
2. Auf [vercel.com](https://vercel.com) importieren (Next.js wird erkannt).
3. Unter *Settings → Environment Variables* die beiden Werte aus
   `.env.local` eintragen.
4. Deploy. Änderungen an `main` gehen danach automatisch live.

Die alte Fassung liegt unter `app/classic/page.tsx` und bleibt unter
`/classic` erreichbar. Wer sie nicht mehr braucht, kann den Ordner
löschen – im Spiel selbst hängt nichts mehr daran.
