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
  const categoryLabel = data.categoria.trim() || "--";

  return (
    <div className="relative size-full overflow-hidden bg-[#1638d5] text-[#f2f4ff]">
      <div className="pointer-events-none absolute inset-0">
        <img src="/graphics/pelota-padel.png" alt="" aria-hidden className="absolute -left-[108px] -top-[52px] w-[316px] max-w-none" />
        <img
          src="/graphics/circulo-debajo-derecha.svg"
          alt=""
          aria-hidden
          className="absolute -bottom-[446px] -right-[336px] w-[882px] max-w-none"
        />
      </div>

      <div className="relative z-10 flex justify-end px-[80px] pt-[72px]">
        <img src="/logos/otp-logo.svg" alt="OTP" className="h-[128px] w-[128px] object-contain" />
      </div>

      <section className="absolute inset-0 z-10 flex flex-col items-center justify-center px-[84px] text-center">
        <p className="text-[52px] leading-none font-medium tracking-[0.02em] text-[#95a7ee]">
          {data.subtitulo?.trim() || "TORNEO AMERICANO"}
        </p>
        <h1 className="mt-[12px] text-[108px] leading-[0.9] font-normal tracking-[-0.02em] text-[#f2f4ff]">BUSCAMOS</h1>
        <h2 className="text-[186px] leading-[0.92] font-extrabold tracking-[-0.03em] text-[#f2f4ff]">JUGADOR</h2>

        <div className="mt-[52px] flex items-center justify-center gap-[20px] text-[118px] leading-none font-extrabold tracking-[-0.02em] text-[var(--otp-lime)]">
          <span>{categoryLabel}</span>
          {handLabel && HandIcon ? (
            <>
              <span className="text-[102px] leading-none text-[#8290de]">|</span>
              <span className="inline-flex items-center gap-[14px]">
                <HandIcon className="size-[88px]" strokeWidth={2.4} />
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
