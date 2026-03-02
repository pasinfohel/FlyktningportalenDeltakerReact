import type { CSSProperties } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";
import { useTypography } from "../hooks/useTypography";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function TimePickerField({ label, value, onChange, readOnly }: Props) {
  const ty = useTypography();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { fontSize: ty.label }]}>{label}</Text>
      <View style={[styles.inputWrap, readOnly && styles.disabled]}>
        <input
          type="time"
          value={value}
          disabled={readOnly}
          onChange={(event) => onChange(event.currentTarget.value)}
          style={webInputStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontWeight: "600", color: theme.colors.text },
  inputWrap: {
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disabled: { opacity: 0.6 },
});

const webInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "transparent",
  color: theme.colors.text,
  fontSize: 16,
  fontFamily: "inherit",
  minHeight: 36,
};
