import type { Sponsor } from "@/lib/types";

type SponsorsFooterProps = {
  sponsors: Sponsor[];
  compact?: boolean;
};

export function SponsorsFooter({ sponsors, compact = false }: SponsorsFooterProps) {
  return (
    <footer className="slide-footer">
      <p
        className={`text-center leading-none font-semibold tracking-[0.34em] text-[#9cb1f0] ${
          compact ? "text-[36px]" : "text-[44px]"
        }`}
      >
        SPONSORS
      </p>

      <div className={`grid grid-cols-4 items-end gap-5 ${compact ? "mt-6" : "mt-8"}`}>
        {sponsors.map((sponsor) => (
          <div key={sponsor.id} className={`flex items-end justify-center ${compact ? "min-h-[70px]" : "min-h-[80px]"}`}>
            <img src={sponsor.logoDataUrl} alt={sponsor.name} className={`w-full object-contain ${compact ? "max-h-[56px]" : "max-h-[64px]"}`} />
          </div>
        ))}
      </div>
    </footer>
  );
}
