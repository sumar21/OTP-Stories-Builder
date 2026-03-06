import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoosePlayerSlideRenderer } from "@/components/LoosePlayerSlideRenderer";
import type { LoosePlayerPost } from "@/lib/types";

const buildLoosePlayer = (categoria: string): LoosePlayerPost => ({
  postType: "jugador_suelto",
  titulo: "BUSCAMOS JUGADOR",
  subtitulo: "TORNEO AMERICANO",
  categoria,
  fecha: "2026-03-12",
  hora: "13:00",
  sede: "El garage",
});

describe("LoosePlayerSlideRenderer", () => {
  it("muestra JUGADORA cuando la categoría es D", () => {
    render(<LoosePlayerSlideRenderer data={buildLoosePlayer("D4")} />);

    expect(screen.getByRole("heading", { level: 2, name: "JUGADORA" })).toBeInTheDocument();
    expect(screen.getByText("D4")).toBeInTheDocument();
  });

  it("muestra JUGADOR cuando la categoría es C", () => {
    render(<LoosePlayerSlideRenderer data={buildLoosePlayer("C5")} />);

    expect(screen.getByRole("heading", { level: 2, name: "JUGADOR" })).toBeInTheDocument();
    expect(screen.getByText("C5")).toBeInTheDocument();
  });

  it("muestra MIXTO y aclara JUGADORA O JUGADOR cuando la categoría es Suma", () => {
    render(<LoosePlayerSlideRenderer data={buildLoosePlayer("Suma 10")} />);

    expect(screen.getByRole("heading", { level: 2, name: "JUGADORA O JUGADOR" })).toBeInTheDocument();
    expect(screen.getByText("MIXTO 10")).toBeInTheDocument();
  });
});
