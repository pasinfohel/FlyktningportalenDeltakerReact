import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import dayjs from "dayjs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DatePickerField } from "../components/DatePickerField";
import { PrimaryButton } from "../components/PrimaryButton";
import { TimePickerField } from "../components/TimePickerField";
import { theme } from "../config/theme";
import { useDeleteMutation, useDeltakelser, useOppmoteMutation } from "../hooks/useDeltakelser";
import { useTypography } from "../hooks/useTypography";
import { RootStackParamList } from "../navigation/types";
import { AttendanceFormValues } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "OppmoteForm">;

export function OppmoteFormScreen({ route, navigation }: Props) {
  const ty = useTypography();
  const { data = [] } = useDeltakelser();
  const record = data.find((r) => r.socio_deltakelseid === route.params?.recordId);
  const isReadonly = false;
  const mutation = useOppmoteMutation(record);
  const deleteMutation = useDeleteMutation();
  const isBusy = mutation.isPending || deleteMutation.isPending;

  const [dateInput, setDateInput] = useState(
    record ? dayjs(record.socio_deltakelse_fra).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
  );
  const [fromTime, setFromTime] = useState(record ? dayjs(record.socio_deltakelse_fra).format("HH:mm") : "");
  const [toTime, setToTime] = useState(record?.socio_deltakelse_til ? dayjs(record.socio_deltakelse_til).format("HH:mm") : "");
  const [comment, setComment] = useState(record?.socio_beskrivelse ?? "");

  const title = useMemo(() => {
    if (!record) return "Registrer oppmøte";
    return "Rediger oppmøte";
  }, [record]);

  const onSave = () => {
    const date = parseDateInput(dateInput);
    if (!date) {
      Alert.alert("Feil", "Ugyldig dato. Bruk format YYYY-MM-DD.");
      return;
    }
    const timeError = validateTimeRange({ fromTime, toTime });
    if (timeError) {
      Alert.alert("Feil", timeError);
      return;
    }
    if (comment.length > 150) {
      Alert.alert("Feil", "Kommentar kan maks være 150 tegn.");
      return;
    }
    const from = splitTime(fromTime);
    const to = splitTime(toTime);
    if (!from || !to) {
      Alert.alert("Feil", "Registrer tid.");
      return;
    }
    const values: AttendanceFormValues = {
      date,
      fromHour: from.hour,
      fromMinute: from.minute,
      toHour: to.hour,
      toMinute: to.minute,
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
        label="Dato (YYYY-MM-DD)"
        value={dateInput}
        onChange={setDateInput}
        readOnly={isReadonly}
        maxDate={dayjs().format("YYYY-MM-DD")}
      />
      <TimePickerField
        label="Fra"
        value={fromTime}
        onChange={setFromTime}
        readOnly={isReadonly}
      />
      <TimePickerField
        label="Til"
        value={toTime}
        onChange={setToTime}
        readOnly={isReadonly}
      />
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
          loadingLabel="Lagre"
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
        placeholder={label.includes("Dato") ? "2026-03-02" : ""}
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
}: {
  fromTime: string;
  toTime: string;
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
  if (fh * 60 + fm > th * 60 + tm) return "Til-tid ma vaere etter Fra-tid.";
  return null;
}
