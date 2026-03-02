import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import dayjs from "dayjs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatePickerField } from "../components/DatePickerField";
import { PrimaryButton } from "../components/PrimaryButton";
import { TimePickerField } from "../components/TimePickerField";
import { theme } from "../config/theme";
import { useDeleteMutation, useDeltakelser, useFravaerMutation } from "../hooks/useDeltakelser";
import { useTypography } from "../hooks/useTypography";
import { RootStackParamList } from "../navigation/types";
import { AbsenceFormValues, Fravaerstype } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "FravaerForm">;

export function FravaerFormScreen({ route, navigation }: Props) {
  const ty = useTypography();
  const { data = [] } = useDeltakelser();
  const record = data.find((r) => r.socio_deltakelseid === route.params?.recordId);
  const isReadonly = false;
  const mutation = useFravaerMutation(record);
  const deleteMutation = useDeleteMutation();
  const isBusy = mutation.isPending || deleteMutation.isPending;

  const [fromDate, setFromDate] = useState(
    record ? dayjs(record.socio_deltakelse_fra).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
  );
  const [toDate, setToDate] = useState(
    record?.socio_deltakelse_til
      ? dayjs(record.socio_deltakelse_til).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
  );
  const [fromTime, setFromTime] = useState(record ? dayjs(record.socio_deltakelse_fra).format("HH:mm") : "");
  const [toTime, setToTime] = useState(record?.socio_deltakelse_til ? dayjs(record.socio_deltakelse_til).format("HH:mm") : "");
  const [comment, setComment] = useState(record?.socio_beskrivelse ?? "");
  const [allDay, setAllDay] = useState(Boolean(record?.socio_heldagsfravr));
  const [fravaerstype, setFravaerstype] = useState<number>(record?.socio_fravrstype ?? Fravaerstype.Syk);

  const title = useMemo(() => {
    if (!record) return "Registrer fravær";
    return "Rediger fravær";
  }, [record]);

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
    if (!allDay) {
      const timeError = validateTimeRange({
        fromTime,
        toTime,
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
    const fromParsed = splitTime(fromTime);
    const toParsed = splitTime(toTime);
    if (!allDay && (!fromParsed || !toParsed)) {
      Alert.alert("Feil", "Registrer tid.");
      return;
    }
    const values: AbsenceFormValues = {
      fromDate: from,
      toDate: to,
      fromHour: fromParsed?.hour ?? "00",
      fromMinute: fromParsed?.minute ?? "00",
      toHour: toParsed?.hour ?? "00",
      toMinute: toParsed?.minute ?? "00",
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
      <DatePickerField
        label="Fra dato (YYYY-MM-DD)"
        value={fromDate}
        onChange={setFromDate}
        readOnly={isReadonly}
        maxDate={dayjs().add(1, "month").format("YYYY-MM-DD")}
      />
      <DatePickerField
        label="Til dato (YYYY-MM-DD)"
        value={toDate}
        onChange={setToDate}
        readOnly={isReadonly}
        minDate={fromDate}
        maxDate={dayjs().add(1, "month").format("YYYY-MM-DD")}
      />
      <ToggleAllDay allDay={allDay} onToggle={() => setAllDay((p) => !p)} readOnly={isReadonly} ty={ty} />
      {!allDay && (
        <>
          <TimePickerField
            label="Fra tid"
            value={fromTime}
            onChange={setFromTime}
            readOnly={isReadonly}
          />
          <TimePickerField
            label="Til tid"
            value={toTime}
            onChange={setToTime}
            readOnly={isReadonly}
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
          loadingLabel="Lagrer..."
          icon="content-save-outline"
          size="md"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          loading={mutation.isPending}
          onPress={onSave}
        />
      )}
      {!!record && !isReadonly && (
        <PrimaryButton
          label="Slett"
          loadingLabel="Sletter..."
          icon="delete-outline"
          tone="danger"
          size="md"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          loading={deleteMutation.isPending}
          disabled={isBusy && !deleteMutation.isPending}
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
        disabled={isBusy}
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

function splitTime(value: string): { hour: string; minute: string } | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":");
  return { hour, minute };
}

function parseDateInput(value: string): Date | null {
  const parsed = dayjs(value, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.startOf("day").toDate() : null;
}

function validateTimeRange({
  fromTime,
  toTime,
  sameDate,
}: {
  fromTime: string;
  toTime: string;
  sameDate: boolean;
}): string | null {
  const from = splitTime(fromTime);
  const to = splitTime(toTime);
  if (!from || !to) return "Registrer tid.";
  const fh = Number(from.hour);
  const fm = Number(from.minute);
  const th = Number(to.hour);
  const tm = Number(to.minute);
  if ([fh, fm, th, tm].some((n) => Number.isNaN(n))) return "Tid ma vaere tall.";
  if (fh < 0 || fh > 23 || th < 0 || th > 23) return "Timer ma vaere mellom 00 og 23.";
  if (fm < 0 || fm > 59 || tm < 0 || tm > 59) return "Minutter ma vaere mellom 00 og 59.";
  if (sameDate && fh * 60 + fm > th * 60 + tm) {
    return "Til-tid ma vaere etter Fra-tid nar datoene er like.";
  }
  return null;
}
