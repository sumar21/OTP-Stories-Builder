"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuilderForm } from "@/components/BuilderForm";
import { ExportButtons } from "@/components/ExportButtons";
import { SlideMeasurer } from "@/components/SlideMeasurer";
import type { SlideMeasureRequest } from "@/components/SlideMeasurer";
import { SlideRenderer } from "@/components/SlideRenderer";
import { SlidesPreview } from "@/components/SlidesPreview";
import { computeSlides } from "@/lib/computeSlides";
import { defaultPostData } from "@/lib/defaultPostData";
import { exportAllSlidesZip, exportCurrentSlidePng } from "@/lib/exportSlides";
import type { DaySlice, PostData, PostFormat, SlideData } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { validatePostData } from "@/lib/validators";

const POST_CACHE_KEY = "otp-post-builder-data-v1";
const GENDER_VALUES = new Set(["Masculino", "Femenino", "Mixto"]);
const STATUS_VALUES = new Set(["DISPONIBLE", "ULTIMOS_CUPOS", "COMPLETO"]);
const FORMAT_VALUES = new Set(["historia", "posteo"]);

type PendingMeasure = {
  id: number;
  version: number;
  resolve: (fits: boolean) => void;
};
type MobileTab = "builder" | "preview";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const withClosingSlide = (baseSlides: SlideData[], format: PostFormat): SlideData[] => {
  if (baseSlides.length === 0) {
    return [];
  }

  const slides = [...baseSlides];
  if (format === "posteo") {
    slides.push({
      slideIndex: slides.length,
      totalSlides: slides.length + 1,
      type: "closing",
      days: [],
    });
  }

  const total = slides.length;
  return slides.map((slide, index) => ({
    ...slide,
    slideIndex: index,
    totalSlides: total,
  }));
};

const readCachedPostData = (): PostData | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(POST_CACHE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const generos = parsed.generos;
    const format = parsed.format;
    const fechaDesde = parsed.fechaDesde;
    const fechaHasta = parsed.fechaHasta;
    const days = parsed.days;

    if (!Array.isArray(generos) || !generos.every((item) => typeof item === "string" && GENDER_VALUES.has(item))) {
      return null;
    }

    if (typeof fechaDesde !== "string" || typeof fechaHasta !== "string") {
      return null;
    }

    if (typeof format !== "undefined" && (typeof format !== "string" || !FORMAT_VALUES.has(format))) {
      return null;
    }

    if (!Array.isArray(days)) {
      return null;
    }

    for (const day of days) {
      if (!isRecord(day) || typeof day.id !== "string" || typeof day.diaLabel !== "string" || !Array.isArray(day.items)) {
        return null;
      }

      for (const item of day.items) {
        if (
          !isRecord(item) ||
          typeof item.id !== "string" ||
          typeof item.categoria !== "string" ||
          typeof item.hora !== "string" ||
          typeof item.lugar !== "string" ||
          typeof item.estado !== "string" ||
          !STATUS_VALUES.has(item.estado)
        ) {
          return null;
        }
      }
    }

    return {
      titulo: "TORNEOS AMERICANOS",
      format: (format ?? "historia") as PostFormat,
      generos,
      fechaDesde,
      fechaHasta,
      days,
    };
  } catch {
    return null;
  }
};

export function PostBuilder() {
  const [data, setData] = useState<PostData>(() => defaultPostData());
  const [cacheReady, setCacheReady] = useState(false);
  const debouncedData = useDebouncedValue(data, 120);
  const errors = useMemo(() => validatePostData(data), [data]);
  const hasCriticalErrors = errors.length > 0;

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("builder");
  const [showFloatingMobileTabs, setShowFloatingMobileTabs] = useState(false);
  const mobileTabScrollRef = useRef<Record<MobileTab, number>>({ builder: 0, preview: 0 });

  const [measureRequest, setMeasureRequest] = useState<SlideMeasureRequest | null>(null);
  const requestSeqRef = useRef(0);
  const computeVersionRef = useRef(0);
  const pendingMeasureRef = useRef<PendingMeasure | null>(null);

  const [exportingCurrent, setExportingCurrent] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const exportRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const cachedData = readCachedPostData();
    if (cachedData) {
      setData(cachedData);
    }
    setCacheReady(true);
  }, []);

  useEffect(() => {
    if (!cacheReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(POST_CACHE_KEY, JSON.stringify(data));
  }, [cacheReady, data]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const visibilityThreshold = 140;
    let isTicking = false;

    const updateFloatingTabs = () => {
      const shouldShow = window.scrollY > visibilityThreshold;
      setShowFloatingMobileTabs((previous) => (previous === shouldShow ? previous : shouldShow));
    };

    const handleScroll = () => {
      if (isTicking) {
        return;
      }

      isTicking = true;
      requestAnimationFrame(() => {
        updateFloatingTabs();
        isTicking = false;
      });
    };

    updateFloatingTabs();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const measureCandidate = useCallback((candidateDays: DaySlice[], version: number) => {
    return new Promise<boolean>((resolve) => {
      const nextId = requestSeqRef.current + 1;
      requestSeqRef.current = nextId;

      pendingMeasureRef.current = {
        id: nextId,
        version,
        resolve,
      };

      setMeasureRequest({
        id: nextId,
        version,
        candidateDays,
      });
    });
  }, []);

  const handleMeasured = useCallback((id: number, version: number, fits: boolean) => {
    const pending = pendingMeasureRef.current;
    if (!pending) {
      return;
    }
    if (pending.id !== id || pending.version !== version) {
      return;
    }

    pending.resolve(fits);
    pendingMeasureRef.current = null;
    setMeasureRequest((previous) => (previous?.id === id ? null : previous));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const version = computeVersionRef.current + 1;
    computeVersionRef.current = version;

    const run = async () => {
      const nextSlides = await computeSlides(debouncedData, (candidateDays) => measureCandidate(candidateDays, version));
      if (cancelled || computeVersionRef.current !== version) {
        return;
      }

      const nextSlidesWithClosing = withClosingSlide(nextSlides, debouncedData.format);
      setSlides(nextSlidesWithClosing);
      setCurrentSlide((previous) => Math.min(previous, Math.max(nextSlidesWithClosing.length - 1, 0)));
    };

    void run();

    return () => {
      cancelled = true;
      const pending = pendingMeasureRef.current;
      if (pending && pending.version === version) {
        pending.resolve(false);
        pendingMeasureRef.current = null;
      }
    };
  }, [debouncedData, measureCandidate]);

  const setExportRef = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      exportRefs.current[index] = node;
    },
    [],
  );

  const getExportNode = useCallback(async (slide: SlideData) => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const node = exportRefs.current[slide.slideIndex];
    if (!node) {
      throw new Error("No se encontró el nodo para exportar.");
    }

    return node;
  }, []);

  const onExportCurrent = useCallback(async () => {
    const activeSlide = slides[currentSlide];
    if (!activeSlide) {
      return;
    }

    const node = exportRefs.current[activeSlide.slideIndex];
    if (!node) {
      return;
    }

    setExportingCurrent(true);
    try {
      await exportCurrentSlidePng(node, currentSlide, data.format);
    } finally {
      setExportingCurrent(false);
    }
  }, [slides, currentSlide, data.format]);

  const onExportAll = useCallback(async () => {
    if (slides.length === 0) {
      return;
    }

    setExportingAll(true);
    try {
      await exportAllSlidesZip(slides, getExportNode, data.format);
    } finally {
      setExportingAll(false);
    }
  }, [slides, getExportNode, data.format]);

  const onResetAll = useCallback(() => {
    setData(defaultPostData());
    setCurrentSlide(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(POST_CACHE_KEY);
    }
  }, []);

  const handleMobileTabChange = useCallback(
    (nextTab: MobileTab) => {
      if (nextTab === mobileTab) {
        return;
      }

      if (typeof window !== "undefined") {
        mobileTabScrollRef.current[mobileTab] = window.scrollY;
      }

      setMobileTab(nextTab);

      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          window.scrollTo(0, mobileTabScrollRef.current[nextTab] ?? 0);
        });
      }
    },
    [mobileTab],
  );

  return (
    <main className="min-h-screen px-4 py-4 pb-24 md:px-6 md:py-6 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:pb-6">
      <header className="mx-auto mb-4 flex w-full max-w-[1780px] items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logos/otp-logo.svg" alt="OTP" className="h-12 w-12 rounded-full object-contain" />
          <div>
            <p className="text-xs tracking-[0.24em] text-white/70">OTP CREATOR</p>
            <h1 className="text-xl font-semibold">Instagram Builder</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto mb-4 flex max-w-[1780px] gap-2 rounded-xl border border-white/15 bg-white/8 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => handleMobileTabChange("builder")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mobileTab === "builder" ? "bg-white/20" : "bg-transparent"}`}
        >
          Builder
        </button>
        <button
          type="button"
          onClick={() => handleMobileTabChange("preview")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mobileTab === "preview" ? "bg-white/20" : "bg-transparent"}`}
        >
          Preview
        </button>
      </div>

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4 transition-all duration-300 ease-out lg:hidden ${
          showFloatingMobileTabs ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="pointer-events-auto mx-auto flex w-full max-w-[1780px] gap-2 rounded-xl border border-white/20 bg-[#092bb6]/90 p-1 shadow-[0_20px_45px_rgba(2,8,34,0.45)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleMobileTabChange("builder")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mobileTab === "builder" ? "bg-white/20" : "bg-transparent"}`}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => handleMobileTabChange("preview")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mobileTab === "preview" ? "bg-white/20" : "bg-transparent"}`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1780px] gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[40%_60%]">
        <section className={`${mobileTab === "builder" ? "block" : "hidden"} otp-scrollbar lg:block lg:min-h-0 lg:overflow-y-auto lg:pr-2`}>
          <BuilderForm data={data} onChange={setData} onReset={onResetAll} errors={errors} />
        </section>

        <section className={`${mobileTab === "preview" ? "flex" : "hidden"} otp-scrollbar flex-col gap-4 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pl-2`}>
          <ExportButtons
            disabled={hasCriticalErrors || slides.length === 0}
            exportingCurrent={exportingCurrent}
            exportingAll={exportingAll}
            onExportCurrent={() => {
              void onExportCurrent();
            }}
            onExportAll={() => {
              void onExportAll();
            }}
          />
          <SlidesPreview
            data={data}
            slides={slides}
            currentSlide={currentSlide}
            onChangeSlide={setCurrentSlide}
            resizeSignal={mobileTab}
          />
        </section>
      </div>

      <SlideMeasurer data={debouncedData} request={measureRequest} onMeasured={handleMeasured} />

      <div className="pointer-events-none fixed -left-[30000px] top-0 opacity-0" aria-hidden>
        {slides.map((slide) => (
          <SlideRenderer
            key={`export-${slide.slideIndex}`}
            data={data}
            slide={slide}
            slideRef={setExportRef(slide.slideIndex)}
          />
        ))}
      </div>
    </main>
  );
}
