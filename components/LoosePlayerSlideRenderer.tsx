import { ArrowLeftCircle, ArrowRightCircle, MapPin, Shuffle } from "lucide-react";
import { formatToWeekdayDayMonth } from "@/lib/date";
import type { Hand, LoosePlayerPost } from "@/lib/types";

type LoosePlayerSlideRendererProps = {
  data: LoosePlayerPost;
};

const HAND_META: Record<Hand, { label: string; Icon: typeof ArrowRightCircle }> = {
  DRIVE: { label: "DRIVE", Icon: ArrowRightCircle },
  REVES: { label: "REVES", Icon: ArrowLeftCircle },
  INDISTINTO: { label: "INDISTINTO", Icon: Shuffle },
};

export function LoosePlayerSlideRenderer({ data }: LoosePlayerSlideRendererProps) {
  const HandIcon = data.mano ? HAND_META[data.mano].Icon : null;
  const handLabel = data.mano ? HAND_META[data.mano].label : null;
  const formattedDate = formatToWeekdayDayMonth(data.fecha);
  const dateTimeLabel = `${formattedDate ? formattedDate.toUpperCase() : "--/--"} | ${data.hora || "--:--"} hs`;
  const normalizedCategory = data.categoria.trim().replace(/\s+/g, " ");
  const upperCategory = normalizedCategory.toUpperCase();
  const isMixedCategory = upperCategory.startsWith("SUMA") || upperCategory.startsWith("MIXTO");
  const isFemeninoCategory = !isMixedCategory && upperCategory.startsWith("D");
  const playerLabel = isMixedCategory ? "JUGADORA O JUGADOR" : isFemeninoCategory ? "JUGADORA" : "JUGADOR";
  const categoryLabel = normalizedCategory
    ? isMixedCategory
      ? upperCategory.replace(/^SUMA\b/, "MIXTO")
      : upperCategory
    : "--";
  const playerTitleClass = isMixedCategory
    ? "max-w-full text-[96px] leading-[0.93] tracking-[-0.015em]"
    : "text-[186px] leading-[0.92] tracking-[-0.03em]";
  const categoryLineClass = isMixedCategory
    ? "mt-[44px] flex items-center justify-center gap-[14px] text-[70px] leading-[0.95] font-extrabold tracking-[-0.015em] text-[var(--otp-lime)]"
    : "mt-[52px] flex items-center justify-center gap-[20px] text-[118px] leading-none font-extrabold tracking-[-0.02em] text-[var(--otp-lime)]";
  const separatorClass = isMixedCategory ? "text-[58px] leading-none text-[#8290de]" : "text-[102px] leading-none text-[#8290de]";
  const handGroupClass = isMixedCategory ? "inline-flex items-center gap-[10px]" : "inline-flex items-center gap-[14px]";
  const handIconClass = isMixedCategory ? "size-[52px]" : "size-[88px]";

  return (
    <div className="relative size-full overflow-hidden bg-[#1638d5] text-[#f2f4ff]">
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/graphics/pelota-padel.png"
          alt=""
          aria-hidden
          className="absolute -left-[108px] -top-[52px] w-[316px] max-w-none"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
        />
        <img
          src="/graphics/circulo-debajo-derecha.svg"
          alt=""
          aria-hidden
          className="absolute -bottom-[446px] -right-[336px] w-[882px] max-w-none"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
        />
      </div>

      <div className="relative z-10 flex justify-end px-[80px] pt-[72px]">
        <img
          src="/logos/otp-logo.svg"
          alt="OTP"
          className="h-[128px] w-[128px] object-contain"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
        />
      </div>

      <section className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[84px] text-center">
        <p className="text-[52px] leading-none font-medium tracking-[0.02em] text-[#95a7ee]">
          {data.subtitulo?.trim() || "TORNEO AMERICANO"}
        </p>
        <h1 className="mt-[12px] text-[108px] leading-[0.9] font-normal tracking-[-0.02em] text-[#f2f4ff]">BUSCAMOS</h1>
        <h2 className={`font-extrabold text-[#f2f4ff] ${playerTitleClass}`}>{playerLabel}</h2>

        <div className={categoryLineClass}>
          <span>{categoryLabel}</span>
          {handLabel && HandIcon ? (
            <>
              <span className={separatorClass}>|</span>
              <span className={handGroupClass}>
                <HandIcon className={handIconClass} strokeWidth={2.4} />
                {handLabel}
              </span>
            </>
          ) : null}
        </div>

        <p className="mt-[42px] text-[62px] leading-none font-medium tracking-[-0.01em] text-[#95a7ee]">{dateTimeLabel}</p>
        <p className="mt-[30px] inline-flex max-w-full items-center gap-[10px] text-[62px] leading-none font-bold text-[var(--otp-lime)] uppercase">
          <MapPin className="size-[60px] shrink-0" strokeWidth={2.5} />
          <span className="otp-text-clamp-1">{data.sede || "--"}</span>
        </p>
      </section>
    </div>
  );
}
