import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PrimaryButton } from "../components/PrimaryButton";
import { RecordCard } from "../components/RecordCard";
import { theme } from "../config/theme";
import { isMaaRettes, useDeltakelser } from "../hooks/useDeltakelser";
import { useTypography } from "../hooks/useTypography";
import { RootStackParamList } from "../navigation/types";
import { DeltakelseType } from "../types/domain";

type OppmoteProps = NativeStackScreenProps<RootStackParamList, "OversiktOppmote">;
type FravaerProps = NativeStackScreenProps<RootStackParamList, "OversiktFravaer">;

export function OversiktOppmoteScreen({ navigation }: OppmoteProps) {
  const { height } = useWindowDimensions();
  const ty = useTypography();
  const { data = [] } = useDeltakelser();
  const [showMaaRettes, setShowMaaRettes] = useState(false);
  const footerHeight = Math.max(72, Math.round(height * 0.1));
  const records = useMemo(
    () =>
      data.filter(
        (r) =>
          r.socio_deltakelsetype === DeltakelseType.Tilstede &&
          (!showMaaRettes || isMaaRettes(r)),
      ),
    [data, showMaaRettes],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: ty.titleXL }]}>Oppmote</Text>
      <View style={styles.listArea}>
        <FlatList
          data={records}
          keyExtractor={(item) => item.socio_deltakelseid}
          contentContainerStyle={records.length === 0 ? styles.emptyList : undefined}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Text style={[styles.emptyText, { fontSize: ty.emptyState }]}>Ingen oppmote funnet.</Text>}
          renderItem={({ item }) => (
            <RecordCard
              record={item}
              rightLabel={isMaaRettes(item) ? "Maa rettes" : undefined}
              onPress={() => navigation.navigate("OppmoteForm", { recordId: item.socio_deltakelseid })}
            />
          )}
        />
      </View>
      <View style={[styles.footer, { minHeight: footerHeight }]}>
        <PrimaryButton
          label="Tilbake"
          icon="chevron-left"
          size="md"
          style={[styles.footerButton, { height: footerHeight - 8 }]}
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => navigation.goBack()}
          tone="muted"
          iconPosition="left"
        />
        <PrimaryButton
          label={showMaaRettes ? "Vis alle" : "Maa rettes"}
          icon="alert-outline"
          size="md"
          tone={showMaaRettes ? "muted" : "primary"}
          style={[styles.footerButton, { height: footerHeight - 8 }]}
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => setShowMaaRettes((prev) => !prev)}
        />
        <PrimaryButton
          label="Nytt"
          icon="plus"
          iconPosition="right"
          size="md"
          style={[styles.footerButton, { height: footerHeight - 8 }]}
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => navigation.navigate("OppmoteForm", {})}
        />
      </View>
    </View>
  );
}

export function OversiktFravaerScreen({ navigation }: FravaerProps) {
  const { height } = useWindowDimensions();
  const ty = useTypography();
  const { data = [] } = useDeltakelser();
  const records = useMemo(
    () => data.filter((r) => r.socio_deltakelsetype === DeltakelseType.Fravaer),
    [data],
  );
  const footerHeight = Math.max(72, Math.round(height * 0.1));

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: ty.titleXL }]}>Fravaer</Text>
      <View style={styles.listArea}>
        <FlatList
          data={records}
          keyExtractor={(item) => item.socio_deltakelseid}
          contentContainerStyle={records.length === 0 ? styles.emptyList : undefined}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Text style={[styles.emptyText, { fontSize: ty.emptyState }]}>Ingen fravaer funnet.</Text>}
          renderItem={({ item }) => (
            <RecordCard
              record={item}
              onPress={() => navigation.navigate("FravaerForm", { recordId: item.socio_deltakelseid })}
            />
          )}
        />
      </View>
      <View style={[styles.footer, { minHeight: footerHeight }]}>
        <PrimaryButton
          label="Tilbake"
          icon="chevron-left"
          size="md"
          tone="muted"
          style={[styles.footerButtonWide, { height: footerHeight - 8 }]}
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => navigation.goBack()}
        />
        <PrimaryButton
          label="Nytt"
          icon="plus"
          iconPosition="right"
          size="md"
          style={[styles.footerButtonWide, { height: footerHeight - 8 }]}
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => navigation.navigate("FravaerForm", {})}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 14,
    gap: 12,
  },
  title: {
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  listArea: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    minHeight: 80,
    alignItems: "stretch",
  },
  footerButton: {
    flex: 1,
  },
  footerButtonWide: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.muted,
    fontWeight: "600",
  },
});
