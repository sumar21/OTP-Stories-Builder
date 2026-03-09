import { getDefaultSponsors } from "@/lib/defaultSponsors";
import type { LoosePlayerPost, TournamentPostData } from "@/lib/types";

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

export const defaultPostData = defaultTournamentPostData;
