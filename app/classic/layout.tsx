import type { Metadata } from "next";

// Die alte Fassung bleibt spielbar, soll aber nicht bei Google
// auftauchen - sonst konkurrieren zwei fast gleiche Seiten
// miteinander.
export const metadata: Metadata = {
  title: "Two Wizards – frühere Fassung",
  robots: { index: false, follow: false },
};

export default function ClassicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
