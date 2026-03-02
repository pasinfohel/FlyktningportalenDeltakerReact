import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../config/theme";
import { useTypography } from "../hooks/useTypography";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "md" | "lg";
  tone?: "primary" | "danger" | "muted";
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: "left" | "right";
  textSize?: number;
  iconSize?: number;
  loading?: boolean;
  loadingLabel?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  size = "lg",
  tone = "primary",
  icon,
  iconPosition = "left",
  textSize,
  iconSize,
  loading,
  loadingLabel,
}: Props) {
  const ty = useTypography();
  const resolvedTextSize = textSize ?? (size === "lg" ? ty.buttonLg : ty.buttonMd);
  const resolvedIconSize = iconSize ?? (size === "lg" ? ty.iconLg : ty.iconMd);
  const isDisabled = Boolean(disabled || loading);
  const renderedLabel = loadingLabel ?? label;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        size === "lg" ? styles.buttonLg : styles.buttonMd,
        tone === "danger" && styles.danger,
        tone === "muted" && styles.muted,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : icon && iconPosition === "left" ? (
          <MaterialCommunityIcons
            name={icon}
            size={resolvedIconSize}
            color={theme.colors.text}
            style={styles.icon}
          />
        ) : null}
        <Text
          style={[
            styles.text,
            { fontSize: resolvedTextSize },
          ]}
        >
          {renderedLabel}
        </Text>
        {!loading && icon && iconPosition === "right" ? (
          <MaterialCommunityIcons
            name={icon}
            size={resolvedIconSize}
            color={theme.colors.text}
            style={styles.icon}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radii.lg,
    borderWidth: 3,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  buttonLg: {
    minHeight: 92,
  },
  buttonMd: {
    minHeight: 56,
  },
  danger: {
    borderColor: theme.colors.danger,
  },
  muted: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {
    opacity: 0.85,
  },
});
