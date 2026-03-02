import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import dayjs from "dayjs";
import { theme } from "../config/theme";
import { useTypography } from "../hooks/useTypography";
import { getNorwegianHoliday, norwegianHolidays } from "../utils/holidays";

type Props = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  readOnly?: boolean;
  minDate?: string;
  maxDate?: string;
};

export function DatePickerField({
  label,
  value,
  onChange,
  readOnly,
  minDate,
  maxDate,
}: Props) {
  const ty = useTypography();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(dayjs(value, "YYYY-MM-DD", true).isValid() ? dayjs(value) : dayjs());
  const selectedHoliday = getNorwegianHoliday(value);
  const holidays = useMemo(() => norwegianHolidays(month.year()), [month]);

  const firstDay = month.startOf("month");
  const start = firstDay.day() === 0 ? firstDay.subtract(6, "day") : firstDay.subtract(firstDay.day() - 1, "day");
  const days = Array.from({ length: 42 }, (_, i) => start.add(i, "day"));

  function canSelect(date: dayjs.Dayjs) {
    const isoDate = date.format("YYYY-MM-DD");
    if (minDate && isoDate < minDate) return false;
    if (maxDate && isoDate > maxDate) return false;
    return true;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { fontSize: ty.label }]}>{label}</Text>
      <Pressable
        disabled={readOnly}
        onPress={() => !readOnly && setOpen(true)}
        style={[styles.trigger, readOnly && styles.disabled]}
      >
        <Text style={[styles.triggerText, { fontSize: ty.input }]}>
          {dayjs(value, "YYYY-MM-DD", true).isValid() ? dayjs(value).format("DD.MM.YYYY") : "Velg dato"}
        </Text>
      </Pressable>
      {selectedHoliday ? (
        <Text style={[styles.holidayHint, { fontSize: ty.counter }]}>Helligdag: {selectedHoliday}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropTap} onPress={() => setOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <Pressable onPress={() => setMonth((m) => m.subtract(1, "month"))}>
                <Text style={[styles.nav, { fontSize: ty.body }]}>{"<"}</Text>
              </Pressable>
              <Text style={[styles.monthTitle, { fontSize: ty.body }]}>
                {month.format("MMMM YYYY")}
              </Text>
              <Pressable onPress={() => setMonth((m) => m.add(1, "month"))}>
                <Text style={[styles.nav, { fontSize: ty.body }]}>{">"}</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {["Ma", "Ti", "On", "To", "Fr", "Lo", "So"].map((d) => (
                <Text key={d} style={[styles.weekday, { fontSize: ty.counter }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((d) => {
                const isoDate = d.format("YYYY-MM-DD");
                const inMonth = d.month() === month.month();
                const selected = isoDate === value;
                const holiday = holidays[isoDate];
                const enabled = canSelect(d);
                return (
                  <Pressable
                    key={isoDate}
                    disabled={!enabled}
                    onPress={() => {
                      onChange(isoDate);
                      setOpen(false);
                    }}
                    style={[
                      styles.dayCell,
                      selected && styles.daySelected,
                      !enabled && styles.dayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { fontSize: ty.counter },
                        !inMonth && styles.dayOutsideMonth,
                        holiday && styles.dayHoliday,
                        selected && styles.daySelectedText,
                      ]}
                    >
                      {d.date()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={[styles.closeText, { fontSize: ty.buttonMd }]}>Lukk</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontWeight: "600", color: theme.colors.text },
  trigger: {
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  triggerText: { color: theme.colors.text, fontWeight: "500" },
  holidayHint: { color: theme.colors.danger, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nav: { fontWeight: "700", color: theme.colors.text, paddingHorizontal: 8 },
  monthTitle: { fontWeight: "700", color: theme.colors.text, textTransform: "capitalize" },
  weekRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", color: theme.colors.muted, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  daySelected: {
    backgroundColor: "#dbe8dc",
  },
  dayText: { color: theme.colors.text, fontWeight: "600" },
  dayOutsideMonth: { opacity: 0.35 },
  dayHoliday: { color: theme.colors.danger, fontWeight: "700" },
  daySelectedText: { color: theme.colors.text },
  dayDisabled: { opacity: 0.35 },
  closeBtn: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  closeText: { fontWeight: "700", color: theme.colors.text },
});
