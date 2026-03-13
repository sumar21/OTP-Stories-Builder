import { formatToDayMonth } from "@/lib/date";
import type { ParticipantCard } from "@/lib/types";

type ParticipantsSlideRendererProps = {
  card: ParticipantCard;
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

export function ParticipantsSlideRenderer({ card }: ParticipantsSlideRendererProps) {
  const formattedDate = formatToDayMonth(card.fecha);
  const topLabel = `${RESULT_LABEL[card.resultado]} | ${formattedDate || "--/--"}`;
  const playersLabel = `${card.nombreParticipante1 || "--"} | ${card.nombreParticipante2 || "--"}`;
  const overlayGradientId = `participants-photo-overlay-${card.id}`;
  const categoryLabel = card.categoria.trim() || "--";
  const categoryFontClass =
    categoryLabel.length <= 2
      ? "text-[44px]"
      : categoryLabel.length <= 4
        ? "text-[28px]"
        : categoryLabel.length <= 6
          ? "text-[20px]"
          : "text-[16px]";

  return (
    <div className="relative size-full overflow-hidden bg-[#0b38d6] text-[#f5f7ff]">
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

      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 1080 1350"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={overlayGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b38d6" stopOpacity="0" />
            <stop offset="38%" stopColor="#0b38d6" stopOpacity="0.01" />
            <stop offset="56%" stopColor="#0b38d6" stopOpacity="0.03" />
            <stop offset="70%" stopColor="#0b38d6" stopOpacity="0.08" />
            <stop offset="82%" stopColor="#0b38d6" stopOpacity="0.16" />
            <stop offset="91%" stopColor="#08258f" stopOpacity="0.3" />
            <stop offset="97%" stopColor="#06174f" stopOpacity="0.44" />
            <stop offset="100%" stopColor="#06133f" stopOpacity="0.56" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1080" height="1350" fill={`url(#${overlayGradientId})`} />
      </svg>

      <div className="absolute inset-x-[34px] bottom-[34px] grid h-[135px] grid-cols-[98px_minmax(0,1fr)_132px] items-center gap-[10px] rounded-[20px] border border-[#5f80fb] bg-[#0B38D6] px-[11px] py-[11px] shadow-[0_16px_30px_rgba(3,10,42,0.4)]">
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
          <p className="otp-text-clamp-1 mt-[8px] text-[36px] leading-[1.02] font-medium tracking-[-0.02em] text-[#f2f4ff]">{playersLabel}</p>
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
  );
}
