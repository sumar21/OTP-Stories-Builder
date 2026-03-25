"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Mars, Venus, VenusAndMars } from "lucide-react";
import { nanoid } from "nanoid";
import { DayEditor } from "@/components/DayEditor";
import { SponsorsUploader } from "@/components/SponsorsUploader";
import { TOURNAMENT_COVER_OPTIONS } from "@/lib/tournamentCoverOptions";
import {
  CATEGORY_OPTIONS,
  CATEGORY_OPTIONS_BY_GENDER,
  getCategoryOptionGroupsForGeneros,
  getCategoryOptionsForGeneros,
  getGenderFromCategory,
  getOrderedGeneros,
  VENUE_OPTIONS,
} from "@/lib/tournamentOptions";
import type { DayBlock, Gender, PostFormat, TournamentItem, TournamentPostData, ValidationError } from "@/lib/types";

type BuilderFormProps = {
  data: TournamentPostData;
  onChange: (next: TournamentPostData) => void;
  onReset: () => void;
  errors: ValidationError[];
};

const buildEmptyTournament = (defaultCategory: string): TournamentItem => ({
  id: nanoid(),
  categoria: defaultCategory,
  hora: "13:00",
  lugar: VENUE_OPTIONS[0],
  estado: "DISPONIBLE",
});

const buildEmptyDay = (defaultCategory: string, genero?: Gender): DayBlock => ({
  id: nanoid(),
  genero,
  diaLabel: "",
  items: [buildEmptyTournament(defaultCategory)],
});

const GENERO_OPTIONS: { value: Gender; label: string; Icon: LucideIcon }[] = [
  { value: "Masculino", label: "Caballeros", Icon: Mars },
  { value: "Femenino", label: "Damas", Icon: Venus },
  { value: "Mixto", label: "Mixto", Icon: VenusAndMars },
];

const FORMAT_OPTIONS: { value: PostFormat; label: string; description: string }[] = [
  { value: "historia", label: "Historia", description: "1080x1920" },
  { value: "posteo", label: "Posteo", description: "1080x1350" },
];

const reorder = <T,>(list: T[], from: number, to: number): T[] => {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

const DAY_ID_GENERO_SEPARATOR = "__";

const getDayGenero = (day: DayBlock): Gender | undefined => {
  if (day.genero) {
    return day.genero;
  }

  const itemGeneros = Array.from(
    new Set(day.items.map((item) => getGenderFromCategory(item.categoria)).filter((genero): genero is Gender => Boolean(genero))),
  );

  return itemGeneros.length === 1 ? itemGeneros[0] : undefined;
};

const normalizeItemsForGenero = (items: TournamentItem[], genero: Gender) => {
  const fallbackCategory = CATEGORY_OPTIONS_BY_GENDER[genero][0] ?? CATEGORY_OPTIONS[0];
  const allowedCategories = new Set(CATEGORY_OPTIONS_BY_GENDER[genero]);
  let changed = false;

  const nextItems = items.map((item) => {
    if (allowedCategories.has(item.categoria)) {
      return item;
    }

    changed = true;
    return {
      ...item,
      categoria: fallbackCategory,
    };
  });

  return {
    items: changed ? nextItems : items,
    changed,
  };
};

const makeScopedDayId = (dayId: string, genero: Gender): string => {
  const suffix = `${DAY_ID_GENERO_SEPARATOR}${genero}`;
  return dayId.endsWith(suffix) ? dayId : `${dayId}${suffix}`;
};

const normalizeTournamentDays = (days: DayBlock[], selectedGeneros: Gender[]): DayBlock[] => {
  if (selectedGeneros.length === 0) {
    return days;
  }

  let hasChanges = false;
  const nextDays: DayBlock[] = [];

  for (const day of days) {
    const groupedItems = new Map<Gender, TournamentItem[]>();
    for (const item of day.items) {
      const genero = getGenderFromCategory(item.categoria);
      if (!genero) {
        continue;
      }

      const currentItems = groupedItems.get(genero) ?? [];
      groupedItems.set(genero, [...currentItems, item]);
    }

    const groupedGeneros = getOrderedGeneros(Array.from(groupedItems.keys()));
    if (!day.genero && selectedGeneros.length > 1 && groupedGeneros.length > 1) {
      hasChanges = true;

      for (const genero of groupedGeneros) {
        const groupItems = groupedItems.get(genero) ?? [];
        nextDays.push({
          ...day,
          id: makeScopedDayId(day.id, genero),
          genero,
          items: groupItems,
        });
      }
      continue;
    }

    let nextGenero = day.genero;
    if (!nextGenero) {
      nextGenero = selectedGeneros.length === 1 ? selectedGeneros[0] : getDayGenero(day);
    }

    let nextItems = day.items;
    if (nextGenero && selectedGeneros.includes(nextGenero)) {
      const normalizedItems = normalizeItemsForGenero(day.items, nextGenero);
      nextItems = normalizedItems.items;
      hasChanges = hasChanges || normalizedItems.changed;
    }

    if (nextGenero !== day.genero || nextItems !== day.items) {
      hasChanges = true;
      nextDays.push({
        ...day,
        genero: nextGenero,
        items: nextItems,
      });
      continue;
    }

    nextDays.push(day);
  }

  return hasChanges ? nextDays : days;
};

const replaceGeneroDays = (days: DayBlock[], genero: Gender, nextGeneroDays: DayBlock[]): DayBlock[] => {
  const nextDays: DayBlock[] = [];
  let inserted = false;

  for (const day of days) {
    if (getDayGenero(day) === genero) {
      if (!inserted) {
        nextDays.push(...nextGeneroDays);
        inserted = true;
      }
      continue;
    }

    nextDays.push(day);
  }

  if (!inserted) {
    nextDays.push(...nextGeneroDays);
  }

  return nextDays;
};

export function BuilderForm({ data, onChange, onReset, errors }: BuilderFormProps) {
  const selectedGeneros = useMemo(() => (data.generos.length > 0 ? getOrderedGeneros(data.generos) : []), [data.generos]);
  const categoryOptions = useMemo(() => getCategoryOptionsForGeneros(data.generos), [data.generos]);
  const [editingGenero, setEditingGenero] = useState<Gender | null>(selectedGeneros[0] ?? null);
  const currentGenero = selectedGeneros.length > 0 ? (editingGenero ?? selectedGeneros[0]) : null;
  const categoryOptionGroups = useMemo(
    () => getCategoryOptionGroupsForGeneros(currentGenero ? [currentGenero] : data.generos),
    [currentGenero, data.generos],
  );
  const defaultCategory = categoryOptions[0] ?? CATEGORY_OPTIONS[0];
  const editorCategoryOptions = currentGenero ? [...CATEGORY_OPTIONS_BY_GENDER[currentGenero]] : categoryOptions;
  const editorDefaultCategory = editorCategoryOptions[0] ?? defaultCategory;
  const visibleDays = useMemo(
    () => (currentGenero ? data.days.filter((day) => getDayGenero(day) === currentGenero) : data.days),
    [currentGenero, data.days],
  );
  const currentGeneroLabel = currentGenero
    ? GENERO_OPTIONS.find((option) => option.value === currentGenero)?.label ?? currentGenero
    : null;

  const updateTopField = <K extends "fechaDesde" | "fechaHasta" | "format" | "coverVariant">(
    field: K,
    value: TournamentPostData[K],
  ) => {
    onChange({ ...data, [field]: value });
  };

  const selectCoverVariant = (coverVariant: TournamentPostData["coverVariant"]) => {
    onChange({
      ...data,
      coverVariant,
      format: "posteo",
    });
  };

  const toggleGenero = (genero: Gender, checked: boolean) => {
    const nextGeneros = checked
      ? data.generos.includes(genero)
        ? data.generos
        : [...data.generos, genero]
      : data.generos.filter((item) => item !== genero);

    onChange({
      ...data,
      generos: nextGeneros,
    });
  };

  const updateDays = (updater: (days: DayBlock[]) => DayBlock[]) => {
    if (!currentGenero) {
      onChange({ ...data, days: updater(data.days) });
      return;
    }

    const nextVisibleDays = updater(visibleDays);
    onChange({ ...data, days: replaceGeneroDays(data.days, currentGenero, nextVisibleDays) });
  };

  useEffect(() => {
    setEditingGenero((previous) => {
      if (selectedGeneros.length === 0) {
        return null;
      }

      return previous && selectedGeneros.includes(previous) ? previous : selectedGeneros[0];
    });
  }, [selectedGeneros]);

  useEffect(() => {
    const normalizedDays = normalizeTournamentDays(data.days, selectedGeneros);
    if (normalizedDays !== data.days) {
      onChange({ ...data, days: normalizedDays });
    }
  }, [data, onChange, selectedGeneros]);

  const addDay = () => {
    updateDays((days) => [...days, buildEmptyDay(editorDefaultCategory, currentGenero ?? undefined)]);
  };

  const updateDay = (dayId: string, updater: (day: DayBlock) => DayBlock) => {
    updateDays((days) => days.map((day) => (day.id === dayId ? updater(day) : day)));
  };

  const removeDay = (dayId: string) => {
    updateDays((days) => days.filter((day) => day.id !== dayId));
  };

  const moveDay = (dayId: string, direction: "up" | "down") => {
    updateDays((days) => {
      const index = days.findIndex((day) => day.id === dayId);
      if (index < 0) {
        return days;
      }
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= days.length) {
        return days;
      }
      return reorder(days, index, target);
    });
  };

  const addTournament = (dayId: string) => {
    updateDay(dayId, (day) => ({
      ...day,
      items: [...day.items, buildEmptyTournament(editorDefaultCategory)],
    }));
  };

  const updateTournament = (dayId: string, itemId: string, patch: Partial<TournamentItem>) => {
    updateDay(dayId, (day) => ({
      ...day,
      items: day.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  };

  const removeTournament = (dayId: string, itemId: string) => {
    updateDay(dayId, (day) => ({
      ...day,
      items: day.items.filter((item) => item.id !== itemId),
    }));
  };

  const moveTournament = (dayId: string, itemId: string, direction: "up" | "down") => {
    updateDay(dayId, (day) => {
      const index = day.items.findIndex((item) => item.id === itemId);
      if (index < 0) {
        return day;
      }
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= day.items.length) {
        return day;
      }
      return {
        ...day,
        items: reorder(day.items, index, target),
      };
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Datos generales</h2>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/20"
          >
            Restablecer todo
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          <fieldset className="m-0 min-w-0 border-0 bg-transparent p-0">
            <legend className="px-0 text-xs font-semibold text-white/80">Formato Instagram</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FORMAT_OPTIONS.map((option) => {
                const isSelected = data.format === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateTopField("format", option.value)}
                    className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left font-semibold transition ${
                      isSelected
                        ? "border-[var(--otp-lime)] bg-[var(--otp-lime)]/25 text-white shadow-[0_0_0_1px_rgba(208,255,81,0.65)]"
                        : "border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-sm font-semibold uppercase">{option.label}</span>
                    <span className="text-xs text-white/75">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="m-0 min-w-0 border-0 bg-transparent p-0">
            <legend className="px-0 text-xs font-semibold text-white/80">Géneros (se pueden combinar)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {GENERO_OPTIONS.map(({ value, label, Icon }) => {
                const isSelected = data.generos.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleGenero(value, !isSelected)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[#0f1216] shadow-[0_0_0_1px_rgba(208,255,81,0.65)]"
                        : "border-[var(--otp-lime)]/65 bg-[var(--otp-lime)]/75 text-[#1c220b] hover:bg-[var(--otp-lime)]/90"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
              Fecha desde
              <input
                type="date"
                value={data.fechaDesde}
                onChange={(event) => updateTopField("fechaDesde", event.target.value)}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
              Fecha hasta
              <input
                type="date"
                value={data.fechaHasta}
                onChange={(event) => updateTopField("fechaHasta", event.target.value)}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
              />
            </label>
          </div>

          <fieldset className="m-0 min-w-0 border-0 bg-transparent p-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-white/80">Portada del carrusel</p>
              {data.format !== "posteo" ? (
                <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white/60 uppercase">
                  Solo en posteo
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-white/60">Se agrega como primera pantalla del carrusel de torneos americanos.</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {TOURNAMENT_COVER_OPTIONS.map((option) => {
                const isSelected = data.coverVariant === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    onClick={() => selectCoverVariant(option.value)}
                    className={`overflow-hidden rounded-2xl border text-left transition ${
                      isSelected
                        ? "border-[var(--otp-lime)] bg-[var(--otp-lime)]/12 shadow-[0_0_0_1px_rgba(208,255,81,0.65)]"
                        : "border-white/15 bg-white/6 hover:bg-white/10"
                    }`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={option.src}
                        alt={option.label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08144c] via-[#08144c]/70 to-transparent px-3 py-2">
                        <span className="text-sm font-semibold text-white">{option.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Días y torneos</h2>
          <button
            type="button"
            onClick={addDay}
            className="rounded-lg border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-3 py-1.5 text-xs font-semibold text-[var(--otp-blue)]"
          >
            + Agregar día
          </button>
        </div>

        {selectedGeneros.length > 1 ? (
          <div className="rounded-xl border border-white/10 bg-white/6 p-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-white/65 uppercase">Género en edición</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {GENERO_OPTIONS.filter((option) => selectedGeneros.includes(option.value)).map(({ value, label, Icon }) => {
                const isSelected = currentGenero === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Editar ${label}`}
                    aria-pressed={isSelected}
                    onClick={() => setEditingGenero(value)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[#0f1216]"
                        : "border-white/20 bg-white/8 text-white/85 hover:bg-white/14"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {currentGeneroLabel ? (
          <p className="text-sm text-white/72">
            Estás editando los torneos de <span className="font-semibold text-[var(--otp-lime)]">{currentGeneroLabel}</span>.
          </p>
        ) : null}

        <div className="space-y-3">
          {visibleDays.map((day, dayIndex) => (
            <DayEditor
              key={day.id}
              day={day}
              dayIndex={dayIndex}
              totalDays={visibleDays.length}
              onLabelChange={(value) => updateDay(day.id, (prev) => ({ ...prev, diaLabel: value }))}
              onRemoveDay={() => removeDay(day.id)}
              onAddTournament={() => addTournament(day.id)}
              onMoveDayUp={() => moveDay(day.id, "up")}
              onMoveDayDown={() => moveDay(day.id, "down")}
              onUpdateTournament={(itemId, patch) => updateTournament(day.id, itemId, patch)}
              onRemoveTournament={(itemId) => removeTournament(day.id, itemId)}
              onMoveTournamentUp={(itemId) => moveTournament(day.id, itemId, "up")}
              onMoveTournamentDown={(itemId) => moveTournament(day.id, itemId, "down")}
              showStatus={data.format === "historia"}
              categoryOptionGroups={categoryOptionGroups}
            />
          ))}

          {visibleDays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-sm text-white/65">
              {currentGeneroLabel
                ? `Todavía no cargaste días para ${currentGeneroLabel}.`
                : "Todavía no cargaste días para este torneo."}
            </div>
          ) : null}
        </div>
      </section>

      <SponsorsUploader sponsors={data.sponsors} onChange={(sponsors) => onChange({ ...data, sponsors })} />

      {errors.length > 0 ? (
        <section className="rounded-2xl border border-red-300/50 bg-red-400/10 p-4 text-sm text-red-50">
          <h3 className="font-semibold">Validaciones pendientes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
            {errors.slice(0, 8).map((error) => (
              <li key={error.path + error.message}>{error.message}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
