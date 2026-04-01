import { useCallback, useRef } from "react";
import { formatToDayMonth } from "@/lib/date";
import type { ParticipantCard, VoucherPosition } from "@/lib/types";

type ParticipantsSlideRendererProps = {
  card: ParticipantCard;
  onVoucherPositionChange?: (pos: VoucherPosition) => void;
};

const RESULT_LABEL: Record<ParticipantCard["resultado"], string> = {
  campeones: "CAMPEONES",
  subcampeones: "SUBCAMPEONES",
};

const CUP_LABEL: Record<ParticipantCard["copa"], string> = {
  oro: "Copa Oro",
  plata: "Copa Plata",
};

const CUP_TAG_SRC: Record<ParticipantCard["copa"], string> = {
  oro: "/tags/copa-oro.svg",
  plata: "/tags/copa-plata.svg",
};

const OTP_LOGO_SRC = "/logos/otp-logo.svg";
const CUP_TAG_HEIGHT = 36;

export function ParticipantsSlideRenderer({ card, onVoucherPositionChange }: ParticipantsSlideRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const formattedDate = formatToDayMonth(card.fecha);
  const topLabel = `${RESULT_LABEL[card.resultado]} | ${formattedDate || "--/--"}`;
  const playersLabel = `${card.nombreParticipante1 || "--"} | ${card.nombreParticipante2 || "--"}`;
  const categoryLabel = card.categoria.trim() || "--";
  const categoryFontClass =
    categoryLabel.length <= 2
      ? "text-[44px]"
      : categoryLabel.length <= 4
        ? "text-[28px]"
        : categoryLabel.length <= 6
          ? "text-[20px]"
          : "text-[16px]";

  const showVoucher = (card.valorVoucher ?? "").trim().length > 0;

  const calcPosition = useCallback(
    (clientX: number, clientY: number): VoucherPosition | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      return { x, y };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onVoucherPositionChange) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [onVoucherPositionChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !onVoucherPositionChange) return;
      const pos = calcPosition(e.clientX, e.clientY);
      if (pos) onVoucherPositionChange(pos);
    },
    [onVoucherPositionChange, calcPosition],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <div ref={containerRef} className="relative size-full overflow-hidden bg-[#0b38d6] text-[#f5f7ff]">
      {card.fotoDataUrl ? (
        <img
          src={card.fotoDataUrl}
          alt="Participantes del torneo"
          className="absolute inset-0 size-full object-cover"
          loading="eager"
          decoding="sync"
          draggable={false}
        />
      ) : null}

      {showVoucher ? (
        <div
          className={`absolute z-20 select-none ${onVoucherPositionChange ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{
            left: `${card.valorVoucherPos.x}%`,
            top: `${card.valorVoucherPos.y}%`,
            transform: `translate(-50%, -50%) rotate(${card.valorVoucherRotation ?? 0}deg)`,
          }}
          onPointerDown={onVoucherPositionChange ? handlePointerDown : undefined}
          onPointerMove={onVoucherPositionChange ? handlePointerMove : undefined}
          onPointerUp={onVoucherPositionChange ? handlePointerUp : undefined}
          onPointerCancel={onVoucherPositionChange ? handlePointerUp : undefined}
        >
          <span
            className="whitespace-nowrap font-extrabold tracking-[-0.02em] text-black"
            style={{ fontSize: `${card.valorVoucherSize}px` }}
          >
            ${card.valorVoucher}
          </span>
        </div>
      ) : null}

      <div className="absolute inset-x-[34px] bottom-[34px]" data-testid="participants-card-shell">
        <div
          aria-hidden
          data-testid="participants-card-shadow"
          className="pointer-events-none absolute inset-x-[18px] -bottom-[12px] h-[28px] rounded-full bg-[rgba(3,10,42,0.5)] blur-[14px]"
        />

        <div
          className="relative z-10 grid h-[135px] grid-cols-[98px_minmax(0,1fr)_132px] items-center gap-[10px] rounded-[20px] border border-[#4268EB] bg-[#0B38D6] px-[11px] py-[11px]"
          data-testid="participants-card"
        >
          <div className="flex h-[80px] w-[80px] items-center justify-center justify-self-center self-center rounded-[10px] bg-[var(--otp-lime)]">
            <span
              className={`max-w-full px-[4px] text-center leading-none font-extrabold tracking-[-0.03em] text-[#1d42d2] ${categoryFontClass}`}
            >
              {categoryLabel}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-[7px]">
              <p className="otp-text-clamp-1 text-[31px] leading-none font-medium tracking-[-0.02em] text-[#98acef]">{topLabel}</p>
              <img
                src={CUP_TAG_SRC[card.copa]}
                alt={CUP_LABEL[card.copa]}
                className="w-auto shrink-0"
                style={{ height: `${CUP_TAG_HEIGHT}px` }}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                draggable={false}
              />
            </div>
            <p className="otp-text-clamp-1 mt-[8px] text-[36px] leading-[1.02] font-medium tracking-[-0.02em] text-[#f2f4ff]">
              {playersLabel}
            </p>
          </div>

          <div className="flex h-full items-center justify-center">
            <img
              src={OTP_LOGO_SRC}
              alt="OTP"
              className="h-[104px] w-[104px] object-contain"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
