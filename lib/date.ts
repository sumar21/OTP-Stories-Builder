const DD_MM_PATTERN = /^\d{1,2}\/\d{1,2}$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}/;

const two = (value: number): string => String(value).padStart(2, "0");

export const formatToDayMonth = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (DD_MM_PATTERN.test(trimmed)) {
    const [day, month] = trimmed.split("/").map((part) => Number(part));
    if (Number.isNaN(day) || Number.isNaN(month)) {
      return trimmed;
    }
    const year = new Date().getUTCFullYear();
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime())) {
      return `${two(day)}/${two(month)}`;
    }
    const weekday = WEEKDAY_NAMES[date.getUTCDay()];
    return `${weekday} ${two(day)}/${two(month)}`;
  }

  if (ISO_PATTERN.test(trimmed)) {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return trimmed;
    }
    return `${two(date.getUTCDate())}/${two(date.getUTCMonth() + 1)}`;
  }

  return trimmed;
};

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"] as const;

export const formatToWeekdayDayMonth = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (ISO_PATTERN.test(trimmed)) {
    const [yearRaw, monthRaw, dayRaw] = trimmed.split("-").map((part) => Number(part));
    if (Number.isNaN(yearRaw) || Number.isNaN(monthRaw) || Number.isNaN(dayRaw)) {
      return trimmed;
    }

    const date = new Date(Date.UTC(yearRaw, monthRaw - 1, dayRaw));
    if (Number.isNaN(date.getTime())) {
      return trimmed;
    }

    const weekday = WEEKDAY_NAMES[date.getUTCDay()];
    return `${weekday} ${two(dayRaw)}/${two(monthRaw)}`;
  }

  if (DD_MM_PATTERN.test(trimmed)) {
    const [day, month] = trimmed.split("/").map((part) => Number(part));
    if (Number.isNaN(day) || Number.isNaN(month)) {
      return trimmed;
    }
    return `${two(day)}/${two(month)}`;
  }

  return trimmed;
};
