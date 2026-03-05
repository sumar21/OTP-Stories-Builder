export type Gender = "Masculino" | "Femenino" | "Mixto";
export type Status = "DISPONIBLE" | "ULTIMOS_CUPOS" | "COMPLETO";
export type PostFormat = "historia" | "posteo";
export type Hand = "DRIVE" | "REVES" | "INDISTINTO";
export type PostType = "torneos" | "jugador_suelto";

export type Sponsor = {
  id: string;
  name: string;
  logoDataUrl: string;
};

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

export type TournamentPostData = {
  postType: "torneos";
  titulo: "TORNEOS AMERICANOS";
  format: PostFormat;
  generos: Gender[];
  fechaDesde: string;
  fechaHasta: string;
  days: DayBlock[];
  sponsors: Sponsor[];
};

export type LoosePlayerPost = {
  postType: "jugador_suelto";
  titulo: "BUSCAMOS JUGADOR";
  subtitulo?: string;
  categoria: string;
  fecha: string;
  hora: string;
  sede: string;
  mano?: Hand;
};

export type PostData = TournamentPostData | LoosePlayerPost;

export type DaySlice = {
  dayId: string;
  diaLabel: string;
  items: TournamentItem[];
  continuation: boolean;
};

export type TournamentSlideData = {
  slideIndex: number;
  totalSlides: number;
  type: "tournaments" | "closing";
  days: DaySlice[];
};

export type LoosePlayerSlideData = {
  slideIndex: number;
  totalSlides: number;
  type: "loose-player";
  days: [];
};

export type SlideData = TournamentSlideData | LoosePlayerSlideData;

export type ValidationError = {
  path: string;
  message: string;
};
