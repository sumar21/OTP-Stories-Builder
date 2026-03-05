import { CircleCheck, Hourglass, Lock } from "lucide-react";
import clsx from "clsx";
import type { CSSProperties, Ref } from "react";
import { LoosePlayerSlideRenderer } from "@/components/LoosePlayerSlideRenderer";
import { SponsorsFooter } from "@/components/SponsorsFooter";
import { formatToDayMonth } from "@/lib/date";
import { getPostFormat, getSlideSize } from "@/lib/slideFormat";
import type { DaySlice, Gender, PostData, Status, TournamentPostData } from "@/lib/types";

type SlideRendererProps = {
  data: PostData;
  slide: {
    slideIndex: number;
    totalSlides: number;
    type: "tournaments" | "closing" | "loose-player";
    days: DaySlice[];
  };
  slideRef?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
};

const statusConfig: Record<
  Status,
  {
    icon: typeof CircleCheck;
    label: string;
    className: string;
  }
> = {
  DISPONIBLE: {
    icon: CircleCheck,
    label: "DISPONIBLE",
    className: "border border-[var(--otp-lime)] bg-[var(--otp-lime)] text-[var(--otp-blue)]",
  },
  ULTIMOS_CUPOS: {
    icon: Hourglass,
    label: "ÚLTIMOS CUPOS",
    className: "border border-[var(--otp-lime)] bg-transparent text-[var(--otp-lime)]",
  },
  COMPLETO: {
    icon: Lock,
    label: "COMPLETO",
    className: "border border-white/90 bg-white text-[var(--otp-blue)]",
  },
};

const GENDER_BADGE_LABELS: Record<Gender, string> = {
  Masculino: "Caballeros",
  Femenino: "Damas",
  Mixto: "Mixto",
};

const DayCard = ({ day, showStatus }: { day: DaySlice; showStatus: boolean }) => (
  <article className="rounded-[46px] border border-[#2f53cb] bg-[var(--otp-card)] px-8 py-7">
    <h3 className="mb-4 flex items-center gap-2 text-[54px] leading-[1] font-bold tracking-tight text-[#f2f4ff]">
      <span>{day.diaLabel}</span>
      <span className="text-[var(--otp-lime)]">—</span>
    </h3>

    <div className="divide-y divide-[var(--otp-line)]">
      {day.items.map((item) => {
        const config = statusConfig[item.estado];
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className={clsx("flex h-[86px] items-center gap-3", showStatus ? "justify-between" : "justify-start")}
          >
            <div className="flex min-w-0 items-baseline gap-2 leading-none">
              <span className="text-[42px] font-bold text-[var(--otp-lime)]">{item.categoria}</span>
              <span className="text-[42px] font-medium text-[#f3f5ff]">{item.hora}</span>
              <span className="otp-text-clamp-1 text-[42px] font-semibold text-[var(--otp-text-muted)]">{item.lugar}</span>
            </div>

            {showStatus ? (
              <span
                className={clsx(
                  "inline-flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[31px] leading-none font-bold",
                  config.className,
                )}
              >
                <Icon className="size-[26px]" strokeWidth={2.2} />
                {config.label}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  </article>
);

const ClosingSlide = () => (
  <div className="relative size-full overflow-hidden bg-[var(--otp-blue)]">
    <img
      src="/imagen-final.jpg"
      alt="Sponsors OTP"
      className="h-full w-full object-cover"
      loading="eager"
      decoding="sync"
      draggable={false}
    />
  </div>
);

export function SlideRenderer({ data, slide, slideRef, className, style }: SlideRendererProps) {
  const postFormat = getPostFormat(data);
  const slideSize = getSlideSize(postFormat);

  const mergedStyle: CSSProperties = {
    width: slideSize.width,
    height: slideSize.height,
    ...style,
  };

  if (slide.type === "closing") {
    return (
      <div
        ref={slideRef}
        className={clsx("slide-root", className)}
        style={mergedStyle}
        data-slide-root
        data-format={postFormat}
        data-slide-type="closing"
      >
        <ClosingSlide />
      </div>
    );
  }

  if (slide.type === "loose-player" && data.postType === "jugador_suelto") {
    return (
      <div
        ref={slideRef}
        className={clsx("slide-root", className)}
        style={mergedStyle}
        data-slide-root
        data-format="historia"
        data-slide-type="loose-player"
      >
        <LoosePlayerSlideRenderer data={data} />
      </div>
    );
  }

  if (data.postType !== "torneos") {
    return null;
  }

  const tournamentData: TournamentPostData = data;
  const dateFrom = formatToDayMonth(tournamentData.fechaDesde);
  const dateTo = formatToDayMonth(tournamentData.fechaHasta);
  const showStatus = tournamentData.format === "historia";
  const showSponsorsFooter = tournamentData.format === "historia";
  const generoLabel =
    tournamentData.generos.length > 0
      ? tournamentData.generos.map((item) => GENDER_BADGE_LABELS[item].toUpperCase()).join(" Y ")
      : "SIN GÉNERO";
  const generoBadgeTextClass = generoLabel.length > 14 ? "text-[40px]" : "text-[56px]";

  return (
    <div
      ref={slideRef}
      className={clsx("slide-root", className)}
      style={mergedStyle}
      data-slide-root
      data-format={tournamentData.format}
      data-slide-type="tournaments"
    >
      <header className="slide-header">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="whitespace-nowrap text-[62px] leading-none font-semibold uppercase tracking-tight text-[#f2f4ff]">
              TORNEOS <span className="font-extrabold">AMERICANOS</span>
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span
                className={clsx(
                  "inline-flex rounded-full bg-[var(--otp-lime)] px-7 py-2 leading-none font-bold text-[var(--otp-blue)] uppercase",
                  generoBadgeTextClass,
                )}
              >
                {generoLabel}
              </span>
              <span className="text-[73px] leading-none font-medium text-[#e8edff]">
                DEL {dateFrom || "--/--"} AL {dateTo || "--/--"}
              </span>
            </div>
          </div>

          <img src="/logos/otp-logo.svg" alt="OTP" className="h-[190px] w-[190px] object-contain" />
        </div>
      </header>

      <section className="slide-body">
        <div className="slide-day-scroll-area" data-variable-area>
          <div className="slide-day-list" data-day-cards>
            {slide.days.map((day, index) => (
              <DayCard key={`${day.dayId}-${index}-${day.continuation ? "cont" : "full"}`} day={day} showStatus={showStatus} />
            ))}
          </div>
        </div>
      </section>

      {showSponsorsFooter ? (
        <SponsorsFooter sponsors={tournamentData.sponsors} compact={tournamentData.format === "posteo"} />
      ) : null}
    </div>
  );
}
