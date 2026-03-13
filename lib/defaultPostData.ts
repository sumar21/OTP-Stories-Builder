import { getDefaultSponsors } from "@/lib/defaultSponsors";
import { nanoid } from "nanoid";
import type { LoosePlayerPost, ParticipantCard, ParticipantsPost, TournamentPostData } from "@/lib/types";

export const defaultTournamentPostData = (): TournamentPostData => ({
  postType: "torneos",
  titulo: "TORNEOS AMERICANOS",
  format: "historia",
  generos: [],
  fechaDesde: "",
  fechaHasta: "",
  days: [],
  sponsors: getDefaultSponsors(),
});

export const defaultLoosePlayerPostData = (): LoosePlayerPost => ({
  postType: "jugador_suelto",
  titulo: "BUSCAMOS JUGADOR",
  subtitulo: "TORNEO AMERICANO",
  categoria: "",
  buscamos: "Indistinto",
  categoriaBuscada: "",
  fecha: "",
  hora: "",
  sede: "",
});

export const buildDefaultParticipantCard = (): ParticipantCard => ({
  id: nanoid(),
  fotoDataUrl: "",
  categoria: "C4",
  nombreParticipante1: "",
  nombreParticipante2: "",
  fecha: "",
  resultado: "campeones",
  copa: "oro",
});

export const defaultParticipantsPostData = (): ParticipantsPost => ({
  postType: "participantes",
  titulo: "PARTICIPANTES DEL TORNEO",
  cards: [buildDefaultParticipantCard()],
});

export const defaultPostData = defaultTournamentPostData;
