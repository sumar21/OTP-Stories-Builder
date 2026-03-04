import type { PostData, ValidationError } from "@/lib/types";

export const validatePostData = (data: PostData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.generos.length === 0) {
    errors.push({ path: "generos", message: "Seleccioná al menos un género." });
  }

  data.days.forEach((day, dayIndex) => {
    if (!day.diaLabel.trim()) {
      errors.push({
        path: `days.${dayIndex}.diaLabel`,
        message: `El día ${dayIndex + 1} debe tener nombre.`,
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

  return errors;
};
