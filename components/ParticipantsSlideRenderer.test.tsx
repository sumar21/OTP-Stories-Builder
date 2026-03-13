import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ParticipantsSlideRenderer } from "@/components/ParticipantsSlideRenderer";
import type { ParticipantCard } from "@/lib/types";

const buildCard = (override?: Partial<ParticipantCard>): ParticipantCard => ({
  id: "card-1",
  fotoDataUrl: "data:image/png;base64,test",
  categoria: "C4",
  nombreParticipante1: "Matias Antunez",
  nombreParticipante2: "Federico Danieli",
  fecha: "2026-01-12",
  resultado: "campeones",
  copa: "oro",
  ...override,
});

describe("ParticipantsSlideRenderer", () => {
  it("renderiza categoria, resultado, fecha y nombres", () => {
    render(<ParticipantsSlideRenderer card={buildCard()} />);

    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("CAMPEONES | 12/01")).toHaveClass("text-[31px]");
    expect(screen.getByText("Matias Antunez | Federico Danieli")).toBeInTheDocument();
    expect(screen.getByAltText("Copa Oro")).toBeInTheDocument();
  });

  it("cambia el badge para copa plata", () => {
    render(<ParticipantsSlideRenderer card={buildCard({ copa: "plata" })} />);

    expect(screen.getByAltText("Copa Plata")).toHaveAttribute("src", "/tags/copa-plata.svg");
    expect(screen.getByAltText("Copa Plata")).toHaveStyle({ height: "36px" });
  });

  it("mantiene nombres en una sola línea con ellipsis", () => {
    render(
      <ParticipantsSlideRenderer
        card={buildCard({
          nombreParticipante1: "Nombre extremadamente largo de participante numero uno",
          nombreParticipante2: "Nombre extremadamente largo de participante numero dos",
        })}
      />,
    );

    expect(screen.getByText(/Nombre extremadamente largo/)).toHaveClass("otp-text-clamp-1");
  });

  it("reduce el font size de la categoria cuando el texto es largo", () => {
    render(<ParticipantsSlideRenderer card={buildCard({ categoria: "Suma 11" })} />);

    expect(screen.getByText("Suma 11")).toHaveClass("text-[16px]");
  });

  it("renderiza la sombra por debajo de la tarjeta en una capa separada", () => {
    render(<ParticipantsSlideRenderer card={buildCard()} />);

    expect(screen.getByTestId("participants-card-shadow")).toHaveClass("-bottom-[12px]", "blur-[14px]");
    expect(screen.getByTestId("participants-card")).not.toHaveClass("shadow-[0_16px_30px_rgba(3,10,42,0.4)]");
  });
});
