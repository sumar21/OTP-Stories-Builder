import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { TournamentItem } from "@/lib/types";
import type { CategoryOptionGroup } from "@/lib/tournamentOptions";
import { VENUE_OPTIONS } from "@/lib/tournamentOptions";

type TournamentRowEditorProps = {
  item: TournamentItem;
  itemIndex: number;
  totalItems: number;
  showStatus: boolean;
  categoryOptionGroups: CategoryOptionGroup[];
  onChange: (patch: Partial<TournamentItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  categoriaHasError?: boolean;
  horaHasError?: boolean;
  lugarHasError?: boolean;
};

export function TournamentRowEditor({
  item,
  itemIndex,
  totalItems,
  showStatus,
  categoryOptionGroups,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  categoriaHasError,
  horaHasError,
  lugarHasError,
}: TournamentRowEditorProps) {
  return (
    <div className="rounded-xl border border-white/15 bg-[#0a2a8f]/70 p-3">
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
          Categoría
          <select
            value={item.categoria}
            onChange={(event) => onChange({ categoria: event.target.value })}
            className={`rounded-lg border bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)] ${categoriaHasError ? "border-red-400/60" : "border-white/15"}`}
          >
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

        <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
          Hora
          <input
            type="time"
            value={item.hora}
            onChange={(event) => onChange({ hora: event.target.value })}
            className={`rounded-lg border bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)] ${horaHasError ? "border-red-400/60" : "border-white/15"}`}
            step={300}
          />
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-white/80">
          Lugar
          <select
            value={item.lugar}
            onChange={(event) => onChange({ lugar: event.target.value })}
            className={`rounded-lg border bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)] ${lugarHasError ? "border-red-400/60" : "border-white/15"}`}
          >
            {VENUE_OPTIONS.map((lugar) => (
              <option key={lugar} value={lugar} className="text-black">
                {lugar}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {showStatus ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-white/80">
            Estado
            <select
              value={item.estado}
              onChange={(event) => onChange({ estado: event.target.value as TournamentItem["estado"] })}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[var(--otp-lime)]"
            >
              <option value="DISPONIBLE" className="text-black">
                DISPONIBLE
              </option>
              <option value="ULTIMOS_CUPOS" className="text-black">
                ÚLTIMOS CUPOS
              </option>
              <option value="COMPLETO" className="text-black">
                COMPLETO
              </option>
            </select>
          </label>
        ) : (
          <p className="text-xs font-medium text-white/55">Modo posteo: sin estado visible.</p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Mover torneo ${itemIndex + 1} hacia arriba`}
            onClick={onMoveUp}
            disabled={itemIndex === 0}
            className="rounded-lg border border-white/14 bg-white/[0.06] p-2.5 text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Mover torneo ${itemIndex + 1} hacia abajo`}
            onClick={onMoveDown}
            disabled={itemIndex === totalItems - 1}
            className="rounded-lg border border-white/14 bg-white/[0.06] p-2.5 text-white/80 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Eliminar torneo ${itemIndex + 1}`}
            onClick={onRemove}
            className="rounded-lg border border-red-300/30 bg-red-400/8 p-2.5 text-red-100 transition hover:bg-red-400/14"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
