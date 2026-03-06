"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowLeftCircle, ArrowRightCircle, Mars, Shuffle, Venus, VenusAndMars } from "lucide-react";
import {
  LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER,
  VENUE_OPTIONS,
  getLoosePlayerCategoryOptionGroupsForGeneros,
} from "@/lib/tournamentOptions";
import type { Gender, Hand, LoosePlayerPost, ValidationError } from "@/lib/types";

type LoosePlayerBuilderFormProps = {
  data: LoosePlayerPost;
  onChange: (next: LoosePlayerPost) => void;
  onReset: () => void;
  errors: ValidationError[];
};

const HAND_OPTIONS: { value: Hand; label: string; Icon: LucideIcon }[] = [
  { value: "DRIVE", label: "Drive", Icon: ArrowRightCircle },
  { value: "REVES", label: "Revés", Icon: ArrowLeftCircle },
  { value: "INDISTINTO", label: "Indistinto", Icon: Shuffle },
];
const GENERO_OPTIONS: { value: Gender; label: string; Icon: LucideIcon }[] = [
  { value: "Masculino", label: "Caballeros", Icon: Mars },
  { value: "Femenino", label: "Damas", Icon: Venus },
  { value: "Mixto", label: "Mixtos", Icon: VenusAndMars },
];

const resolveGeneroFromCategory = (categoria: string): Gender | null => {
  const normalizedCategory = categoria.trim();
  if (!normalizedCategory) {
    return null;
  }

  for (const genero of Object.keys(LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER) as Gender[]) {
    if (LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER[genero].includes(normalizedCategory)) {
      return genero;
    }
  }

  return null;
};

export function LoosePlayerBuilderForm({ data, onChange, onReset, errors }: LoosePlayerBuilderFormProps) {
  const updateField = <K extends keyof LoosePlayerPost>(field: K, value: LoosePlayerPost[K]) => {
    onChange({ ...data, [field]: value });
  };
  const selectedGenero = resolveGeneroFromCategory(data.categoria);
  const categoryOptionGroups = getLoosePlayerCategoryOptionGroupsForGeneros(selectedGenero ? [selectedGenero] : []);

  const selectGenero = (genero: Gender) => {
    if (selectedGenero === genero) {
      updateField("categoria", "");
      return;
    }
    updateField("categoria", LOOSE_PLAYER_CATEGORY_OPTIONS_BY_GENDER[genero][0] ?? "");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Jugador suelto</h2>
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
            <legend className="px-0 text-xs font-semibold text-white/80">Género</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {GENERO_OPTIONS.map(({ value, label, Icon }) => {
                const isSelected = selectedGenero === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectGenero(value)}
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

          <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
            Categoría *
            <select
              value={data.categoria}
              onChange={(event) => updateField("categoria", event.target.value)}
              required
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
            >
              <option value="" className="text-black">
                Seleccionar categoría
              </option>
              {categoryOptionGroups.map((group) => (
                <optgroup key={group.genero} label={group.label} className="text-black">
                  {group.options.map((categoria) => (
                    <option key={categoria} value={categoria} className="text-black">
                      {categoria}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
              Fecha *
              <input
                type="date"
                value={data.fecha}
                onChange={(event) => updateField("fecha", event.target.value)}
                required
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
              Hora *
              <input
                type="time"
                value={data.hora}
                onChange={(event) => updateField("hora", event.target.value)}
                required
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
            Sede *
            <select
              value={data.sede}
              onChange={(event) => updateField("sede", event.target.value)}
              required
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
            >
              <option value="" className="text-black">
                Seleccionar sede
              </option>
              {VENUE_OPTIONS.map((sede) => (
                <option key={sede} value={sede} className="text-black">
                  {sede}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="m-0 min-w-0 border-0 bg-transparent p-0">
            <legend className="px-0 text-xs font-semibold text-white/80">Mano (opcional)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {HAND_OPTIONS.map(({ value, label, Icon }) => {
                const isSelected = data.mano === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateField("mano", isSelected ? undefined : value)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[var(--otp-blue)]"
                        : "border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

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
