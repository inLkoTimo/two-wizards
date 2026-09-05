import type { Metadata } from "next";
import { TwoWizardsApp } from "@/components/TwoWizardsApp";

export const metadata: Metadata = {
  title: "Two Wizards",
  description:
    "Ein magisches Stichspiel für zwei – gemeinsam an einem Kartentisch, egal wie weit ihr auseinander seid.",
};

export default function TwoWizardsPage() {
  return <TwoWizardsApp />;
}
