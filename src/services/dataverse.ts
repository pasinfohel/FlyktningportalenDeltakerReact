import dayjs from "dayjs";
import { env } from "../config/env";
import {
  AbsenceFormValues,
  AttendanceFormValues,
  DeltakelseRecord,
  DeltakelseType,
  Registreringsaktivitet,
} from "../types/domain";
import { toIsoDateTime } from "../utils/date";

type TokenArg = { accessToken: string };

function headers(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function buildFetchXml(oid: string) {
  return `
    <fetch>
      <entity name="socio_deltakelse">
        <attribute name="socio_deltakelseid" />
        <attribute name="socio_deltakelse_fra" />
        <attribute name="socio_deltakelse_til" />
        <attribute name="socio_deltakelsetype" />
        <attribute name="socio_fravrstype" />
        <attribute name="socio_heldagsfravr" />
        <attribute name="socio_beskrivelse" />
        <attribute name="socio_registreringsaktivitet" />
        <attribute name="socio_fnr" />
        <attribute name="statecode" />
        <attribute name="statuscode" />
        <attribute name="createdon" />
        <order attribute="socio_deltakelse_fra" descending="true" />
        <filter>
          <condition attribute="statecode" operator="eq" value="0" />
        </filter>
        <link-entity name="systemuser" from="systemuserid" to="createdby" alias="u">
          <filter>
            <condition attribute="azureactivedirectoryobjectid" operator="eq" value="${oid}" />
          </filter>
        </link-entity>
      </entity>
    </fetch>
  `;
}

async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers(token),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dataverse error ${res.status}: ${text}`);
  }
  // Dataverse often responds with 204 No Content for create/update requests.
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export async function listMineRegistreringer({
  accessToken,
  oid,
}: TokenArg & { oid: string }): Promise<DeltakelseRecord[]> {
  const fetchXml = encodeURIComponent(buildFetchXml(oid));
  const url = `${env.dataverseUrl}/api/data/v9.0/socio_deltakelses?fetchXml=${fetchXml}`;
  const data = await request<{ value: DeltakelseRecord[] }>(url, accessToken);
  return data.value ?? [];
}

export async function hentFnrForInnloggetBruker({
  accessToken,
  oid,
}: TokenArg & { oid: string }): Promise<string | null> {
  const url =
    `${env.dataverseUrl}/api/data/v9.0/systemusers` +
    `?$select=azureactivedirectoryobjectid,governmentid` +
    `&$filter=azureactivedirectoryobjectid eq '${oid}'`;
  const data = await request<{ value: Array<{ governmentid?: string }> }>(
    url,
    accessToken,
  );
  return data.value[0]?.governmentid ?? null;
}

export async function stempleInn({
  accessToken,
  fnr,
}: TokenArg & { fnr: string | null }): Promise<void> {
  const payload = {
    socio_deltakelse_fra: new Date().toISOString(),
    socio_deltakelse_til: null,
    socio_deltakelsetype: DeltakelseType.Tilstede,
    socio_registreringsaktivitet: Registreringsaktivitet.StempletInn,
    socio_fnr: fnr,
  };
  await request(`${env.dataverseUrl}/api/data/v9.0/socio_deltakelses`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function stempleUt({
  accessToken,
  recordId,
}: TokenArg & { recordId: string }): Promise<void> {
  const payload = {
    socio_deltakelse_til: new Date().toISOString(),
    socio_registreringsaktivitet: Registreringsaktivitet.StempletUt,
  };
  await request(
    `${env.dataverseUrl}/api/data/v9.0/socio_deltakelses(${recordId})`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function saveOppmote({
  accessToken,
  record,
  values,
}: TokenArg & { record?: DeltakelseRecord; values: AttendanceFormValues }): Promise<void> {
  const from = toIsoDateTime(values.date, values.fromHour, values.fromMinute);
  const to = toIsoDateTime(values.date, values.toHour, values.toMinute);
  const payload = {
    socio_deltakelse_fra: from,
    socio_deltakelse_til: to,
    socio_beskrivelse: values.comment || null,
    socio_deltakelsetype: DeltakelseType.Tilstede,
    socio_registreringsaktivitet: record
      ? Registreringsaktivitet.RedigertIApp
      : Registreringsaktivitet.RegistrertIApp,
  };

  if (!record) {
    await request(`${env.dataverseUrl}/api/data/v9.0/socio_deltakelses`, accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return;
  }

  await request(
    `${env.dataverseUrl}/api/data/v9.0/socio_deltakelses(${record.socio_deltakelseid})`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function saveFravaer({
  accessToken,
  record,
  values,
}: TokenArg & { record?: DeltakelseRecord; values: AbsenceFormValues }): Promise<void> {
  const from = values.allDay
    ? dayjs(values.fromDate).startOf("day").toISOString()
    : toIsoDateTime(values.fromDate, values.fromHour, values.fromMinute);
  const to = values.allDay
    ? dayjs(values.toDate).endOf("day").toISOString()
    : toIsoDateTime(values.toDate, values.toHour, values.toMinute);

  const payload = {
    socio_deltakelse_fra: from,
    socio_deltakelse_til: to,
    socio_beskrivelse: values.comment || null,
    socio_deltakelsetype: DeltakelseType.Fravaer,
    socio_fravrstype: values.fravaerstype,
    socio_heldagsfravr: values.allDay,
    socio_registreringsaktivitet: record
      ? Registreringsaktivitet.RedigertIApp
      : Registreringsaktivitet.RegistrertIApp,
  };

  if (!record) {
    await request(`${env.dataverseUrl}/api/data/v9.0/socio_deltakelses`, accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return;
  }

  await request(
    `${env.dataverseUrl}/api/data/v9.0/socio_deltakelses(${record.socio_deltakelseid})`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function softDelete({
  accessToken,
  recordId,
}: TokenArg & { recordId: string }): Promise<void> {
  const payload = { statecode: 1, statuscode: 2 };
  await request(
    `${env.dataverseUrl}/api/data/v9.0/socio_deltakelses(${recordId})`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
