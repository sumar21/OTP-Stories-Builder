import type { LoosePlayerPost, PostData, TournamentPostData, ValidationError } from "@/lib/types";

const validateSponsors = (errors: ValidationError[], sponsors: { logoDataUrl: string; name: string }[], pathPrefix: string) => {
  sponsors.forEach((sponsor, index) => {
    if (!sponsor.logoDataUrl.trim()) {
      errors.push({
        path: `${pathPrefix}.${index}.logoDataUrl`,
        message: `Sponsor ${index + 1}: logo requerido.`,
      });
    }

    if (!sponsor.name.trim()) {
      errors.push({
        path: `${pathPrefix}.${index}.name`,
        message: `Sponsor ${index + 1}: nombre requerido.`,
      });
    }
  });
};

const validateTournamentsData = (data: TournamentPostData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.generos.length === 0) {
    errors.push({ path: "generos", message: "Seleccioná al menos un género." });
  }

  if (data.days.length === 0) {
    errors.push({ path: "days", message: "Agregá al menos un día." });
  }

  data.days.forEach((day, dayIndex) => {
    if (!day.diaLabel.trim()) {
      errors.push({
        path: `days.${dayIndex}.diaLabel`,
        message: `El día ${dayIndex + 1} debe tener nombre.`,
      });
    }

    if (day.items.length === 0) {
      errors.push({
        path: `days.${dayIndex}.items`,
        message: `El día ${dayIndex + 1} debe tener al menos un torneo.`,
      });
    }

    day.items.forEach((item, itemIndex) => {
      if (!item.categoria.trim()) {
        errors.push({
          path: `days.${dayIndex}.items.${itemIndex}.categoria`,
          message: `Día ${dayIndex + 1}, torneo ${itemIndex + 1}: categoría requerida.`,
        });
      }
      if (!item.hora.trim()) {
        errors.push({
          path: `days.${dayIndex}.items.${itemIndex}.hora`,
          message: `Día ${dayIndex + 1}, torneo ${itemIndex + 1}: hora requerida.`,
        });
      }
      if (!item.lugar.trim()) {
        errors.push({
          path: `days.${dayIndex}.items.${itemIndex}.lugar`,
          message: `Día ${dayIndex + 1}, torneo ${itemIndex + 1}: lugar requerido.`,
        });
      }
    });
  });

  validateSponsors(errors, data.sponsors, "sponsors");
  return errors;
};

const validateLoosePlayerData = (data: LoosePlayerPost): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.categoria.trim()) {
    errors.push({ path: "categoria", message: "La categoría es obligatoria." });
  }
  if (!data.fecha.trim()) {
    errors.push({ path: "fecha", message: "La fecha es obligatoria." });
  }
  if (!data.hora.trim()) {
    errors.push({ path: "hora", message: "La hora es obligatoria." });
  }
  if (!data.sede.trim()) {
    errors.push({ path: "sede", message: "La sede es obligatoria." });
  }
  return errors;
};

export const validatePostData = (data: PostData): ValidationError[] => {
  if (data.postType === "torneos") {
    return validateTournamentsData(data);
  }

  return validateLoosePlayerData(data);
};
