import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  hentFnrForInnloggetBruker,
  listMineRegistreringer,
  saveFravaer,
  saveOppmote,
  softDelete,
  stempleInn,
  stempleUt,
} from "../services/dataverse";
import {
  AbsenceFormValues,
  AttendanceFormValues,
  DeltakelseRecord,
  DeltakelseType,
  Registreringsaktivitet,
} from "../types/domain";
import { useAuth } from "../context/AuthContext";

const queryKey = ["deltakelser"];
type DeltakelserSnapshot = DeltakelseRecord[] | undefined;

export function useDeltakelser() {
  const { accessToken, profile } = useAuth();

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!accessToken || !profile?.oid) return [];
      return listMineRegistreringer({ accessToken, oid: profile.oid });
    },
    enabled: Boolean(accessToken && profile?.oid),
  });
}

export function useHomeState(records: DeltakelseRecord[]) {
  return useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todays = records
      .filter(
        (r) =>
          r.socio_deltakelsetype === DeltakelseType.Tilstede &&
          r.socio_deltakelse_fra?.slice(0, 10) === todayIso,
      )
      .sort((a, b) => a.socio_deltakelse_fra.localeCompare(b.socio_deltakelse_fra));
    const latest = todays[todays.length - 1];
    const open = todays.find((r) => !r.socio_deltakelse_til);
    return { latest, open };
  }, [records]);
}

export function useStemplingMutations() {
  const qc = useQueryClient();
  const { accessToken, profile } = useAuth();

  const innMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken || !profile?.oid) throw new Error("Ikke innlogget");
      const fnr = await hentFnrForInnloggetBruker({ accessToken, oid: profile.oid });
      await stempleInn({ accessToken, fnr });
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<DeltakelseRecord[]>(queryKey);
      const now = new Date().toISOString();
      const optimistic: DeltakelseRecord = {
        socio_deltakelseid: `tmp-${Date.now()}`,
        socio_deltakelse_fra: now,
        socio_deltakelse_til: null,
        socio_deltakelsetype: DeltakelseType.Tilstede,
        socio_registreringsaktivitet: Registreringsaktivitet.StempletInn,
        statecode: 0,
        statuscode: 1,
        createdon: now,
      };
      qc.setQueryData<DeltakelseRecord[]>(queryKey, (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _vars, ctx: { previous: DeltakelserSnapshot } | undefined) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey });
    },
  });

  const utMutation = useMutation({
    mutationFn: async (recordId: string) => {
      if (!accessToken) throw new Error("Ikke innlogget");
      await stempleUt({ accessToken, recordId });
    },
    onMutate: async (recordId: string) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<DeltakelseRecord[]>(queryKey);
      const now = new Date().toISOString();
      qc.setQueryData<DeltakelseRecord[]>(queryKey, (old = []) =>
        old.map((r) =>
          r.socio_deltakelseid === recordId
            ? {
                ...r,
                socio_deltakelse_til: now,
                socio_registreringsaktivitet: Registreringsaktivitet.StempletUt,
              }
            : r,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx: { previous: DeltakelserSnapshot } | undefined) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey });
    },
  });

  return { innMutation, utMutation };
}

export function useOppmoteMutation(record?: DeltakelseRecord) {
  const qc = useQueryClient();
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: async (values: AttendanceFormValues) => {
      if (!accessToken) throw new Error("Ikke innlogget");
      await saveOppmote({ accessToken, record, values });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey });
    },
  });
}

export function useFravaerMutation(record?: DeltakelseRecord) {
  const qc = useQueryClient();
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: async (values: AbsenceFormValues) => {
      if (!accessToken) throw new Error("Ikke innlogget");
      await saveFravaer({ accessToken, record, values });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteMutation() {
  const qc = useQueryClient();
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!accessToken) throw new Error("Ikke innlogget");
      await softDelete({ accessToken, recordId });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey });
    },
  });
}

export function isMaaRettes(record: DeltakelseRecord) {
  return record.socio_registreringsaktivitet === Registreringsaktivitet.LukketAutomatisk;
}
