import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PrimaryButton } from "../components/PrimaryButton";
import { theme } from "../config/theme";
import { useAuth } from "../context/AuthContext";
import { useDeltakelser, useHomeState, useStemplingMutations } from "../hooks/useDeltakelser";
import { useTypography } from "../hooks/useTypography";
import { RootStackParamList } from "../navigation/types";
import { formatTimeLabel } from "../utils/date";
import {
  clearPendingStampAction,
  clearStampActionParamsFromUrl,
  getPendingStampAction,
  parseStampActionFromUrl,
} from "../utils/stampAction";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;
type QrNoticeTone = "success" | "info" | "error";

export function HomeScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const { profile, signOut } = useAuth();
  const { data = [], isLoading, refetch } = useDeltakelser();
  const { latest, open } = useHomeState(data);
  const { innMutation, utMutation } = useStemplingMutations();
  const ty = useTypography();
  const mainButtonHeight = Math.max(86, Math.min(124, Math.round(height * 0.13)));
  const footerHeight = Math.max(72, Math.round(height * 0.1));
  const mainGap = Math.max(12, Math.round(height * 0.018));
  const hasHandledActionRef = useRef(false);
  const [qrNotice, setQrNotice] = useState<{
    tone: QrNoticeTone;
    title: string;
    message: string;
  } | null>(null);

  const statusText = useMemo(() => {
    if (!latest) return "Ikke stemplet inn i dag";
    if (!latest.socio_deltakelse_til) {
      return `Stemplet inn siden ${formatTimeLabel(latest.socio_deltakelse_fra)}`;
    }
    return `Stemplet ut kl. ${formatTimeLabel(latest.socio_deltakelse_til)}`;
  }, [latest]);

  useEffect(() => {
    if (isLoading || hasHandledActionRef.current) return;

    const actionFromUrl = parseStampActionFromUrl();
    const pendingAction = getPendingStampAction();
    const action = actionFromUrl ?? pendingAction;
    if (!action) return;

    hasHandledActionRef.current = true;
    clearPendingStampAction();
    clearStampActionParamsFromUrl();

    if (action === "inn") {
      if (open) {
        setQrNotice({
          tone: "info",
          title: "Ingen ny stempling",
          message: "Du er allerede stemplet inn.",
        });
        return;
      }
      innMutation.mutate(undefined, {
        onSuccess: () =>
          setQrNotice({
            tone: "success",
            title: "Stempling utført",
            message: "Du er stemplet inn.",
          }),
        onError: (error) =>
          setQrNotice({
            tone: "error",
            title: "Kunne ikke stemple inn",
            message: String(error),
          }),
      });
      return;
    }

    if (!open) {
      setQrNotice({
        tone: "error",
        title: "Kunne ikke stemple ut",
        message: "Ingen åpen stempling å stemple ut.",
      });
      return;
    }
    utMutation.mutate(open.socio_deltakelseid, {
      onSuccess: () =>
        setQrNotice({
          tone: "success",
          title: "Stempling utført",
          message: "Du er stemplet ut.",
        }),
      onError: (error) =>
        setQrNotice({
          tone: "error",
          title: "Kunne ikke stemple ut",
          message: String(error),
        }),
    });
  }, [innMutation, isLoading, open, utMutation]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.userText, { fontSize: ty.bodyL }]}>
        Innlogget: {profile?.name || "Ukjent bruker"}
      </Text>
      {!!qrNotice && (
        <View
          style={[
            styles.noticeCard,
            qrNotice.tone === "success" && styles.noticeSuccess,
            qrNotice.tone === "info" && styles.noticeInfo,
            qrNotice.tone === "error" && styles.noticeError,
          ]}
        >
          <Text style={[styles.noticeTitle, { fontSize: ty.bodyM }]}>{qrNotice.title}</Text>
          <Text style={[styles.noticeMessage, { fontSize: ty.bodyS }]}>{qrNotice.message}</Text>
          <Pressable onPress={() => setQrNotice(null)} style={styles.noticeCloseBtn}>
            <Text style={[styles.noticeCloseText, { fontSize: ty.caption }]}>Lukk melding</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.statusCard}>
        <Text style={[styles.status, { fontSize: ty.bodyM }]}>{statusText}</Text>
      </View>

      <View style={styles.buttonsFrame}>
        <View style={[styles.buttons, { gap: mainGap }]}>
          <PrimaryButton
            label="INN"
            icon="clock-outline"
            iconPosition="right"
            size="lg"
            style={{ height: mainButtonHeight }}
            textSize={ty.buttonLg}
            iconSize={ty.iconLg}
            disabled={Boolean(open) || innMutation.isPending}
            onPress={() =>
              innMutation.mutate(undefined, {
                onError: (error) => Alert.alert("Feil", String(error)),
              })
            }
          />
          <PrimaryButton
            label="UT"
            icon="home-export-outline"
            iconPosition="right"
            size="lg"
            style={{ height: mainButtonHeight }}
            textSize={ty.buttonLg}
            iconSize={ty.iconLg}
            disabled={!open || utMutation.isPending}
            onPress={() =>
              open &&
              utMutation.mutate(open.socio_deltakelseid, {
                onError: (error) => Alert.alert("Feil", String(error)),
              })
            }
          />
          <PrimaryButton
            label="OPPMØTE"
            icon="format-list-bulleted"
            iconPosition="right"
            size="lg"
            style={{ height: mainButtonHeight }}
            textSize={ty.buttonLg}
            iconSize={ty.iconLg}
            onPress={() => navigation.navigate("OversiktOppmote")}
          />
          <PrimaryButton
            label="FRAVÆR"
            icon="calendar-remove-outline"
            iconPosition="right"
            size="lg"
            style={{ height: mainButtonHeight }}
            textSize={ty.buttonLg}
            iconSize={ty.iconLg}
            onPress={() => navigation.navigate("OversiktFravaer")}
          />
        </View>
      </View>

      <View style={[styles.footerButtons, { minHeight: footerHeight }]}>
        <PrimaryButton
          label="Oppdater"
          icon="refresh"
          size="md"
          tone="muted"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => void refetch()}
          style={styles.half}
        />
        <PrimaryButton
          label="Logg ut"
          icon="logout"
          size="md"
          tone="muted"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => void signOut()}
          style={styles.half}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 18,
    gap: 14,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userText: {
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  statusCard: {
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  status: {
    textAlign: "center",
    color: theme.colors.text,
    fontWeight: "600",
  },
  noticeCard: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  noticeSuccess: {
    backgroundColor: "#e6efe7",
    borderColor: theme.colors.primary,
  },
  noticeInfo: {
    backgroundColor: "#eef2ff",
    borderColor: theme.colors.border,
  },
  noticeError: {
    backgroundColor: "#fdeaea",
    borderColor: theme.colors.danger,
  },
  noticeTitle: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  noticeMessage: {
    color: theme.colors.text,
    fontWeight: "500",
  },
  noticeCloseBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  noticeCloseText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  buttonsFrame: {
    flex: 1,
    justifyContent: "center",
  },
  buttons: {
    width: "92%",
    alignSelf: "center",
  },
  footerButtons: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 4,
  },
  half: {
    flex: 1,
  },
});
