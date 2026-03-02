import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";
import { useTypography } from "../hooks/useTypography";
import { DeltakelseRecord, DeltakelseType } from "../types/domain";
import { formatDateLabel, formatTimeLabel, isSameDay } from "../utils/date";

type Props = {
  record: DeltakelseRecord;
  onPress: () => void;
  rightLabel?: string;
};

export function RecordCard({ record, onPress, rightLabel }: Props) {
  const ty = useTypography();
  const isFravaer = record.socio_deltakelsetype === DeltakelseType.Fravaer;
  const fra = record.socio_deltakelse_fra;
  const til = record.socio_deltakelse_til;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={[styles.date, { fontSize: ty.cardDate }]}>
        {isFravaer && til && !isSameDay(fra, til)
          ? `${formatDateLabel(fra)} - ${formatDateLabel(til)}`
          : formatDateLabel(fra)}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.time, { fontSize: ty.cardTime }]}>
          {isFravaer ? "Fra" : "Inn"}: {formatTimeLabel(fra)}
        </Text>
        {!!til && (
          <Text style={[styles.time, { fontSize: ty.cardTime }]}>
            {isFravaer ? "Til" : "Ut"}: {formatTimeLabel(til)}
          </Text>
        )}
      </View>
      {!!rightLabel && <Text style={[styles.badge, { fontSize: ty.cardBadge }]}>{rightLabel}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 3,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 14,
    gap: 8,
  },
  date: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  time: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  badge: {
    fontWeight: "700",
    color: theme.colors.danger,
  },
});
