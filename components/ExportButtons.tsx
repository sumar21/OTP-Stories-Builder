"use client";

type ExportButtonsProps = {
  disabled?: boolean;
  exportingCurrent: boolean;
  exportingAll: boolean;
  onExportCurrent: () => void;
  onExportAll: () => void;
};

export function ExportButtons({
  disabled = false,
  exportingCurrent,
  exportingAll,
  onExportCurrent,
  onExportAll,
}: ExportButtonsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onExportCurrent}
        disabled={disabled || exportingCurrent}
        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {exportingCurrent ? "Exportando..." : "Descargar PNG (slide actual)"}
      </button>
      <button
        type="button"
        onClick={onExportAll}
        disabled={disabled || exportingAll}
        className="rounded-xl border border-[var(--otp-lime)] bg-[var(--otp-lime)] px-4 py-2 text-sm font-semibold text-[var(--otp-blue)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {exportingAll ? "Generando ZIP..." : "Descargar todo (ZIP)"}
      </button>
    </div>
  );
}
