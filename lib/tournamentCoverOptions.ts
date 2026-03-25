import type { TournamentCoverVariant } from "@/lib/types";

export const TOURNAMENT_COVER_VARIANTS = ["1", "2", "3", "4"] as const satisfies readonly TournamentCoverVariant[];

export const TOURNAMENT_COVER_OPTIONS: Array<{
  value: TournamentCoverVariant;
  label: string;
  src: string;
}> = TOURNAMENT_COVER_VARIANTS.map((value) => ({
  value,
  label: `Portada ${value}`,
  src: `/portadas-torneos/portada-${value}.jpg`,
}));

export const TOURNAMENT_COVER_IMAGE_BY_VARIANT: Record<TournamentCoverVariant, string> = TOURNAMENT_COVER_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.src;
    return acc;
  },
  {} as Record<TournamentCoverVariant, string>,
);
