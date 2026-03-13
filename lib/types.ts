export type Gender = "Masculino" | "Femenino" | "Mixto";
export type Status = "DISPONIBLE" | "ULTIMOS_CUPOS" | "COMPLETO";
export type PostFormat = "historia" | "posteo";
export type Hand = "DRIVE" | "REVES" | "INDISTINTO";
export type PostType = "torneos" | "jugador_suelto" | "participantes";
export type LoosePlayerWanted = "Dama" | "Caballero" | "Indistinto";
export type ParticipantsResult = "campeones" | "subcampeones";
export type ParticipantsCup = "oro" | "plata";

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
  // Categoria del torneo (por ejemplo: C7/C8, D4/D5, Suma 11)
  categoria: string;
  // A quien buscamos para un MIXTO.
  buscamos: LoosePlayerWanted;
  // Categoria de la persona buscada (por ejemplo: D3) para armar "D3 / MIXTO +11".
  categoriaBuscada: string;
  fecha: string;
  hora: string;
  sede: string;
  mano?: Hand;
};

export type ParticipantCard = {
  id: string;
  fotoDataUrl: string;
  categoria: string;
  nombreParticipante1: string;
  nombreParticipante2: string;
  fecha: string;
  resultado: ParticipantsResult;
  copa: ParticipantsCup;
};

export type ParticipantsPost = {
  postType: "participantes";
  titulo: "PARTICIPANTES DEL TORNEO";
  cards: ParticipantCard[];
};

export type PostData = TournamentPostData | LoosePlayerPost | ParticipantsPost;

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

export type ParticipantsSlideData = {
  slideIndex: number;
  totalSlides: number;
  type: "participants";
  card: ParticipantCard;
  days: [];
};

export type SlideData = TournamentSlideData | LoosePlayerSlideData | ParticipantsSlideData;

export type ValidationError = {
  path: string;
  message: string;
};
