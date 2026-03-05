import { describe, expect, it } from "vitest";
import { computeSlides } from "@/lib/computeSlides";
import type { PostData, TournamentItem } from "@/lib/types";

const makeItem = (id: string): TournamentItem => ({
  id,
  categoria: "C7",
  hora: "13:00",
  lugar: "ROMA",
  estado: "DISPONIBLE",
});

const makeData = (days: { id: string; label: string; count: number }[]): PostData => ({
  titulo: "TORNEOS AMERICANOS",
  format: "historia",
  generos: ["Masculino"],
  fechaDesde: "02/03",
  fechaHasta: "08/03",
  days: days.map((day) => ({
    id: day.id,
    diaLabel: day.label,
    items: Array.from({ length: day.count }, (_, index) => makeItem(`${day.id}-${index}`)),
  })),
});

const makeCanFit = (capacity: number) => {
  return async (candidateDays: { items: unknown[] }[]) => {
    const usage = candidateDays.reduce((acc, day) => acc + 2 + day.items.length, 0);
    return usage <= capacity;
  };
};

describe("computeSlides", () => {
  it("genera un solo slide cuando todo entra", async () => {
    const data = makeData([
      { id: "d1", label: "SABADO", count: 2 },
      { id: "d2", label: "DOMINGO", count: 1 },
    ]);

    const slides = await computeSlides(data, makeCanFit(20));
    expect(slides).toHaveLength(1);
    expect(slides[0].type).toBe("tournaments");
    expect(slides[0].days).toHaveLength(2);
  });

  it("mueve el segundo día a otro slide cuando no entra", async () => {
    const data = makeData([
      { id: "d1", label: "SABADO", count: 2 },
      { id: "d2", label: "DOMINGO", count: 2 },
    ]);

    const slides = await computeSlides(data, makeCanFit(7));

    expect(slides).toHaveLength(2);
    expect(slides[0].days[0].dayId).toBe("d1");
    expect(slides[1].days[0].dayId).toBe("d2");
  });

  it("parte un día largo por items en múltiples slides", async () => {
    const data = makeData([{ id: "d1", label: "SABADO", count: 9 }]);

    const slides = await computeSlides(data, makeCanFit(6));

    expect(slides).toHaveLength(3);
    expect(slides[0].days[0].items).toHaveLength(4);
    expect(slides[1].days[0].items).toHaveLength(4);
    expect(slides[2].days[0].items).toHaveLength(1);
    expect(slides[0].days[0].continuation).toBe(false);
    expect(slides[1].days[0].continuation).toBe(true);
    expect(slides[2].days[0].continuation).toBe(true);
  });

  it("si no entra en slide no vacío pero sí en uno nuevo, lo pasa al siguiente", async () => {
    const data = makeData([
      { id: "d1", label: "SABADO", count: 1 },
      { id: "d2", label: "DOMINGO", count: 1 },
    ]);

    const slides = await computeSlides(data, makeCanFit(4));

    expect(slides).toHaveLength(2);
    expect(slides[0].days[0].dayId).toBe("d1");
    expect(slides[1].days[0].dayId).toBe("d2");
    expect(slides[1].days[0].continuation).toBe(false);
  });

  it("mantiene el orden estable de días e items", async () => {
    const data = makeData([
      { id: "d1", label: "SABADO", count: 1 },
      { id: "d2", label: "DOMINGO", count: 6 },
    ]);

    const slides = await computeSlides(data, makeCanFit(7));

    const orderedDayIds = slides.flatMap((slide) => slide.days.map((day) => day.dayId));
    expect(orderedDayIds).toEqual(["d1", "d2", "d2"]);

    const allItemIds = slides.flatMap((slide) => slide.days.flatMap((day) => day.items.map((item) => item.id)));
    expect(allItemIds).toEqual([
      "d1-0",
      "d2-0",
      "d2-1",
      "d2-2",
      "d2-3",
      "d2-4",
      "d2-5",
    ]);
  });

  it("marca continuation solo cuando el día fue partido", async () => {
    const data = makeData([
      { id: "d1", label: "SABADO", count: 2 },
      { id: "d2", label: "DOMINGO", count: 2 },
    ]);

    const slides = await computeSlides(data, makeCanFit(7));

    expect(slides).toHaveLength(2);
    expect(slides[0].days[0].continuation).toBe(false);
    expect(slides[1].days[0].continuation).toBe(false);
  });
});
