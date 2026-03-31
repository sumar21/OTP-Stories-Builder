"use client";

import { Loader2 } from "lucide-react";

type ExportButtonsProps = {
  disabled?: boolean;
  showExportAll?: boolean;
  exportingCurrent: boolean;
  exportingAll: boolean;
  onExportCurrent: () => void;
  onExportAll: () => void;
};

export function ExportButtons({
  disabled = false,
  showExportAll = true,
  exportingCurrent,
  exportingAll,
  onExportCurrent,
  onExportAll,
}: ExportButtonsProps) {
  const currentButtonClass = showExportAll
    ? "inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
    : "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-4 py-2 text-sm font-semibold text-[var(--otp-blue)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={`grid gap-2 ${showExportAll ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
      <button
        type="button"
        onClick={onExportCurrent}
        disabled={disabled || exportingCurrent}
        className={currentButtonClass}
      >
        {exportingCurrent ? <><Loader2 className="size-4 animate-spin" /> Exportando...</> : "Descargar PNG (slide actual)"}
      </button>
      {showExportAll ? (
        <button
          type="button"
          onClick={onExportAll}
          disabled={disabled || exportingAll}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-4 py-2 text-sm font-semibold text-[var(--otp-blue)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {exportingAll ? <><Loader2 className="size-4 animate-spin" /> Generando ZIP...</> : "Descargar todo (ZIP)"}
        </button>
      ) : null}
    </div>
  );
}
