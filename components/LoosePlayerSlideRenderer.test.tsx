import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoosePlayerSlideRenderer } from "@/components/LoosePlayerSlideRenderer";
import type { LoosePlayerPost } from "@/lib/types";

const buildLoosePlayer = (categoria: string): LoosePlayerPost => ({
  postType: "jugador_suelto",
  titulo: "BUSCAMOS JUGADOR",
  subtitulo: "TORNEO AMERICANO",
  categoria,
  buscamos: "Indistinto",
  categoriaBuscada: "",
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
    expect(screen.getByText("MIXTO +10")).toBeInTheDocument();
  });

  it("permite especificar que buscamos una jugadora en un MIXTO", () => {
    render(<LoosePlayerSlideRenderer data={{ ...buildLoosePlayer("Suma 11"), buscamos: "Dama" }} />);

    expect(screen.getByRole("heading", { level: 2, name: "JUGADORA" })).toBeInTheDocument();
    expect(screen.getByText("MIXTO +11")).toBeInTheDocument();
  });

  it("muestra la categoria buscada junto con el MIXTO", () => {
    render(<LoosePlayerSlideRenderer data={{ ...buildLoosePlayer("Suma 11"), buscamos: "Dama", categoriaBuscada: "D3" }} />);

    expect(screen.getByRole("heading", { level: 2, name: "JUGADORA" })).toBeInTheDocument();
    expect(screen.getByText("D3 / MIXTO +11")).toBeInTheDocument();
  });

  it("compacta la línea de categoría y mano cuando la combinación es larga", () => {
    render(<LoosePlayerSlideRenderer data={{ ...buildLoosePlayer("C7/C8"), mano: "INDISTINTO" }} />);

    expect(screen.getByText("C7/C8").parentElement).toHaveClass("text-[92px]", "flex-wrap");
    expect(screen.getByText("INDISTINTO").parentElement).toHaveClass("gap-[12px]");
  });
});
