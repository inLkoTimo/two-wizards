import { ImageResponse } from "next/og";
import { siteName, siteTagline } from "@/lib/site";

// Das Bild, das erscheint, wenn jemand den Link in WhatsApp,
// Signal oder LinkedIn teilt. Ohne das bleibt die Vorschau leer.
export const alt = `${siteName} – ${siteTagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 40%, #235f42 0%, #123b2b 48%, #05080d 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 92, letterSpacing: -2 }}>
          🧙‍♂️ ✨ 🧙‍♀️
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 104,
            fontWeight: 900,
            color: "#fde68a",
          }}
        >
          {siteName}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 38,
            color: "#d1fae5",
          }}
        >
          {siteTagline}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            padding: "14px 32px",
            borderRadius: 999,
            border: "2px solid rgba(253, 230, 138, 0.45)",
            fontSize: 28,
            color: "#fef3c7",
          }}
        >
          Code teilen · losspielen · keine Anmeldung
        </div>
      </div>
    ),
    size,
  );
}
