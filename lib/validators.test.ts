import { describe, expect, it } from "vitest";
import { validatePostData } from "@/lib/validators";
import type { TournamentPostData } from "@/lib/types";

const makeData = (override?: Partial<TournamentPostData>): TournamentPostData => ({
  postType: "torneos",
  titulo: "TORNEOS AMERICANOS",
  format: "historia",
  generos: ["Masculino"],
  fechaDesde: "2026-03-01",
  fechaHasta: "2026-03-07",
  days: [
    {
      id: "d1",
      diaLabel: "SÁBADO",
      items: [
        {
          id: "t1",
          categoria: "C7",
          hora: "13:00",
          lugar: "ROMA",
          estado: "DISPONIBLE",
        },
      ],
    },
  ],
  sponsors: [{ id: "s1", name: "Sponsor 1", logoDataUrl: "/sponsors/onfit.svg" }],
  ...override,
});

describe("validatePostData", () => {
  it("marca error cuando no hay días", () => {
    const errors = validatePostData(makeData({ days: [] }));
    expect(errors.some((error) => error.path === "days")).toBe(true);
  });

  it("marca error cuando un día no tiene torneos", () => {
    const errors = validatePostData(
      makeData({
        days: [{ id: "d1", diaLabel: "SÁBADO", items: [] }],
      }),
    );

    expect(errors.some((error) => error.path === "days.0.items")).toBe(true);
  });
});
