import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { DayBlock, TournamentItem } from "@/lib/types";
import { TournamentRowEditor } from "@/components/TournamentRowEditor";
import type { CategoryOptionGroup } from "@/lib/tournamentOptions";
import { WEEKDAY_OPTIONS } from "@/lib/tournamentOptions";

type DayEditorProps = {
  day: DayBlock;
  dayIndex: number;
  totalDays: number;
  showStatus: boolean;
  categoryOptionGroups: CategoryOptionGroup[];
  onLabelChange: (value: string) => void;
  onRemoveDay: () => void;
  onAddTournament: () => void;
  onMoveDayUp: () => void;
  onMoveDayDown: () => void;
  onUpdateTournament: (itemId: string, patch: Partial<TournamentItem>) => void;
  onRemoveTournament: (itemId: string) => void;
  onMoveTournamentUp: (itemId: string) => void;
  onMoveTournamentDown: (itemId: string) => void;
  hasLabelError?: boolean;
  itemErrorPaths?: Set<string>;
  realDayIndex?: number;
};

export function DayEditor({
  day,
  dayIndex,
  totalDays,
  showStatus,
  categoryOptionGroups,
  onLabelChange,
  onRemoveDay,
  onAddTournament,
  onMoveDayUp,
  onMoveDayDown,
  onUpdateTournament,
  onRemoveTournament,
  onMoveTournamentUp,
  onMoveTournamentDown,
  hasLabelError,
  itemErrorPaths,
  realDayIndex,
}: DayEditorProps) {
  return (
    <details open className="overflow-hidden rounded-2xl border border-white/15 bg-[#0a2a8f]/60">
      <summary className="cursor-pointer list-none p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold tracking-[0.12em] text-white/90">Día {dayIndex + 1}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Mover día ${dayIndex + 1} hacia arriba`}
              onClick={(event) => {
                event.preventDefault();
                onMoveDayUp();
              }}
              disabled={dayIndex === 0}
              className="rounded-lg border border-white/14 bg-white/[0.06] p-2.5 text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Mover día ${dayIndex + 1} hacia abajo`}
              onClick={(event) => {
                event.preventDefault();
                onMoveDayDown();
              }}
              disabled={dayIndex === totalDays - 1}
              className="rounded-lg border border-white/14 bg-white/[0.06] p-2.5 text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Eliminar día ${dayIndex + 1}`}
              onClick={(event) => {
                event.preventDefault();
                onRemoveDay();
              }}
              className="rounded-lg border border-red-300/30 bg-red-400/8 p-2.5 text-red-100 transition hover:bg-red-400/14"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </summary>

      <div className="space-y-3 border-t border-white/10 p-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
          Etiqueta del día
          <select
            value={day.diaLabel}
            onChange={(event) => onLabelChange(event.target.value)}
            className={`rounded-lg border bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)] ${hasLabelError ? "border-red-400/60" : "border-white/15"}`}
          >
            <option value="" className="text-black">
              Seleccionar día
            </option>
            {WEEKDAY_OPTIONS.map((weekday) => (
              <option key={weekday} value={weekday} className="text-black">
                {weekday}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          {day.items.map((item, itemIndex) => (
            <TournamentRowEditor
              key={item.id}
              item={item}
              itemIndex={itemIndex}
              totalItems={day.items.length}
              onChange={(patch) => onUpdateTournament(item.id, patch)}
              onRemove={() => onRemoveTournament(item.id)}
              onMoveUp={() => onMoveTournamentUp(item.id)}
              onMoveDown={() => onMoveTournamentDown(item.id)}
              showStatus={showStatus}
              categoryOptionGroups={categoryOptionGroups}
              categoriaHasError={itemErrorPaths?.has(`days.${realDayIndex}.items.${itemIndex}.categoria`)}
              horaHasError={itemErrorPaths?.has(`days.${realDayIndex}.items.${itemIndex}.hora`)}
              lugarHasError={itemErrorPaths?.has(`days.${realDayIndex}.items.${itemIndex}.lugar`)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onAddTournament}
          className="w-full rounded-xl border border-dashed border-[var(--otp-lime)]/80 bg-[var(--otp-lime)]/10 px-4 py-2 text-sm font-semibold text-[var(--otp-lime)]"
        >
          + Agregar torneo
        </button>
      </div>
    </details>
  );
}
