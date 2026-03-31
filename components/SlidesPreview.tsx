"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlideRenderer } from "@/components/SlideRenderer";
import { getPostFormat, getSlideSize } from "@/lib/slideFormat";
import type { PostData, SlideData } from "@/lib/types";

type SlidesPreviewProps = {
  data: PostData;
  slides: SlideData[];
  currentSlide: number;
  onChangeSlide: (index: number) => void;
  resizeSignal?: string;
};

const PREVIEW_TARGET_WIDTH = 395;
const PREVIEW_TARGET_WIDTH_MOBILE = 320;
const PREVIEW_FRAME_PADDING = 12;
const THUMBNAIL_WIDTH = 84;

const getSlideNavLabel = (slide: SlideData, index: number): string => {
  if (slide.type === "cover") {
    return "Portada";
  }
  if (slide.type === "closing") {
    return "Cierre";
  }
  return `${index + 1}`;
};

const getSlideAriaLabel = (slide: SlideData, index: number): string => {
  if (slide.type === "cover") {
    return "Slide 1: Portada";
  }
  if (slide.type === "closing") {
    return `Slide ${index + 1}: Cierre`;
  }
  return `Slide ${index + 1}`;
};

export function SlidesPreview({ data, slides, currentSlide, onChangeSlide, resizeSignal }: SlidesPreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_TARGET_WIDTH);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const element = hostRef.current;
    const updateSize = () => {
      const available = element.clientWidth;
      if (!available) {
        return;
      }

      const availableForSlide = Math.max(available - PREVIEW_FRAME_PADDING * 2, 1);
      const targetWidth = window.matchMedia("(max-width: 639px)").matches
        ? PREVIEW_TARGET_WIDTH_MOBILE
        : PREVIEW_TARGET_WIDTH;
      const nextWidth = Math.min(targetWidth, availableForSlide);
      setPreviewWidth(nextWidth);
    };

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);
    requestAnimationFrame(updateSize);

    return () => {
      observer.disconnect();
    };
  }, [resizeSignal]);

  const slideSize = useMemo(() => getSlideSize(getPostFormat(data)), [data]);
  const previewHeight = (previewWidth * slideSize.height) / slideSize.width;
  const scale = previewWidth / slideSize.width;
  const thumbnailHeight = (THUMBNAIL_WIDTH * slideSize.height) / slideSize.width;
  const thumbnailScale = THUMBNAIL_WIDTH / slideSize.width;

  const activeSlide = useMemo(() => slides[currentSlide] ?? slides[0], [slides, currentSlide]);

  if (!activeSlide) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-3xl border border-white/15 bg-black/10 text-white/70">
        Sin slides para mostrar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={() => onChangeSlide(Math.max(currentSlide - 1, 0))}
          disabled={currentSlide === 0}
          className="justify-self-start rounded-lg border border-white/15 px-2 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="sm:hidden">Ant.</span>
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <p className="min-w-0 text-center text-xs font-medium sm:text-sm">
          Slide {currentSlide + 1}/{slides.length}
        </p>
        <button
          type="button"
          onClick={() => onChangeSlide(Math.min(currentSlide + 1, slides.length - 1))}
          disabled={currentSlide === slides.length - 1}
          className="justify-self-end rounded-lg border border-white/15 px-2 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="sm:hidden">Sig.</span>
          <span className="hidden sm:inline">Siguiente</span>
        </button>
      </div>

      <div ref={hostRef} className="mx-auto w-full max-w-[344px] sm:max-w-[420px]">
        <div className="relative mx-auto w-fit rounded-[34px] border border-white/20 bg-[#04186c] p-3 shadow-2xl">
          <div
            className="relative mx-auto overflow-hidden rounded-[26px] bg-[#04186c]"
            style={{ width: previewWidth, height: previewHeight }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: slideSize.width,
                height: slideSize.height,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <SlideRenderer data={data} slide={activeSlide} className="slides-preview-render" />
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="otp-scrollbar flex gap-3 overflow-x-auto pb-1">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;

            return (
              <button
                key={`preview-thumb-${slide.slideIndex}`}
                type="button"
                aria-label={getSlideAriaLabel(slide, index)}
                aria-pressed={isActive}
                onClick={() => onChangeSlide(index)}
                className={`shrink-0 rounded-2xl border p-2 text-left transition ${
                  isActive
                    ? "border-[var(--otp-lime)] bg-[var(--otp-lime)]/12 shadow-[0_0_0_1px_rgba(208,255,81,0.6)]"
                    : "border-white/15 bg-white/6 hover:bg-white/10"
                }`}
              >
                <div
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-[#04186c]"
                  style={{ width: THUMBNAIL_WIDTH, height: thumbnailHeight }}
                >
                  <div
                    className="pointer-events-none absolute left-0 top-0"
                    style={{
                      width: slideSize.width,
                      height: slideSize.height,
                      transform: `scale(${thumbnailScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <SlideRenderer data={data} slide={slide} className="slides-preview-render" />
                  </div>
                </div>

                <p className="mt-2 text-center text-[11px] font-semibold text-white/80">{getSlideNavLabel(slide, index)}</p>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
