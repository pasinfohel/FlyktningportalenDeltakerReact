import { useMemo } from "react";
import { useFontScale } from "./useFontScale";

export function useTypography() {
  const fonts = useFontScale();

  return useMemo(
    () => ({
      titleXL: fonts.xl + 2,
      titleL: fonts.large + 6,
      bodyL: fonts.medium + 4,
      body: fonts.medium,
      bodyM: fonts.medium + 2,
      bodyS: fonts.small + 1,
      caption: fonts.small,
      input: fonts.medium,
      label: fonts.small + 2,
      chip: fonts.small + 1,
      counter: fonts.small,
      buttonLg: fonts.xl,
      buttonMd: fonts.medium,
      iconLg: Math.max(24, fonts.large),
      iconMd: Math.max(20, fonts.medium),
      cardDate: fonts.medium + 2,
      cardTime: fonts.medium,
      cardBadge: fonts.small,
      emptyState: fonts.medium,
      colon: fonts.large,
    }),
    [fonts],
  );
}
