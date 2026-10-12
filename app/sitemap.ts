import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Nur die Startseite gehoert in den Index. Die alte Fassung unter
// /classic bleibt erreichbar, waere fuer Google aber doppelter
// Inhalt - sie steht deshalb hier nicht drin und ist zusaetzlich
// auf "nicht aufnehmen" gesetzt.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
