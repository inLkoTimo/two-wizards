// Eine Stelle fuer alles, was die Seite nach aussen beschreibt.
// Die Adresse kommt auf Vercel automatisch aus der Umgebung - so
// muss hier keine URL fest eingetragen werden und das Projekt
// funktioniert lokal wie online.

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

export const siteName = "Two Wizards";

export const siteTagline = "Kartenspiel zu zweit – online und ohne Anmeldung";

export const siteDescription =
  "Stichspiel für genau zwei Personen, direkt im Browser. Spiel erstellen, Code teilen, losspielen – ohne Anmeldung, ohne Installation, kostenlos.";

/** Inhalte der Startseite. Stehen hier, damit der sichtbare Text
 *  und die strukturierten Daten fuer Google nicht auseinanderlaufen
 *  koennen - beide lesen dieselbe Quelle. */
export const howItWorks = [
  {
    title: "Spiel erstellen",
    text: "Namen eingeben – du bekommst einen Code aus sechs Zeichen.",
  },
  {
    title: "Code teilen",
    text: "Schick ihn der Person, mit der du spielen willst. Per Nachricht, egal wie weit weg sie ist.",
  },
  {
    title: "Losspielen",
    text: "Sobald beide drin sind, öffnet sich der Kartentisch. Keine Installation, kein Konto.",
  },
];

export const faq = [
  {
    question: "Was ist Two Wizards?",
    answer:
      "Ein Stichspiel für genau zwei Personen, das im Browser läuft. Vor jeder Runde sagst du an, wie viele Stiche du holen wirst – und musst diese Zahl dann genau treffen. Zu wenige kosten Punkte, zu viele genauso.",
  },
  {
    question: "Brauche ich ein Konto?",
    answer:
      "Nein. Einer erstellt das Spiel und bekommt einen Code, der andere gibt Namen und Code ein. Keine Anmeldung, keine E-Mail-Adresse.",
  },
  {
    question: "Kann man das Kartenspiel auf dem Handy spielen?",
    answer:
      "Ja. Der Kartentisch passt sich jeder Bildschirmgröße an – Handy, Tablet und Laptop. Eine App musst du nicht installieren.",
  },
  {
    question: "Was kostet Two Wizards?",
    answer:
      "Nichts. Es gibt keine Werbung, keine Anmeldung und keine Installation.",
  },
  {
    question: "Können auch drei oder mehr Leute mitspielen?",
    answer:
      "Nein, Two Wizards ist bewusst für genau zwei Personen gebaut. Viele Kartenspiele zu zweit sind abgespeckte Varianten von Spielen für vier – hier ist die Zwei-Personen-Fassung das Original.",
  },
  {
    question: "Müssen beide gleichzeitig online sein?",
    answer:
      "Ja, gespielt wird in Echtzeit. Beide sehen denselben Kartentisch und können nebenbei im Chat schreiben.",
  },
];
