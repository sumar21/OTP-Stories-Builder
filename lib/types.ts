export type Gender = "Masculino" | "Femenino" | "Mixto";
export type Status = "DISPONIBLE" | "ULTIMOS_CUPOS" | "COMPLETO";

export type TournamentItem = {
  id: string;
  categoria: string;
  hora: string;
  lugar: string;
  estado: Status;
};

export type DayBlock = {
  id: string;
  diaLabel: string;
  items: TournamentItem[];
};

export type PostData = {
  titulo: "TORNEOS AMERICANOS";
  generos: Gender[];
  fechaDesde: string;
  fechaHasta: string;
  days: DayBlock[];
};

export type DaySlice = {
  dayId: string;
  diaLabel: string;
  items: TournamentItem[];
  continuation: boolean;
};

export type SlideData = {
  slideIndex: number;
  totalSlides: number;
  days: DaySlice[];
};

export type ValidationError = {
  path: string;
  message: string;
};
