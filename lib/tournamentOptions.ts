import type { Gender } from "@/lib/types";

const CATEGORY_GROUP_ORDER: Gender[] = ["Masculino", "Femenino", "Mixto"];

export const CATEGORY_OPTIONS_BY_GENDER: Record<Gender, readonly string[]> = {
  Masculino: ["C3", "C3/C4", "C4", "C5", "C6", "C7", "C8", "C9"],
  Femenino: ["D4", "D4/D5", "D6/D7/D8", "D8"],
  Mixto: ["Suma 7", "Suma 8", "Suma 9", "Suma 10", "Suma 11", "Suma 12", "Suma 13", "Suma 14", "Suma 15", "Suma 16"],
};

export const CATEGORY_OPTIONS = CATEGORY_GROUP_ORDER.flatMap((genero) => CATEGORY_OPTIONS_BY_GENDER[genero]);

export const getCategoryOptionsForGeneros = (generos: Gender[]): string[] => {
  if (generos.length === 0) {
    return [...CATEGORY_OPTIONS];
  }

  const selectedGeneros = new Set(generos);
  const options: string[] = [];

  for (const genero of CATEGORY_GROUP_ORDER) {
    if (!selectedGeneros.has(genero)) {
      continue;
    }
    options.push(...CATEGORY_OPTIONS_BY_GENDER[genero]);
  }

  return options;
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
