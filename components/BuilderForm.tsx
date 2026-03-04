"use client";

import type { LucideIcon } from "lucide-react";
import { Mars, Venus, VenusAndMars } from "lucide-react";
import { nanoid } from "nanoid";
import { DayEditor } from "@/components/DayEditor";
import { CATEGORY_OPTIONS, VENUE_OPTIONS } from "@/lib/tournamentOptions";
import type { DayBlock, Gender, PostData, TournamentItem, ValidationError } from "@/lib/types";

type BuilderFormProps = {
  data: PostData;
  onChange: (next: PostData) => void;
  errors: ValidationError[];
};

const buildEmptyTournament = (): TournamentItem => ({
  id: nanoid(),
  categoria: CATEGORY_OPTIONS[0],
  hora: "13:00",
  lugar: VENUE_OPTIONS[0],
  estado: "DISPONIBLE",
});

const buildEmptyDay = (): DayBlock => ({
  id: nanoid(),
  diaLabel: "",
  items: [buildEmptyTournament()],
});

const GENERO_OPTIONS: { label: Gender; Icon: LucideIcon }[] = [
  { label: "Masculino", Icon: Mars },
  { label: "Femenino", Icon: Venus },
  { label: "Mixto", Icon: VenusAndMars },
];

const reorder = <T,>(list: T[], from: number, to: number): T[] => {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

export function BuilderForm({ data, onChange, errors }: BuilderFormProps) {
  const updateTopField = (field: "fechaDesde" | "fechaHasta", value: string) => {
    onChange({ ...data, [field]: value });
  };

  const toggleGenero = (genero: Gender, checked: boolean) => {
    const nextGeneros = checked ? [...data.generos, genero] : data.generos.filter((item) => item !== genero);
    onChange({ ...data, generos: nextGeneros });
  };

  const updateDays = (updater: (days: DayBlock[]) => DayBlock[]) => {
    onChange({ ...data, days: updater(data.days) });
  };

  const addDay = () => {
    updateDays((days) => [...days, buildEmptyDay()]);
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
      items: [...day.items, buildEmptyTournament()],
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
        <h2 className="text-base font-semibold">Datos generales</h2>
        <div className="mt-3 grid gap-3">
          <fieldset className="rounded-xl border border-white/15 bg-white/8 p-3">
            <legend className="px-2 text-xs font-semibold text-white/80">Géneros (se pueden combinar)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {GENERO_OPTIONS.map(({ label, Icon }) => {
                const isSelected = data.generos.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleGenero(label, !isSelected)}
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
            className="rounded-lg border border-[var(--otp-lime)]/80 bg-[var(--otp-lime)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--otp-lime)]"
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
            />
          ))}
        </div>
      </section>

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
