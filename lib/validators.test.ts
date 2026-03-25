import { describe, expect, it } from "vitest";
import { validatePostData } from "@/lib/validators";
import type { ParticipantsPost, TournamentPostData } from "@/lib/types";

const makeData = (override?: Partial<TournamentPostData>): TournamentPostData => ({
  postType: "torneos",
  titulo: "TORNEOS AMERICANOS",
  format: "historia",
  generos: ["Masculino"],
  fechaDesde: "2026-03-01",
  fechaHasta: "2026-03-07",
  coverVariant: "1",
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

const makeParticipantsData = (override?: Partial<ParticipantsPost>): ParticipantsPost => ({
  postType: "participantes",
  titulo: "PARTICIPANTES DEL TORNEO",
  cards: [
    {
      id: "card-1",
      fotoDataUrl: "data:image/png;base64,test",
      categoria: "C4",
      nombreParticipante1: "Matias",
      nombreParticipante2: "Federico",
      fecha: "2026-01-12",
      resultado: "campeones",
      copa: "oro",
    },
  ],
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

  it("marca error cuando participantes no tiene tarjetas", () => {
    const errors = validatePostData(makeParticipantsData({ cards: [] }));
    expect(errors.some((error) => error.path === "cards")).toBe(true);
  });

  it("marca error cuando falta foto en una tarjeta de participantes", () => {
    const errors = validatePostData(
      makeParticipantsData({
        cards: [{ ...makeParticipantsData().cards[0], fotoDataUrl: "" }],
      }),
    );

    expect(errors.some((error) => error.path === "cards.0.fotoDataUrl")).toBe(true);
  });
});
