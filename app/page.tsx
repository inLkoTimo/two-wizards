import type { Metadata } from "next";
import { TwoWizardsApp } from "@/components/TwoWizardsApp";
import { faq, siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kartenspiel zu zweit online spielen | Two Wizards",
  description: siteDescription,
  alternates: { canonical: "/" },
  keywords: [
    "Kartenspiel zu zweit",
    "Kartenspiele zu zweit online",
    "Spiele zu zweit online",
    "Stichspiel online",
    "Browserspiel zu zweit",
  ],
  openGraph: {
    title: "Kartenspiel zu zweit online spielen – Two Wizards",
    description: siteDescription,
    url: "/",
  },
};

/** Strukturierte Daten: sagt Google, dass das hier eine spielbare
 *  Anwendung ist, und liefert die Fragen fuer die aufklappbaren
 *  Antworten direkt in den Suchergebnissen. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: siteName,
      url: siteUrl,
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      inLanguage: "de",
      description: siteDescription,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function TwoWizardsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <TwoWizardsApp />
    </>
  );
}
