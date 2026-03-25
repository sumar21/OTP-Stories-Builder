"use client";

import { useEffect, useRef } from "react";
import { SlideRenderer } from "@/components/SlideRenderer";
import type { DaySlice, Gender, TournamentPostData, TournamentSlideData } from "@/lib/types";

export type SlideMeasureRequest = {
  id: number;
  version: number;
  candidateDays: DaySlice[];
  genero?: Gender;
};

type SlideMeasurerProps = {
  data: TournamentPostData;
  request: SlideMeasureRequest | null;
  onMeasured: (id: number, version: number, fits: boolean) => void;
};

export function SlideMeasurer({ data, request, onMeasured }: SlideMeasurerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!request || !rootRef.current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const variableArea = rootRef.current?.querySelector<HTMLElement>("[data-variable-area]");
      const cards = rootRef.current?.querySelector<HTMLElement>("[data-day-cards]");

      if (!variableArea || !cards) {
        onMeasured(request.id, request.version, false);
        return;
      }

      const fits = cards.scrollHeight <= variableArea.clientHeight + 1;
      onMeasured(request.id, request.version, fits);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [request, onMeasured]);

  if (!request) {
    return null;
  }

  const measureSlide: TournamentSlideData = {
    slideIndex: 0,
    totalSlides: 1,
    type: "tournaments",
    days: request.candidateDays,
    genero: request.genero,
  };

  return (
    <div className="pointer-events-none fixed -left-[20000px] top-0 invisible" aria-hidden>
      <div ref={rootRef}>
        <SlideRenderer data={data} slide={measureSlide} />
      </div>
    </div>
  );
}
