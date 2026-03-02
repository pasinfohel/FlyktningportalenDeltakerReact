import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

type FontScale = {
  scale: number;
  xs: number;
  small: number;
  medium: number;
  large: number;
  xl: number;
};

export function useFontScale(): FontScale {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const scale = Math.max(0.85, Math.min(1.35, width / 400));
    return {
      scale,
      xs: Math.round(10 * scale),
      small: Math.round(14 * scale),
      medium: Math.round(18 * scale),
      large: Math.round(24 * scale),
      xl: Math.round(32 * scale),
    };
  }, [width]);
}
