import type { DayBlock, TournamentItem } from "@/lib/types";
import { TournamentRowEditor } from "@/components/TournamentRowEditor";
import { WEEKDAY_OPTIONS } from "@/lib/tournamentOptions";

type DayEditorProps = {
  day: DayBlock;
  dayIndex: number;
  totalDays: number;
  onLabelChange: (value: string) => void;
  onRemoveDay: () => void;
  onAddTournament: () => void;
  onMoveDayUp: () => void;
  onMoveDayDown: () => void;
  onUpdateTournament: (itemId: string, patch: Partial<TournamentItem>) => void;
  onRemoveTournament: (itemId: string) => void;
  onMoveTournamentUp: (itemId: string) => void;
  onMoveTournamentDown: (itemId: string) => void;
};

export function DayEditor({
  day,
  dayIndex,
  totalDays,
  onLabelChange,
  onRemoveDay,
  onAddTournament,
  onMoveDayUp,
  onMoveDayDown,
  onUpdateTournament,
  onRemoveTournament,
  onMoveTournamentUp,
  onMoveTournamentDown,
}: DayEditorProps) {
  return (
    <details open className="overflow-hidden rounded-2xl border border-white/15 bg-[#0a2a8f]/60">
      <summary className="cursor-pointer list-none p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold tracking-[0.12em] text-white/90">Día {dayIndex + 1}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onMoveDayUp();
              }}
              disabled={dayIndex === 0}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Subir
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onMoveDayDown();
              }}
              disabled={dayIndex === totalDays - 1}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Bajar
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onRemoveDay();
              }}
              className="rounded-lg border border-red-300/70 px-3 py-1.5 text-xs font-semibold text-red-100"
            >
              Eliminar
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
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
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
