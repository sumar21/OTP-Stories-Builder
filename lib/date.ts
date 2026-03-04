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
    return `${two(day)}/${two(month)}`;
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
