import type { PostData } from "@/lib/types";

export const defaultPostData = (): PostData => ({
  titulo: "TORNEOS AMERICANOS",
  generos: [],
  fechaDesde: "",
  fechaHasta: "",
  days: [],
});
