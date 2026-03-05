import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PostBuilder } from "@/components/PostBuilder";

beforeAll(() => {
  class ResizeObserver {
    callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe() {
      this.callback([], this as unknown as ResizeObserver);
    }

    unobserve() {}

    disconnect() {}
  }

  (globalThis as any).ResizeObserver = ResizeObserver;

  (globalThis as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  };

  (globalThis as any).cancelAnimationFrame = () => {};
});

vi.mock("@/lib/exportSlides", () => ({
  exportCurrentSlidePng: vi.fn(async () => undefined),
  exportAllSlidesZip: vi.fn(async () => undefined),
}));

vi.mock("@/lib/computeSlides", () => ({
  computeSlides: vi.fn(async (data: any) => {
    if (!data.days.length) {
      return [{ slideIndex: 0, totalSlides: 1, days: [] }];
    }

    const total = data.days.length;
    return data.days.map((day: any, idx: number) => ({
      slideIndex: idx,
      totalSlides: total,
      days: [
        {
          dayId: day.id,
          diaLabel: day.diaLabel,
          continuation: false,
          items: day.items,
        },
      ],
    }));
  }),
}));

const slidePattern = (current: number, total: number): RegExp => new RegExp(`Slide\\s*${current}\\s*/\\s*${total}`);
const POST_CACHE_KEY = "otp-post-builder-data-v1";

describe("PostBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("inicia sin datos cargados", () => {
    render(<PostBuilder />);

    expect(screen.getByLabelText("Fecha desde")).toHaveValue("");
    expect(screen.getByLabelText("Fecha hasta")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Masculino" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Femenino" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Mixto" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Día 1")).not.toBeInTheDocument();
  });

  it("actualiza la preview al seleccionar género", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Mixto" }));

    await waitFor(() => {
      expect(screen.getAllByText("MIXTO").length).toBeGreaterThan(0);
    });
  });

  it("agregar día crea bloque editable", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    await waitFor(() => {
      expect(screen.getByText("Día 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Etiqueta del día")).toBeInTheDocument();
    });
  });

  it("paginación cambia slide cuando hay dos días", async () => {
    render(<PostBuilder />);

    const addDayButton = screen.getAllByText("+ Agregar día")[0];
    fireEvent.click(addDayButton);
    fireEvent.click(addDayButton);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 2))).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Siguiente")[0]);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(2, 2))).toBeInTheDocument();
    });
  });

  it("persistencia: recupera datos guardados del navegador", async () => {
    window.localStorage.setItem(
      POST_CACHE_KEY,
      JSON.stringify({
        titulo: "TORNEOS AMERICANOS",
        generos: ["Mixto"],
        fechaDesde: "2026-03-01",
        fechaHasta: "2026-03-07",
        days: [],
      }),
    );

    render(<PostBuilder />);

    await waitFor(() => {
      expect(screen.getByLabelText("Fecha desde")).toHaveValue("2026-03-01");
      expect(screen.getByLabelText("Fecha hasta")).toHaveValue("2026-03-07");
      expect(screen.getByRole("button", { name: "Mixto" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("persistencia: guarda cambios automáticamente en localStorage", async () => {
    render(<PostBuilder />);

    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2026-04-12" } });

    await waitFor(() => {
      const raw = window.localStorage.getItem(POST_CACHE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.fechaDesde).toBe("2026-04-12");
    });
  });
});
