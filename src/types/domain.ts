export const DeltakelseType = {
  Tilstede: 624610000,
  Fravaer: 624610001,
} as const;

export const Fravaerstype = {
  Syk: 624610000,
  SyktBarn: 624610001,
  Timeavtale: 624610002,
} as const;

export const Registreringsaktivitet = {
  StempletInn: 624610000,
  StempletUt: 624610001,
  LukketAutomatisk: 624610002,
  RegistrertIApp: 624610003,
  RedigertIApp: 624610004,
} as const;

export type DeltakelseRecord = {
  socio_deltakelseid: string;
  socio_deltakelse_fra: string;
  socio_deltakelse_til?: string | null;
  socio_deltakelsetype: number;
  socio_fravrstype?: number | null;
  socio_heldagsfravr?: boolean | null;
  socio_beskrivelse?: string | null;
  socio_registreringsaktivitet?: number | null;
  socio_fnr?: string | null;
  statecode: number;
  statuscode: number;
  createdon?: string;
  _createdby_value?: string;
};

export type UserProfile = {
  oid: string;
  name: string;
  email: string;
};

export type AttendanceFormValues = {
  date: Date;
  fromHour: string;
  fromMinute: string;
  toHour: string;
  toMinute: string;
  comment: string;
};

export type AbsenceFormValues = {
  fromDate: Date;
  toDate: Date;
  fromHour: string;
  fromMinute: string;
  toHour: string;
  toMinute: string;
  allDay: boolean;
  fravaerstype: number;
  comment: string;
};
