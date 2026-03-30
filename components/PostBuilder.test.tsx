import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PostBuilder } from "@/components/PostBuilder";
import { CATEGORY_OPTIONS_BY_GENDER, LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER, VENUE_OPTIONS } from "@/lib/tournamentOptions";

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
      return [{ slideIndex: 0, totalSlides: 1, type: "tournaments", days: [] }];
    }

    const total = data.days.length;
    return data.days.map((day: any, idx: number) => ({
      slideIndex: idx,
      totalSlides: total,
      type: "tournaments",
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
    expect(screen.getByRole("button", { name: "Portada 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Caballeros" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Damas" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Mixto" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Historia/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Posteo/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Día 1")).not.toBeInTheDocument();
  });

  it("actualiza la preview al seleccionar género", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Mixto" }));

    await waitFor(() => {
      expect(screen.getAllByText("MIXTO").length).toBeGreaterThan(0);
    });
  });

  it("separa los torneos por género en slides distintas", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Caballeros" }));
    fireEvent.click(screen.getByRole("button", { name: "Damas" }));
    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);
    fireEvent.change(await screen.findByLabelText("Etiqueta del día"), { target: { value: "SABADO" } });

    fireEvent.click(screen.getByRole("button", { name: "Editar Damas" }));
    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);
    fireEvent.change(await screen.findByLabelText("Etiqueta del día"), { target: { value: "DOMINGO" } });

    fireEvent.click(screen.getByRole("button", { name: "Editar Caballeros" }));

    const categoriaSelect = (await screen.findByLabelText("Categoría")) as HTMLSelectElement;
    fireEvent.change(categoriaSelect, { target: { value: "C4" } });

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 2))).toBeInTheDocument();
      expect(screen.getAllByText("CABALLEROS").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Siguiente")[0]);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(2, 2))).toBeInTheDocument();
      expect(screen.getAllByText("DAMAS").length).toBeGreaterThan(0);
      expect(screen.queryByText(/CABALLEROS Y DAMAS/i)).not.toBeInTheDocument();
    });
  });

  it("separa la edición de días y torneos por género", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Caballeros" }));
    fireEvent.click(screen.getByRole("button", { name: "Damas" }));

    await waitFor(() => {
      expect(screen.getByText(/Estás editando los torneos de/i)).toBeInTheDocument();
      expect(screen.getAllByText("Caballeros").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    await waitFor(() => {
      expect(screen.getByText("Día 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Damas" }));

    await waitFor(() => {
      expect(screen.getByText(/Estás editando los torneos de/i)).toBeInTheDocument();
      expect(screen.getAllByText("Damas").length).toBeGreaterThan(0);
      expect(screen.queryByText("Día 1")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    await waitFor(() => {
      expect(screen.getByText("Día 1")).toBeInTheDocument();
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

  it("filtra categorías según el género seleccionado", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    const categoriaSelect = (await screen.findByLabelText("Categoría")) as HTMLSelectElement;
    expect(categoriaSelect).toHaveValue("C3");

    fireEvent.click(screen.getByRole("button", { name: "Damas" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Categoría")).toHaveValue("D3");
    });

    const updatedCategoriaSelect = screen.getByLabelText("Categoría") as HTMLSelectElement;
    const options = Array.from(within(updatedCategoriaSelect).getAllByRole("option")).map((option) => option.textContent);
    expect(options).toEqual([...CATEGORY_OPTIONS_BY_GENDER.Femenino]);
  });

  it("en Torneos ofrece la nueva sede 15CERO", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    const lugarSelect = (await screen.findByLabelText("Lugar")) as HTMLSelectElement;
    const lugarOptions = Array.from(within(lugarSelect).getAllByRole("option")).map((option) => option.textContent);

    expect(lugarOptions).toEqual(VENUE_OPTIONS.map((venue) => venue));
    expect(lugarOptions).toContain("15CERO");
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

  it("en formato posteo muestra por defecto la portada en preview", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: /Posteo/i }));
    const addDayButton = screen.getAllByText("+ Agregar día")[0];
    fireEvent.click(addDayButton);
    fireEvent.click(addDayButton);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 4))).toBeInTheDocument();
      expect(screen.getAllByText("TORNEO").length).toBeGreaterThan(0);
      expect(screen.getAllByText("AMERICANO").length).toBeGreaterThan(0);
    });
  });

  it("permite cambiar la variante de portada del posteo y mostrarla en preview", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: /Posteo/i }));
    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 3))).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Siguiente")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Portada 3" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Portada 3" })).toHaveAttribute("aria-pressed", "true");
      const raw = window.localStorage.getItem(POST_CACHE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.tournaments.coverVariant).toBe("3");
      expect(screen.getByText(slidePattern(1, 3))).toBeInTheDocument();
      expect(screen.getAllByText("TORNEO").length).toBeGreaterThan(0);
      expect(screen.getAllByText("AMERICANO").length).toBeGreaterThan(0);
    });
  });

  it("permite volver al primer slide para ver la portada elegida", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: /Posteo/i }));
    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 3))).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Siguiente")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Portada 4" }));

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 3))).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    fireEvent.click(screen.getByRole("button", { name: /Anterior/i }));

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 3))).toBeInTheDocument();
      expect(screen.getAllByText("TORNEO").length).toBeGreaterThan(0);
      expect(screen.getAllByText("AMERICANO").length).toBeGreaterThan(0);
    });
  });

  it("muestra la portada en la tira de preview y permite abrirla directo", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: /Posteo/i }));
    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    const portadaButton = await screen.findByRole("button", { name: "Slide 1: Portada" });
    expect(portadaButton).toBeInTheDocument();

    fireEvent.click(portadaButton);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 3))).toBeInTheDocument();
    });
  });

  it("persistencia: recupera datos guardados del navegador", async () => {
    window.localStorage.setItem(
      POST_CACHE_KEY,
      JSON.stringify({
        titulo: "TORNEOS AMERICANOS",
        format: "posteo",
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
      expect(screen.getByRole("button", { name: /Posteo/i })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("persistencia: guarda cambios automáticamente en localStorage", async () => {
    render(<PostBuilder />);

    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2026-04-12" } });

    await waitFor(() => {
      const raw = window.localStorage.getItem(POST_CACHE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.tournaments.fechaDesde).toBe("2026-04-12");
      expect(parsed.tournaments.format).toBe("historia");
    });
  });

  it("permite cambiar al modo Jugador Suelto y renderiza su formulario", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Jugador Suelto" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Caballeros" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Damas" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mixtos" })).toBeInTheDocument();
      expect(screen.getByLabelText("Categoría *")).toBeInTheDocument();
      expect(screen.getByLabelText("Fecha *")).toBeInTheDocument();
      expect(screen.getByLabelText("Hora *")).toBeInTheDocument();
      expect(screen.getByLabelText("Sede *")).toBeInTheDocument();
      expect(screen.getByText(slidePattern(1, 1))).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Descargar todo (ZIP)" })).not.toBeInTheDocument();
    });
  });

  it("en Jugador Suelto filtra categorías por género con su listado específico", async () => {
    render(<PostBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Jugador Suelto" }));

    const categoriaSelect = (await screen.findByLabelText("Categoría *")) as HTMLSelectElement;

    fireEvent.click(screen.getByRole("button", { name: "Caballeros" }));
    await waitFor(() => {
      expect(categoriaSelect).toHaveValue("C3");
    });

    const caballerosOptions = Array.from(within(categoriaSelect).getAllByRole("option")).map((option) => option.textContent);
    expect(caballerosOptions).toEqual(["Seleccionar categoría", ...LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER.Masculino]);

    fireEvent.click(screen.getByRole("button", { name: "Damas" }));
    await waitFor(() => {
      expect(categoriaSelect).toHaveValue("D3");
    });

    const damasOptions = Array.from(within(categoriaSelect).getAllByRole("option")).map((option) => option.textContent);
    expect(damasOptions).toEqual(["Seleccionar categoría", ...LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER.Femenino]);

    fireEvent.click(screen.getByRole("button", { name: "Mixtos" }));
    await waitFor(() => {
      expect(categoriaSelect).toHaveValue("Suma 7");
    });

    const mixtosOptions = Array.from(within(categoriaSelect).getAllByRole("option")).map((option) => option.textContent);
    expect(mixtosOptions).toEqual(["Seleccionar categoría", ...LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER.Mixto]);
  });

  it("en Jugador Suelto muestra WPC Nordelta y ya no ofrece WPC", async () => {
    render(<PostBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Jugador Suelto" }));

    const sedeSelect = (await screen.findByLabelText("Sede *")) as HTMLSelectElement;
    const sedeOptions = Array.from(within(sedeSelect).getAllByRole("option")).map((option) => option.textContent);

    expect(sedeOptions).toEqual(["Seleccionar sede", ...VENUE_OPTIONS]);
    expect(sedeOptions).toContain("15CERO");
    expect(sedeOptions).toContain("WPC Nordelta");
    expect(sedeOptions).not.toContain("WPC");
  });

  it("migracion: reemplaza WPC por WPC Nordelta al recuperar el cache de Jugador Suelto", async () => {
    window.localStorage.setItem(
      POST_CACHE_KEY,
      JSON.stringify({
        activePostType: "jugador_suelto",
        tournaments: {
          postType: "torneos",
          titulo: "TORNEOS AMERICANOS",
          format: "historia",
          generos: [],
          fechaDesde: "",
          fechaHasta: "",
          days: [],
        },
        loosePlayer: {
          postType: "jugador_suelto",
          titulo: "BUSCAMOS JUGADOR",
          categoria: "C4",
          buscamos: "Indistinto",
          categoriaBuscada: "",
          fecha: "2026-01-01",
          hora: "13:00",
          sede: "WPC",
        },
        participants: {
          postType: "participantes",
          titulo: "PARTICIPANTES DEL TORNEO",
          cards: [],
        },
      }),
    );

    render(<PostBuilder />);

    const sedeSelect = (await screen.findByLabelText("Sede *")) as HTMLSelectElement;
    await waitFor(() => {
      expect(sedeSelect).toHaveValue("WPC Nordelta");
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(POST_CACHE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.loosePlayer.sede).toBe("WPC Nordelta");
    });
  });

  it("permite cambiar al modo Participantes y renderiza su formulario", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Participantes" }));

    await waitFor(() => {
      expect(screen.getByText("Formato fijo: Posteo 1080x1350.")).toBeInTheDocument();
      expect(screen.getByText("Tarjeta 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Participante 1 *")).toBeInTheDocument();
      expect(screen.getByLabelText("Participante 2 *")).toBeInTheDocument();
      expect(screen.getByText(slidePattern(1, 1))).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Descargar todo (ZIP)" })).not.toBeInTheDocument();
    });
  });

  it("en Participantes agrega tarjetas y habilita ZIP con 2 o más slides", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Participantes" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar tarjeta" }));

    await waitFor(() => {
      expect(screen.getByText("Tarjeta 2")).toBeInTheDocument();
      expect(screen.getByText(slidePattern(1, 2))).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Descargar todo (ZIP)" })).toBeInTheDocument();
    });
  });

  it("persistencia: guarda datos de participantes en localStorage", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Participantes" }));
    fireEvent.change(screen.getByLabelText("Participante 1 *"), { target: { value: "Matias Antunez" } });

    await waitFor(() => {
      const raw = window.localStorage.getItem(POST_CACHE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.participants.cards[0].nombreParticipante1).toBe("Matias Antunez");
    });
  });

  it("persistencia: ante quota excedida reintenta sin guardar las fotos de participantes", async () => {
    const hugePhoto = `data:image/png;base64,${"x".repeat(12000)}`;
    window.localStorage.setItem(
      POST_CACHE_KEY,
      JSON.stringify({
        activePostType: "participantes",
        tournaments: {
          postType: "torneos",
          titulo: "TORNEOS AMERICANOS",
          format: "historia",
          generos: [],
          fechaDesde: "",
          fechaHasta: "",
          days: [],
        },
        loosePlayer: {
          postType: "jugador_suelto",
          titulo: "BUSCAMOS JUGADOR",
          categoria: "C4",
          buscamos: "Indistinto",
          categoriaBuscada: "",
          fecha: "2026-01-01",
          hora: "13:00",
          sede: "Roma",
        },
        participants: {
          postType: "participantes",
          titulo: "PARTICIPANTES DEL TORNEO",
          cards: [
            {
              id: "card-1",
              fotoDataUrl: hugePhoto,
              categoria: "C4",
              nombreParticipante1: "Matias",
              nombreParticipante2: "Federico",
              fecha: "2026-01-12",
              resultado: "campeones",
              copa: "oro",
            },
          ],
        },
      }),
    );

    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === POST_CACHE_KEY && value.includes(hugePhoto)) {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
      });

    render(<PostBuilder />);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
      const raw = window.localStorage.getItem(POST_CACHE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.participants.cards[0].fotoDataUrl).toBe("");
      expect(parsed.participants.cards[0].nombreParticipante1).toBe("Matias");
    });
  });

  it("persistencia: recupera participantes guardados del navegador", async () => {
    window.localStorage.setItem(
      POST_CACHE_KEY,
      JSON.stringify({
        activePostType: "participantes",
        tournaments: {
          postType: "torneos",
          titulo: "TORNEOS AMERICANOS",
          format: "historia",
          generos: [],
          fechaDesde: "",
          fechaHasta: "",
          days: [],
        },
        loosePlayer: {
          postType: "jugador_suelto",
          titulo: "BUSCAMOS JUGADOR",
          categoria: "C4",
          buscamos: "Indistinto",
          categoriaBuscada: "",
          fecha: "2026-01-01",
          hora: "13:00",
          sede: "Roma",
        },
        participants: {
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
        },
      }),
    );

    render(<PostBuilder />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Participantes" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByLabelText("Participante 1 *")).toHaveValue("Matias");
      expect(screen.getByLabelText("Participante 2 *")).toHaveValue("Federico");
    });
  });

  it("muestra 'Descargar todo (ZIP)' cuando hay 2 o más slides", async () => {
    render(<PostBuilder />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Descargar todo (ZIP)" })).not.toBeInTheDocument();
    });

    const addDayButton = screen.getAllByText("+ Agregar día")[0];
    fireEvent.click(addDayButton);
    fireEvent.click(addDayButton);

    await waitFor(() => {
      expect(screen.getByText(slidePattern(1, 2))).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Descargar todo (ZIP)" })).toBeInTheDocument();
    });
  });

  it("restablecer todo limpia datos y vuelve al estado inicial", async () => {
    render(<PostBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Mixto" }));
    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2026-04-12" } });
    fireEvent.change(screen.getByLabelText("Fecha hasta"), { target: { value: "2026-04-18" } });
    fireEvent.click(screen.getAllByText("+ Agregar día")[0]);

    await waitFor(() => {
      expect(screen.getByText("Día 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Restablecer todo" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Fecha desde")).toHaveValue("");
      expect(screen.getByLabelText("Fecha hasta")).toHaveValue("");
      expect(screen.getByRole("button", { name: "Mixto" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("button", { name: /Historia/i })).toHaveAttribute("aria-pressed", "true");
      expect(screen.queryByText("Día 1")).not.toBeInTheDocument();
    });
  });
});
