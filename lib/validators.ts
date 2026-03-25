import { getGenderFromCategory } from "@/lib/tournamentOptions";
import type { DayBlock, Gender, LoosePlayerPost, ParticipantsPost, PostData, TournamentPostData, ValidationError } from "@/lib/types";

const resolveDayGenero = (day: DayBlock): Gender | undefined => {
  if (day.genero) {
    return day.genero;
  }

  const itemGeneros = Array.from(
    new Set(day.items.map((item) => getGenderFromCategory(item.categoria)).filter((genero): genero is Gender => Boolean(genero))),
  );

  return itemGeneros.length === 1 ? itemGeneros[0] : undefined;
};

const getRelevantDays = (data: TournamentPostData): DayBlock[] => {
  if (data.generos.length === 0) {
    return data.days;
  }

  return data.days.filter((day) => {
    const genero = resolveDayGenero(day);
    return genero ? data.generos.includes(genero) : true;
  });
};

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
  const relevantDays = getRelevantDays(data);

  if (data.generos.length === 0) {
    errors.push({ path: "generos", message: "Seleccioná al menos un género." });
  }

  if (relevantDays.length === 0) {
    errors.push({ path: "days", message: "Agregá al menos un día." });
  }

  relevantDays.forEach((day, dayIndex) => {
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

const validateParticipantsData = (data: ParticipantsPost): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.cards.length === 0) {
    errors.push({ path: "cards", message: "Agregá al menos una tarjeta de participantes." });
    return errors;
  }

  data.cards.forEach((card, cardIndex) => {
    if (!card.fotoDataUrl.trim()) {
      errors.push({
        path: `cards.${cardIndex}.fotoDataUrl`,
        message: `Tarjeta ${cardIndex + 1}: la foto es obligatoria.`,
      });
    }
    if (!card.categoria.trim()) {
      errors.push({
        path: `cards.${cardIndex}.categoria`,
        message: `Tarjeta ${cardIndex + 1}: la categoría es obligatoria.`,
      });
    }
    if (!card.nombreParticipante1.trim()) {
      errors.push({
        path: `cards.${cardIndex}.nombreParticipante1`,
        message: `Tarjeta ${cardIndex + 1}: nombre del participante 1 obligatorio.`,
      });
    }
    if (!card.nombreParticipante2.trim()) {
      errors.push({
        path: `cards.${cardIndex}.nombreParticipante2`,
        message: `Tarjeta ${cardIndex + 1}: nombre del participante 2 obligatorio.`,
      });
    }
    if (!card.fecha.trim()) {
      errors.push({
        path: `cards.${cardIndex}.fecha`,
        message: `Tarjeta ${cardIndex + 1}: la fecha es obligatoria.`,
      });
    }
  });

  return errors;
};

export const validatePostData = (data: PostData): ValidationError[] => {
  if (data.postType === "torneos") {
    return validateTournamentsData(data);
  }
  if (data.postType === "participantes") {
    return validateParticipantsData(data);
  }

  return validateLoosePlayerData(data);
};
