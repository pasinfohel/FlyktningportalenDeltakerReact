import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import dayjs from "dayjs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PrimaryButton } from "../components/PrimaryButton";
import { theme } from "../config/theme";
import { useDeleteMutation, useDeltakelser, useFravaerMutation } from "../hooks/useDeltakelser";
import { useTypography } from "../hooks/useTypography";
import { RootStackParamList } from "../navigation/types";
import { AbsenceFormValues, Fravaerstype } from "../types/domain";
import { getStemplingCutoff } from "../utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "FravaerForm">;

export function FravaerFormScreen({ route, navigation }: Props) {
  const ty = useTypography();
  const { data = [] } = useDeltakelser();
  const record = data.find((r) => r.socio_deltakelseid === route.params?.recordId);
  const isReadonly = Boolean(record && new Date(record.socio_deltakelse_fra) < getStemplingCutoff());
  const mutation = useFravaerMutation(record);
  const deleteMutation = useDeleteMutation();

  const [fromDate, setFromDate] = useState(
    record ? dayjs(record.socio_deltakelse_fra).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
  );
  const [toDate, setToDate] = useState(
    record?.socio_deltakelse_til
      ? dayjs(record.socio_deltakelse_til).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
  );
  const [fromHour, setFromHour] = useState(record ? dayjs(record.socio_deltakelse_fra).format("HH") : "");
  const [fromMinute, setFromMinute] = useState(record ? dayjs(record.socio_deltakelse_fra).format("mm") : "");
  const [toHour, setToHour] = useState(record?.socio_deltakelse_til ? dayjs(record.socio_deltakelse_til).format("HH") : "");
  const [toMinute, setToMinute] = useState(record?.socio_deltakelse_til ? dayjs(record.socio_deltakelse_til).format("mm") : "");
  const [comment, setComment] = useState(record?.socio_beskrivelse ?? "");
  const [allDay, setAllDay] = useState(Boolean(record?.socio_heldagsfravr));
  const [fravaerstype, setFravaerstype] = useState<number>(record?.socio_fravrstype ?? Fravaerstype.Syk);

  const title = useMemo(() => {
    if (!record) return "Registrer fravaer";
    return isReadonly ? "Registrert fravaer" : "Rediger fravaer";
  }, [isReadonly, record]);

  const onSave = () => {
    const from = parseDateInput(fromDate);
    const to = parseDateInput(toDate);
    if (!from || !to) {
      Alert.alert("Feil", "Ugyldig dato. Bruk format YYYY-MM-DD.");
      return;
    }
    if (to < from) {
      Alert.alert("Feil", "Til-dato ma vaere lik eller etter Fra-dato.");
      return;
    }
    if (from < getStemplingCutoff()) {
      Alert.alert("Feil", "Du kan ikke registrere fravaer for eldre perioder.");
      return;
    }
    if (!allDay) {
      const timeError = validateTimeRange({
        fromHour,
        fromMinute,
        toHour,
        toMinute,
        sameDate: dayjs(from).isSame(dayjs(to), "day"),
      });
      if (timeError) {
        Alert.alert("Feil", timeError);
        return;
      }
    }
    if (comment.length > 150) {
      Alert.alert("Feil", "Kommentar kan maks være 150 tegn.");
      return;
    }
    const values: AbsenceFormValues = {
      fromDate: from,
      toDate: to,
      fromHour: normalizeTwoDigits(fromHour),
      fromMinute: normalizeTwoDigits(fromMinute),
      toHour: normalizeTwoDigits(toHour),
      toMinute: normalizeTwoDigits(toMinute),
      allDay,
      fravaerstype,
      comment: comment.trim(),
    };
    mutation.mutate(values, {
      onSuccess: () => navigation.goBack(),
      onError: (error) => Alert.alert("Feil", String(error)),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { fontSize: ty.titleL }]}>{title}</Text>
      <Field
        label="Fra dato (YYYY-MM-DD)"
        value={fromDate}
        onChangeText={setFromDate}
        readOnly={isReadonly}
        ty={ty}
      />
      <Field
        label="Til dato (YYYY-MM-DD)"
        value={toDate}
        onChangeText={setToDate}
        readOnly={isReadonly}
        ty={ty}
      />
      <ToggleAllDay allDay={allDay} onToggle={() => setAllDay((p) => !p)} readOnly={isReadonly} ty={ty} />
      {!allDay && (
        <>
          <TimeRow
            label="Fra tid"
            hour={fromHour}
            minute={fromMinute}
            setHour={setFromHour}
            setMinute={setFromMinute}
            readOnly={isReadonly}
            ty={ty}
          />
          <TimeRow
            label="Til tid"
            hour={toHour}
            minute={toMinute}
            setHour={setToHour}
            setMinute={setToMinute}
            readOnly={isReadonly}
            ty={ty}
          />
        </>
      )}
      <TypePicker selected={fravaerstype} onSelect={setFravaerstype} readOnly={isReadonly} ty={ty} />
      <Field
        label="Kommentar"
        value={comment}
        onChangeText={setComment}
        readOnly={isReadonly}
        ty={ty}
      />
      <Text style={[styles.counter, { fontSize: ty.counter }]}>{comment.length} / 150 tegn</Text>

      {!isReadonly && (
        <PrimaryButton
          label="Lagre"
          icon="content-save-outline"
          size="md"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={onSave}
        />
      )}
      {!!record && !isReadonly && (
        <PrimaryButton
          label="Slett"
          icon="delete-outline"
          tone="danger"
          size="md"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() =>
            deleteMutation.mutate(record.socio_deltakelseid, {
              onSuccess: () => navigation.goBack(),
              onError: (error) => Alert.alert("Feil", String(error)),
            })
          }
        />
      )}
      <PrimaryButton
        label="Tilbake"
        icon="chevron-left"
        size="md"
        tone="muted"
        textSize={ty.buttonMd}
        iconSize={ty.iconMd}
        onPress={() => navigation.goBack()}
      />
    </ScrollView>
  );
}

function TypePicker({
  selected,
  onSelect,
  readOnly,
  ty,
}: {
  selected: number;
  onSelect: (val: number) => void;
  readOnly?: boolean;
  ty: ReturnType<typeof useTypography>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { fontSize: ty.label }]}>Arsak</Text>
      <View style={styles.typeRow}>
        <Chip
          label="Syk"
          active={selected === Fravaerstype.Syk}
          onPress={() => onSelect(Fravaerstype.Syk)}
          disabled={readOnly}
          fontSize={ty.chip}
        />
        <Chip
          label="Sykt barn"
          active={selected === Fravaerstype.SyktBarn}
          onPress={() => onSelect(Fravaerstype.SyktBarn)}
          disabled={readOnly}
          fontSize={ty.chip}
        />
        <Chip
          label="Timeavtale"
          active={selected === Fravaerstype.Timeavtale}
          onPress={() => onSelect(Fravaerstype.Timeavtale)}
          disabled={readOnly}
          fontSize={ty.chip}
        />
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  disabled,
  fontSize,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  fontSize: number;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.chipText, { fontSize }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleAllDay({
  allDay,
  onToggle,
  readOnly,
  ty,
}: {
  allDay: boolean;
  onToggle: () => void;
  readOnly?: boolean;
  ty: ReturnType<typeof useTypography>;
}) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onToggle} disabled={readOnly}>
      <View style={[styles.checkbox, allDay && styles.checkboxChecked, readOnly && styles.disabled]} />
      <Text style={[styles.label, { fontSize: ty.label }]}>Hel dag / flere dager</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  readOnly,
  ty,
}: {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  readOnly?: boolean;
  ty: ReturnType<typeof useTypography>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { fontSize: ty.label }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={!readOnly}
        placeholder={label.includes("dato") ? "2026-03-02" : ""}
        style={[styles.input, { fontSize: ty.input }, readOnly && styles.disabled]}
      />
    </View>
  );
}

function TimeRow({
  label,
  hour,
  minute,
  setHour,
  setMinute,
  readOnly,
  ty,
}: {
  label: string;
  hour: string;
  minute: string;
  setHour: (s: string) => void;
  setMinute: (s: string) => void;
  readOnly?: boolean;
  ty: ReturnType<typeof useTypography>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { fontSize: ty.label }]}>{label}</Text>
      <View style={styles.timeRow}>
        <TextInput
          value={hour}
          onChangeText={(val) => setHour(sanitizeTimeInput(val))}
          keyboardType="number-pad"
          editable={!readOnly}
          style={[styles.input, styles.timeInput, { fontSize: ty.input }, readOnly && styles.disabled]}
          maxLength={2}
        />
        <Text style={[styles.colon, { fontSize: ty.colon }]}>:</Text>
        <TextInput
          value={minute}
          onChangeText={(val) => setMinute(sanitizeTimeInput(val))}
          keyboardType="number-pad"
          editable={!readOnly}
          style={[styles.input, styles.timeInput, { fontSize: ty.input }, readOnly && styles.disabled]}
          maxLength={2}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  title: {
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.text,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontWeight: "600",
    color: theme.colors.text,
  },
  input: {
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.colors.text,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    width: 84,
    textAlign: "center",
  },
  colon: {
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#e6efe7",
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  counter: {
    marginTop: -8,
    color: theme.colors.muted,
  },
});

function sanitizeTimeInput(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 2);
}

function normalizeTwoDigits(value: string): string {
  return value.padStart(2, "0");
}

function parseDateInput(value: string): Date | null {
  const parsed = dayjs(value, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.startOf("day").toDate() : null;
}

function validateTimeRange({
  fromHour,
  fromMinute,
  toHour,
  toMinute,
  sameDate,
}: {
  fromHour: string;
  fromMinute: string;
  toHour: string;
  toMinute: string;
  sameDate: boolean;
}): string | null {
  if (!fromHour || !fromMinute || !toHour || !toMinute) return "Registrer tid.";
  const fh = Number(fromHour);
  const fm = Number(fromMinute);
  const th = Number(toHour);
  const tm = Number(toMinute);
  if ([fh, fm, th, tm].some((n) => Number.isNaN(n))) return "Tid ma vaere tall.";
  if (fh < 0 || fh > 23 || th < 0 || th > 23) return "Timer ma vaere mellom 00 og 23.";
  if (fm < 0 || fm > 59 || tm < 0 || tm > 59) return "Minutter ma vaere mellom 00 og 59.";
  if (sameDate && fh * 60 + fm > th * 60 + tm) {
    return "Til-tid ma vaere etter Fra-tid nar datoene er like.";
  }
  return null;
}
