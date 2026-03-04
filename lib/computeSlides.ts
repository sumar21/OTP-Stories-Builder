import type { DaySlice, PostData, SlideData } from "@/lib/types";

export type SlideMeasureFn = (candidateDays: DaySlice[]) => Promise<boolean>;

const withTotals = (slides: DaySlice[][]): SlideData[] => {
  const normalized = slides.length > 0 ? slides : [[]];
  const total = normalized.length;

  return normalized.map((days, index) => ({
    slideIndex: index,
    totalSlides: total,
    days,
  }));
};

export async function computeSlides(data: PostData, canFit: SlideMeasureFn): Promise<SlideData[]> {
  const days = data.days;
  const slides: DaySlice[][] = [];
  let currentSlide: DaySlice[] = [];

  for (const day of days) {
    const fullDay: DaySlice = {
      dayId: day.id,
      diaLabel: day.diaLabel,
      continuation: false,
      items: [...day.items],
    };

    if (await canFit([...currentSlide, fullDay])) {
      currentSlide = [...currentSlide, fullDay];
      continue;
    }

    if (currentSlide.length > 0) {
      slides.push(currentSlide);
      currentSlide = [];

      if (await canFit([fullDay])) {
        currentSlide = [fullDay];
        continue;
      }
    }

    let remaining = [...day.items];
    let continuation = false;

    while (remaining.length > 0) {
      let acceptedCount = 0;
      let acceptedItems: typeof remaining = [];

      for (let idx = 0; idx < remaining.length; idx += 1) {
        const candidateItems = remaining.slice(0, idx + 1);
        const candidateDay: DaySlice = {
          dayId: day.id,
          diaLabel: day.diaLabel,
          continuation,
          items: candidateItems,
        };

        const fits = await canFit([...currentSlide, candidateDay]);
        if (!fits) {
          break;
        }

        acceptedCount = idx + 1;
        acceptedItems = candidateItems;
      }

      if (acceptedCount === 0) {
        // Fallback guard to avoid infinite loops with pathological content.
        acceptedCount = 1;
        acceptedItems = remaining.slice(0, 1);
      }

      currentSlide = [
        ...currentSlide,
        {
          dayId: day.id,
          diaLabel: day.diaLabel,
          continuation,
          items: acceptedItems,
        },
      ];

      remaining = remaining.slice(acceptedCount);

      if (remaining.length > 0) {
        slides.push(currentSlide);
        currentSlide = [];
        continuation = true;
      }
    }
  }

  if (currentSlide.length > 0) {
    slides.push(currentSlide);
  }

  return withTotals(slides);
}
