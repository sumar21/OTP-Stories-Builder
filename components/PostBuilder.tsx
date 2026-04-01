"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuilderForm } from "@/components/BuilderForm";
import { ExportButtons } from "@/components/ExportButtons";
import { LoosePlayerBuilderForm } from "@/components/LoosePlayerBuilderForm";
import { ParticipantsBuilderForm } from "@/components/ParticipantsBuilderForm";
import { SlideMeasurer } from "@/components/SlideMeasurer";
import type { SlideMeasureRequest } from "@/components/SlideMeasurer";
import { SlideRenderer } from "@/components/SlideRenderer";
import { SlidesPreview } from "@/components/SlidesPreview";
import { computeSlides } from "@/lib/computeSlides";
import { defaultLoosePlayerPostData, defaultParticipantsPostData, defaultTournamentPostData } from "@/lib/defaultPostData";
import { getDefaultSponsors } from "@/lib/defaultSponsors";
import { exportAllSlidesZip, exportCurrentSlidePng } from "@/lib/exportSlides";
import { TOURNAMENT_COVER_VARIANTS } from "@/lib/tournamentCoverOptions";
import { getGenderFromCategory, getOrderedGeneros } from "@/lib/tournamentOptions";
import type {
  DaySlice,
  Gender,
  LoosePlayerPost,
  LoosePlayerSlideData,
  ParticipantCard,
  ParticipantsPost,
  ParticipantsSlideData,
  PostFormat,
  PostType,
  SlideData,
  Sponsor,
  TournamentPostData,
  TournamentSlideData,
  VoucherPosition,
} from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { validatePostData } from "@/lib/validators";

const POST_CACHE_KEY = "otp-post-builder-data-v1";
const GENDER_VALUES = new Set(["Masculino", "Femenino", "Mixto"]);
const STATUS_VALUES = new Set(["DISPONIBLE", "ULTIMOS_CUPOS", "COMPLETO"]);
const FORMAT_VALUES = new Set(["historia", "posteo"]);
const HAND_VALUES = new Set(["DRIVE", "REVES", "INDISTINTO"]);
const POST_TYPE_VALUES = new Set(["torneos", "jugador_suelto", "participantes"]);
const LOOSE_PLAYER_WANTED_VALUES = new Set(["Dama", "Caballero", "Indistinto"]);
const PARTICIPANTS_RESULT_VALUES = new Set(["campeones", "subcampeones"]);
const PARTICIPANTS_CUP_VALUES = new Set(["oro", "plata"]);
const TOURNAMENT_COVER_VARIANT_VALUES = new Set(TOURNAMENT_COVER_VARIANTS);

type PendingMeasure = {
  id: number;
  version: number;
  resolve: (fits: boolean) => void;
};

type MobileTab = "builder" | "preview";

type BuilderState = {
  activePostType: PostType;
  tournaments: TournamentPostData;
  loosePlayer: LoosePlayerPost;
  participants: ParticipantsPost;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const normalizeLoosePlayerVenue = (venue: string): string => {
  return venue === "WPC" ? "WPC Nordelta" : venue;
};

const normalizeSponsors = (value: unknown): Sponsor[] => {
  if (!Array.isArray(value)) {
    return getDefaultSponsors();
  }

  const sponsors = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      if (typeof item.id !== "string" || typeof item.name !== "string" || typeof item.logoDataUrl !== "string") {
        return null;
      }

      return {
        id: item.id,
        name: item.name,
        logoDataUrl: item.logoDataUrl,
      } satisfies Sponsor;
    })
    .filter(Boolean) as Sponsor[];

  return sponsors.length > 0 ? sponsors : getDefaultSponsors();
};

const withCoverAndClosingSlides = (baseSlides: TournamentSlideData[], format: PostFormat): SlideData[] => {
  if (baseSlides.length === 0) {
    return [];
  }

  const slides: SlideData[] = [...baseSlides];
  if (format === "posteo") {
    slides.unshift({
      slideIndex: 0,
      totalSlides: slides.length + 2,
      type: "cover",
      days: [],
    });
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

const parseTournamentData = (value: unknown): TournamentPostData | null => {
  if (!isRecord(value)) {
    return null;
  }

  const generos = value.generos;
  const format = value.format;
  const fechaDesde = value.fechaDesde;
  const fechaHasta = value.fechaHasta;
  const coverVariant = value.coverVariant;
  const days = value.days;

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
    if (
      !isRecord(day) ||
      typeof day.id !== "string" ||
      typeof day.diaLabel !== "string" ||
      (typeof day.genero !== "undefined" && (typeof day.genero !== "string" || !GENDER_VALUES.has(day.genero))) ||
      !Array.isArray(day.items)
    ) {
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
    postType: "torneos",
    titulo: "TORNEOS AMERICANOS",
    format: (format ?? "historia") as PostFormat,
    generos,
    fechaDesde,
    fechaHasta,
    coverVariant:
      typeof coverVariant === "string" && TOURNAMENT_COVER_VARIANT_VALUES.has(coverVariant as (typeof TOURNAMENT_COVER_VARIANTS)[number])
        ? (coverVariant as TournamentPostData["coverVariant"])
        : "1",
    days,
    sponsors: normalizeSponsors(value.sponsors),
  };
};

const parseLoosePlayerData = (value: unknown): LoosePlayerPost | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.categoria !== "string" ||
    typeof value.fecha !== "string" ||
    typeof value.hora !== "string" ||
    typeof value.sede !== "string"
  ) {
    return null;
  }

  if (typeof value.mano !== "undefined" && (typeof value.mano !== "string" || !HAND_VALUES.has(value.mano))) {
    return null;
  }

  if (typeof value.subtitulo !== "undefined" && typeof value.subtitulo !== "string") {
    return null;
  }

  const buscamos = value.buscamos;
  const resolvedBuscamos =
    typeof buscamos === "string" && LOOSE_PLAYER_WANTED_VALUES.has(buscamos) ? (buscamos as LoosePlayerPost["buscamos"]) : "Indistinto";

  return {
    postType: "jugador_suelto",
    titulo: "BUSCAMOS JUGADOR",
    subtitulo: typeof value.subtitulo === "string" ? value.subtitulo : "TORNEO AMERICANO",
    categoria: value.categoria,
    buscamos: resolvedBuscamos,
    categoriaBuscada: typeof value.categoriaBuscada === "string" ? value.categoriaBuscada : "",
    fecha: value.fecha,
    hora: value.hora,
    sede: normalizeLoosePlayerVenue(value.sede),
    mano: value.mano as LoosePlayerPost["mano"],
  };
};

const parseParticipantsData = (value: unknown): ParticipantsPost | null => {
  if (!isRecord(value) || !Array.isArray(value.cards)) {
    return null;
  }

  const cards: ParticipantCard[] = [];
  for (const card of value.cards) {
    if (
      !isRecord(card) ||
      typeof card.id !== "string" ||
      typeof card.fotoDataUrl !== "string" ||
      typeof card.categoria !== "string" ||
      typeof card.nombreParticipante1 !== "string" ||
      typeof card.nombreParticipante2 !== "string" ||
      typeof card.fecha !== "string" ||
      typeof card.resultado !== "string" ||
      !PARTICIPANTS_RESULT_VALUES.has(card.resultado) ||
      typeof card.copa !== "string" ||
      !PARTICIPANTS_CUP_VALUES.has(card.copa)
    ) {
      return null;
    }

    const posRaw = isRecord(card.valorVoucherPos) ? card.valorVoucherPos : null;
    const valorVoucherPos: ParticipantCard["valorVoucherPos"] =
      posRaw && typeof posRaw.x === "number" && typeof posRaw.y === "number"
        ? { x: posRaw.x, y: posRaw.y }
        : { x: 50, y: 40 };

    cards.push({
      id: card.id,
      fotoDataUrl: card.fotoDataUrl,
      categoria: card.categoria,
      nombreParticipante1: card.nombreParticipante1,
      nombreParticipante2: card.nombreParticipante2,
      fecha: card.fecha,
      resultado: card.resultado as ParticipantCard["resultado"],
      copa: card.copa as ParticipantCard["copa"],
      valorVoucher: typeof card.valorVoucher === "string" ? card.valorVoucher : "",
      valorVoucherPos,
      valorVoucherSize: typeof card.valorVoucherSize === "number" ? card.valorVoucherSize : 64,
      valorVoucherRotation: typeof card.valorVoucherRotation === "number" ? card.valorVoucherRotation : 0,
    });
  }

  return {
    postType: "participantes",
    titulo: "PARTICIPANTES DEL TORNEO",
    cards,
  };
};

const buildParticipantsSlides = (cards: ParticipantCard[]): ParticipantsSlideData[] => {
  const total = cards.length;
  return cards.map((card, index) => ({
    slideIndex: index,
    totalSlides: total,
    type: "participants",
    card,
    days: [],
  }));
};

const filterDaysByGenero = (data: TournamentPostData, genero: Gender) => {
  return data.days
    .filter((day) => {
      if (day.genero) {
        return day.genero === genero;
      }

      return day.items.some((item) => getGenderFromCategory(item.categoria) === genero);
    })
    .map((day) => ({
      ...day,
      items: day.items.filter((item) => getGenderFromCategory(item.categoria) === genero),
    }))
    .filter((day) => day.items.length > 0);
};

const buildTournamentSlides = async (
  data: TournamentPostData,
  version: number,
  measureCandidate: (candidateDays: DaySlice[], version: number, genero?: Gender) => Promise<boolean>,
): Promise<TournamentSlideData[]> => {
  const orderedGeneros = data.generos.length > 0 ? getOrderedGeneros(data.generos) : [];
  const groups =
    orderedGeneros.length > 0
      ? orderedGeneros
          .map((genero) => ({
            genero,
            days: filterDaysByGenero(data, genero),
          }))
          .filter((group) => group.days.length > 0)
      : [
          {
            genero: undefined,
            days: data.days,
          },
        ];

  if (groups.length === 0) {
    const fallbackSlides = await computeSlides(data, (candidateDays) => measureCandidate(candidateDays, version));
    return fallbackSlides.map((slide) => ({
      ...slide,
      genero: orderedGeneros.length === 1 ? orderedGeneros[0] : undefined,
    }));
  }

  const groupedSlides: TournamentSlideData[] = [];

  for (const group of groups) {
    const slidesForGenero = await computeSlides(
      {
        ...data,
        generos: group.genero ? [group.genero] : data.generos,
        days: group.days,
      },
      (candidateDays) => measureCandidate(candidateDays, version, group.genero),
    );

    groupedSlides.push(
      ...slidesForGenero.map((slide) => ({
        ...slide,
        genero: group.genero,
      })),
    );
  }

  return groupedSlides;
};

const buildCacheState = (state: BuilderState, options?: { stripParticipantPhotos?: boolean }): BuilderState => ({
  ...state,
  participants: options?.stripParticipantPhotos
    ? {
        ...state.participants,
        cards: state.participants.cards.map((card) => ({
          ...card,
          fotoDataUrl: "",
        })),
      }
    : state.participants,
});

const isQuotaExceededError = (error: unknown): boolean => {
  if (!isRecord(error)) {
    return false;
  }

  const name = typeof error.name === "string" ? error.name : "";
  const code = typeof error.code === "number" ? error.code : 0;

  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED" || code === 22 || code === 1014;
};

const persistBuilderState = (state: BuilderState): void => {
  const payloads = [buildCacheState(state), buildCacheState(state, { stripParticipantPhotos: true })];

  for (const payload of payloads) {
    try {
      window.localStorage.setItem(POST_CACHE_KEY, JSON.stringify(payload));
      return;
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        console.warn("No se pudo guardar el estado del builder en localStorage.", error);
        return;
      }
    }
  }

  window.localStorage.removeItem(POST_CACHE_KEY);
};

const buildDefaultState = (): BuilderState => ({
  activePostType: "torneos",
  tournaments: defaultTournamentPostData(),
  loosePlayer: defaultLoosePlayerPostData(),
  participants: defaultParticipantsPostData(),
});

const readCachedBuilderState = (): BuilderState | null => {
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

    // Backward compatibility with older cache containing only tournament data.
    const oldTournament = parseTournamentData(parsed);
    if (oldTournament) {
      return {
        activePostType: "torneos",
        tournaments: oldTournament,
        loosePlayer: defaultLoosePlayerPostData(),
        participants: defaultParticipantsPostData(),
      };
    }

    const activePostType = parsed.activePostType;
    const tournaments = parseTournamentData(parsed.tournaments);
    const loosePlayer = parseLoosePlayerData(parsed.loosePlayer);
    const participants = parseParticipantsData(parsed.participants) ?? defaultParticipantsPostData();

    if (
      typeof activePostType !== "string" ||
      !POST_TYPE_VALUES.has(activePostType) ||
      !tournaments ||
      !loosePlayer
    ) {
      return null;
    }

    return {
      activePostType: activePostType as PostType,
      tournaments,
      loosePlayer,
      participants,
    };
  } catch {
    return null;
  }
};

export function PostBuilder() {
  const [state, setState] = useState<BuilderState>(() => buildDefaultState());
  const [cacheReady, setCacheReady] = useState(false);
  const activeData =
    state.activePostType === "torneos"
      ? state.tournaments
      : state.activePostType === "jugador_suelto"
        ? state.loosePlayer
        : state.participants;
  const debouncedActiveData = useDebouncedValue(activeData, 120);
  const errors = useMemo(() => validatePostData(activeData), [activeData]);

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
    const cachedState = readCachedBuilderState();
    if (cachedState) {
      setState(cachedState);
    }
    setCacheReady(true);
  }, []);

  useEffect(() => {
    if (!cacheReady || typeof window === "undefined") {
      return;
    }

    persistBuilderState(state);
  }, [cacheReady, state]);

  useEffect(() => {
    if (state.loosePlayer.sede !== "WPC") {
      return;
    }

    setState((previous) => ({
      ...previous,
      loosePlayer: {
        ...previous.loosePlayer,
        sede: normalizeLoosePlayerVenue(previous.loosePlayer.sede),
      },
    }));
  }, [state.loosePlayer.sede]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [state.activePostType]);

  useEffect(() => {
    if (state.activePostType !== "torneos" || state.tournaments.format !== "posteo") {
      return;
    }

    setCurrentSlide(0);
  }, [state.activePostType, state.tournaments.format, state.tournaments.coverVariant]);

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

  const measureCandidate = useCallback((candidateDays: DaySlice[], version: number, genero?: Gender) => {
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
        genero,
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

    if (debouncedActiveData.postType === "jugador_suelto") {
      const looseSlide: LoosePlayerSlideData = {
        slideIndex: 0,
        totalSlides: 1,
        type: "loose-player",
        days: [],
      };

      setMeasureRequest(null);
      const pending = pendingMeasureRef.current;
      if (pending) {
        pending.resolve(false);
        pendingMeasureRef.current = null;
      }

      setSlides([looseSlide]);
      setCurrentSlide(0);
      return () => {
        cancelled = true;
      };
    }

    if (debouncedActiveData.postType === "participantes") {
      setMeasureRequest(null);
      const pending = pendingMeasureRef.current;
      if (pending) {
        pending.resolve(false);
        pendingMeasureRef.current = null;
      }

      const participantSlides = buildParticipantsSlides(debouncedActiveData.cards);
      setSlides(participantSlides);
      setCurrentSlide((previous) => Math.min(previous, Math.max(participantSlides.length - 1, 0)));
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      const nextSlides = await buildTournamentSlides(debouncedActiveData, version, measureCandidate);
      if (cancelled || computeVersionRef.current !== version) {
        return;
      }

      const nextSlidesWithClosing = withCoverAndClosingSlides(nextSlides, debouncedActiveData.format);
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
  }, [debouncedActiveData, measureCandidate]);

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

  const exportFormat =
    activeData.postType === "torneos" ? activeData.format : activeData.postType === "participantes" ? "posteo" : "historia";
  const filePrefix =
    activeData.postType === "torneos"
      ? "otp_torneos_americanos"
      : activeData.postType === "jugador_suelto"
        ? "otp_jugador_suelto"
        : "otp_participantes_torneo";

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
      await exportCurrentSlidePng(node, currentSlide, exportFormat, filePrefix);
    } finally {
      setExportingCurrent(false);
    }
  }, [slides, currentSlide, exportFormat, filePrefix]);

  const onExportAll = useCallback(async () => {
    if (slides.length === 0) {
      return;
    }

    setExportingAll(true);
    try {
      await exportAllSlidesZip(slides, getExportNode, exportFormat, filePrefix);
    } finally {
      setExportingAll(false);
    }
  }, [slides, getExportNode, exportFormat, filePrefix]);

  const onResetAll = useCallback(() => {
    setState((previous) => {
      if (previous.activePostType === "torneos") {
        return {
          ...previous,
          tournaments: defaultTournamentPostData(),
        };
      }
      if (previous.activePostType === "jugador_suelto") {
        return {
          ...previous,
          loosePlayer: defaultLoosePlayerPostData(),
        };
      }

      return {
        ...previous,
        participants: defaultParticipantsPostData(),
      };
    });
    setCurrentSlide(0);
  }, []);

  const updateTournamentData = useCallback((next: TournamentPostData) => {
    setState((previous) => ({ ...previous, tournaments: next }));
  }, []);

  const updateLooseData = useCallback((next: LoosePlayerPost) => {
    setState((previous) => ({ ...previous, loosePlayer: next }));
  }, []);

  const updateParticipantsData = useCallback((next: ParticipantsPost) => {
    setState((previous) => ({ ...previous, participants: next }));
  }, []);

  const handleVoucherPositionChange = useCallback((cardId: string, pos: VoucherPosition) => {
    setState((previous) => ({
      ...previous,
      participants: {
        ...previous.participants,
        cards: previous.participants.cards.map((c) => (c.id === cardId ? { ...c, valorVoucherPos: pos } : c)),
      },
    }));
  }, []);

  const handlePostTypeChange = (postType: PostType) => {
    setState((previous) => ({ ...previous, activePostType: postType }));
  };

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
          <section className="mb-5 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md">
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handlePostTypeChange("torneos")}
                aria-pressed={state.activePostType === "torneos"}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  state.activePostType === "torneos"
                    ? "border border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[var(--otp-blue)] shadow-[0_10px_24px_rgba(201,253,46,0.22)]"
                    : "border border-white/15 bg-white/[0.06] text-white/90 hover:bg-white/[0.1]"
                }`}
              >
                Torneos Americanos
              </button>
              <button
                type="button"
                onClick={() => handlePostTypeChange("jugador_suelto")}
                aria-pressed={state.activePostType === "jugador_suelto"}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  state.activePostType === "jugador_suelto"
                    ? "border border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[var(--otp-blue)] shadow-[0_10px_24px_rgba(201,253,46,0.22)]"
                    : "border border-white/15 bg-white/[0.06] text-white/90 hover:bg-white/[0.1]"
                }`}
              >
                Jugador Suelto
              </button>
              <button
                type="button"
                onClick={() => handlePostTypeChange("participantes")}
                aria-pressed={state.activePostType === "participantes"}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  state.activePostType === "participantes"
                    ? "border border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[var(--otp-blue)] shadow-[0_10px_24px_rgba(201,253,46,0.22)]"
                    : "border border-white/15 bg-white/[0.06] text-white/90 hover:bg-white/[0.1]"
                }`}
              >
                Participantes
              </button>
            </div>
          </section>

          {state.activePostType === "torneos" ? (
            <BuilderForm data={state.tournaments} onChange={updateTournamentData} onReset={onResetAll} errors={errors} />
          ) : state.activePostType === "jugador_suelto" ? (
            <LoosePlayerBuilderForm data={state.loosePlayer} onChange={updateLooseData} onReset={onResetAll} errors={errors} />
          ) : (
            <ParticipantsBuilderForm
              data={state.participants}
              onChange={updateParticipantsData}
              onReset={onResetAll}
              errors={errors}
            />
          )}
        </section>

        <section className={`${mobileTab === "preview" ? "flex" : "hidden"} otp-scrollbar flex-col gap-4 lg:flex lg:min-h-0 lg:overflow-y-auto lg:pl-2`}>
          <ExportButtons
            disabled={slides.length === 0}
            showExportAll={activeData.postType !== "jugador_suelto" && slides.length > 1}
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
            data={activeData}
            slides={slides}
            currentSlide={currentSlide}
            onChangeSlide={setCurrentSlide}
            resizeSignal={mobileTab}
            onVoucherPositionChange={state.activePostType === "participantes" ? handleVoucherPositionChange : undefined}
          />
        </section>
      </div>

      <SlideMeasurer data={state.tournaments} request={measureRequest} onMeasured={handleMeasured} />

      <div className="pointer-events-none fixed -left-[30000px] top-0 opacity-0" aria-hidden>
        {slides.map((slide) => (
          <SlideRenderer key={`export-${slide.slideIndex}`} data={activeData} slide={slide} slideRef={setExportRef(slide.slideIndex)} />
        ))}
      </div>
    </main>
  );
}
