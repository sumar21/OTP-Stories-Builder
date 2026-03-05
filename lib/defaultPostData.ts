import type { PostData } from "@/lib/types";

export const defaultPostData = (): PostData => ({
  titulo: "TORNEOS AMERICANOS",
  format: "historia",
  generos: [],
  fechaDesde: "",
  fechaHasta: "",
  days: [],
});
