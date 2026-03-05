"use client";

import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Mars, Venus, VenusAndMars } from "lucide-react";
import { nanoid } from "nanoid";
import { DayEditor } from "@/components/DayEditor";
import { SponsorsUploader } from "@/components/SponsorsUploader";
import { CATEGORY_OPTIONS, getCategoryOptionsForGeneros, VENUE_OPTIONS } from "@/lib/tournamentOptions";
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

const buildEmptyDay = (defaultCategory: string): DayBlock => ({
  id: nanoid(),
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

const normalizeTournamentCategories = (
  days: DayBlock[],
  categoryOptions: string[],
  fallbackCategory: string,
): DayBlock[] => {
  const allowedCategories = new Set(categoryOptions);
  let hasChanges = false;

  const nextDays = days.map((day) => {
    let dayChanged = false;
    const nextItems = day.items.map((item) => {
      if (allowedCategories.has(item.categoria)) {
        return item;
      }

      dayChanged = true;
      hasChanges = true;
      return { ...item, categoria: fallbackCategory };
    });

    if (!dayChanged) {
      return day;
    }

    return {
      ...day,
      items: nextItems,
    };
  });

  return hasChanges ? nextDays : days;
};

export function BuilderForm({ data, onChange, onReset, errors }: BuilderFormProps) {
  const categoryOptions = useMemo(() => getCategoryOptionsForGeneros(data.generos), [data.generos]);
  const defaultCategory = categoryOptions[0] ?? CATEGORY_OPTIONS[0];

  const updateTopField = <K extends "fechaDesde" | "fechaHasta" | "format">(field: K, value: TournamentPostData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const toggleGenero = (genero: Gender, checked: boolean) => {
    const nextGeneros = checked
      ? data.generos.includes(genero)
        ? data.generos
        : [...data.generos, genero]
      : data.generos.filter((item) => item !== genero);

    const nextCategoryOptions = getCategoryOptionsForGeneros(nextGeneros);
    const nextDefaultCategory = nextCategoryOptions[0] ?? CATEGORY_OPTIONS[0];
    const normalizedDays = normalizeTournamentCategories(data.days, nextCategoryOptions, nextDefaultCategory);

    onChange({
      ...data,
      generos: nextGeneros,
      days: normalizedDays,
    });
  };

  const updateDays = (updater: (days: DayBlock[]) => DayBlock[]) => {
    onChange({ ...data, days: updater(data.days) });
  };

  useEffect(() => {
    const normalizedDays = normalizeTournamentCategories(data.days, categoryOptions, defaultCategory);
    if (normalizedDays !== data.days) {
      onChange({ ...data, days: normalizedDays });
    }
  }, [categoryOptions, data, defaultCategory, onChange]);

  const addDay = () => {
    updateDays((days) => [...days, buildEmptyDay(defaultCategory)]);
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
      items: [...day.items, buildEmptyTournament(defaultCategory)],
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

        <div className="space-y-3">
          {data.days.map((day, dayIndex) => (
            <DayEditor
              key={day.id}
              day={day}
              dayIndex={dayIndex}
              totalDays={data.days.length}
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
              categoryOptions={categoryOptions}
            />
          ))}
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
