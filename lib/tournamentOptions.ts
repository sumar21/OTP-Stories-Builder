import type { Gender } from "@/lib/types";

const CATEGORY_GROUP_ORDER: Gender[] = ["Masculino", "Femenino", "Mixto"];
const CATEGORY_GROUP_LABELS: Record<Gender, string> = {
  Masculino: "Caballeros",
  Femenino: "Damas",
  Mixto: "Mixtos",
};

export const CATEGORY_OPTIONS_BY_GENDER: Record<Gender, readonly string[]> = {
  Masculino: ["C3", "C3/C4", "C4", "C5", "C6", "C7", "C8", "C7/C8", "C9"],
  Femenino: ["D3", "D4", "D5", "D6", "D7", "D8", "D3/D4", "D4/D5", "D5/D6", "D6/D7", "D7/D8", "D6/D7/D8"],
  Mixto: ["Suma 7", "Suma 8", "Suma 9", "Suma 10", "Suma 11", "Suma 12", "Suma 13", "Suma 14", "Suma 15", "Suma 16"],
};

export const LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER: Record<Gender, readonly string[]> = {
  Masculino: ["C3", "C4", "C5", "C6", "C7", "C8", "C3/C4", "C5/C6", "C6/C7", "C7/C8"],
  Femenino: ["D3", "D4", "D5", "D6", "D7", "D8", "D3/D4", "D4/D5", "D5/D6", "D6/D7", "D7/D8", "D6/D7/D8"],
  Mixto: ["Suma 7", "Suma 8", "Suma 9", "Suma 10", "Suma 11", "Suma 12", "Suma 13", "Suma 14", "Suma 15", "Suma 16"],
};

export const CATEGORY_OPTIONS = CATEGORY_GROUP_ORDER.flatMap((genero) => CATEGORY_OPTIONS_BY_GENDER[genero]);

export type CategoryOptionGroup = {
  genero: Gender;
  label: string;
  options: string[];
};

const getOrderedGeneros = (generos: Gender[]): Gender[] => {
  if (generos.length === 0) {
    return [...CATEGORY_GROUP_ORDER];
  }

  const selectedGeneros = new Set(generos);
  return CATEGORY_GROUP_ORDER.filter((genero) => selectedGeneros.has(genero));
};

export const getCategoryOptionsForGeneros = (generos: Gender[]): string[] => {
  const orderedGeneros = getOrderedGeneros(generos);
  const options: string[] = [];

  for (const genero of orderedGeneros) {
    options.push(...CATEGORY_OPTIONS_BY_GENDER[genero]);
  }

  return options;
};

export const getCategoryOptionGroupsForGeneros = (generos: Gender[]): CategoryOptionGroup[] => {
  const orderedGeneros = getOrderedGeneros(generos);
  return orderedGeneros.map((genero) => ({
    genero,
    label: CATEGORY_GROUP_LABELS[genero],
    options: [...CATEGORY_OPTIONS_BY_GENDER[genero]],
  }));
};

export const getLoosePlayerCategoryOptionGroupsForGeneros = (generos: Gender[]): CategoryOptionGroup[] => {
  const orderedGeneros = getOrderedGeneros(generos);
  return orderedGeneros.map((genero) => ({
    genero,
    label: CATEGORY_GROUP_LABELS[genero],
    options: [...LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER[genero]],
  }));
};

export const VENUE_OPTIONS = [
  "El garage",
  "Roma",
  "Roma II",
  "WPC",
  "Araoz P.P",
  "Backyard",
] as const;

export const WEEKDAY_OPTIONS = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
] as const;
