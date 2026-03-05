import type { Sponsor } from "@/lib/types";

const BASE_SPONSORS: Sponsor[] = [
  { id: "snauwaert", name: "Snauwaert", logoDataUrl: "/sponsors/snauwaert.svg" },
  { id: "sumar", name: "Sumar", logoDataUrl: "/sponsors/sumar.svg" },
  { id: "onfit", name: "Onfit", logoDataUrl: "/sponsors/onfit.svg" },
  { id: "fullsport", name: "Fullsport", logoDataUrl: "/sponsors/fullsport.svg" },
];

export const getDefaultSponsors = (): Sponsor[] => BASE_SPONSORS.map((item) => ({ ...item }));
