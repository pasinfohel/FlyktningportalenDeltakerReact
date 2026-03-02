# Testplan - Flyktningportalen Web (SWA/PWA)

Denne testplanen er laget for manuell verifisering av webappen.

## 1. Forutsetninger

- `.env` er konfigurert med gyldige verdier.
- App Registration i Entra ID er satt opp med web redirect URI `https://<din-app>.azurestaticapps.net/auth` (og/eller lokal `http://localhost:8081/auth`).
- Testbruker har tilgang til Dataverse-miljoet.
- Appen starter uten build-feil.

## 2. Oppstart

1. Kjor `npm install`
2. Kjor `npm run start`
3. Start app i nettleser (`npm run web`)

Forventet:

- Login-skjerm vises.

## 3. Login

### TC-LOGIN-01: Vellykket innlogging

Steg:

1. Trykk `Logg inn`
2. Fullfor Entra ID-innlogging

Forventet:

- App navigerer til startside.
- Brukernavn vises i toppen.

### TC-LOGIN-02: Manglende konfigurasjon

Steg:

1. Fjern en env-variabel
2. Start app pa nytt

Forventet:

- Skjermen viser hvilke variabler som mangler.

## 4. Startside / stempling

### TC-HOME-01: INN fungerer

Steg:

1. Kontroller at `INN` er aktiv
2. Trykk `INN`

Forventet:

- Ny registrering opprettes i Dataverse med:
  - `socio_deltakelsetype = Tilstede`
  - `socio_registreringsaktivitet = Stemplet inn i app`
- `INN` blir disablet.
- `UT` blir aktiv.
- Status viser "Stemplet inn siden HH:mm".

### TC-HOME-02: UT fungerer

Steg:

1. Med aaapen stempling, trykk `UT`

Forventet:

- Aktiv registrering oppdateres med `socio_deltakelse_til`.
- `UT` blir disablet.
- `INN` blir aktiv.
- Status viser "Stemplet ut kl. HH:mm".

### TC-HOME-03: Oppdater-knapp

Steg:

1. Trykk `Oppdater`

Forventet:

- Data hentes pa nytt uten feil.

## 5. Oversikt oppmøte

### TC-OPP-OV-01: Liste viser oppmøte

Steg:

1. Fra startside, trykk `OPPMØTE`

Forventet:

- Kun registreringer av type `Tilstede` vises.

### TC-OPP-OV-02: Filter "Må rettes"

Steg:

1. Trykk `Må rettes`

Forventet:

- Kun registreringer med aktivitet `Lukket apen stempling automatisk` vises.
- Knappetekst byttes til `Vis alle`.

### TC-OPP-OV-03: Ny oppmøte

Steg:

1. Trykk `Nytt`

Forventet:

- Skjerm for registrering av oppmøte apnes i ny-modus.

## 6. Oppmøte-form

### TC-OPP-FORM-01: Lagre gyldig oppmøte

Steg:

1. Sett gyldig dato
2. Sett `Fra` og `Til` med gyldig tid
3. Skriv kommentar (under 150 tegn)
4. Trykk `Lagre`

Forventet:

- Lagres i Dataverse.
- Navigerer tilbake til oversikt.

### TC-OPP-FORM-02: Ugyldig datoformat

Steg:

1. Skriv dato som ikke er `YYYY-MM-DD`
2. Trykk `Lagre`

Forventet:

- Feilmelding vises.
- Ingen lagring.

### TC-OPP-FORM-03: Ugyldig tid

Steg:

1. Sett `Fra` senere enn `Til` (samme dato)
2. Trykk `Lagre`

Forventet:

- Feilmelding vises.
- Ingen lagring.

### TC-OPP-FORM-04: Kommentar for lang

Steg:

1. Skriv kommentar > 150 tegn
2. Trykk `Lagre`

Forventet:

- Feilmelding vises.
- Ingen lagring.

### TC-OPP-FORM-05: Slett oppmøte

Steg:

1. Apne eksisterende oppmøte
2. Trykk `Slett`

Forventet:

- Record settes inaktiv (`statecode=1`, `statuscode=2`).
- Item forsvinner fra aktive oversikter.

### TC-OPP-FORM-06: Cutoff read-only

Steg:

1. Apne et gammelt oppmøte (eldre enn cutoff)

Forventet:

- Skjerm er read-only.
- `Lagre`/`Slett` vises ikke.

## 7. Oversikt fravær

### TC-FRA-OV-01: Liste viser fravær

Steg:

1. Fra startside, trykk `FRAVÆR`

Forventet:

- Kun registreringer av type `Fravær` vises.

### TC-FRA-OV-02: Nytt fravær

Steg:

1. Trykk `Nytt`

Forventet:

- Fravær-form apnes i ny-modus.

## 8. Fravær-form

### TC-FRA-FORM-01: Lagre heldag

Steg:

1. Sett `Fra dato` og `Til dato`
2. Huk av `Hel dag / flere dager`
3. Velg arsak
4. Trykk `Lagre`

Forventet:

- Lagring lykkes uten krav om klokkeslett.

### TC-FRA-FORM-02: Lagre med klokkeslett

Steg:

1. Fjern heldag
2. Sett gyldige tider
3. Velg arsak
4. Trykk `Lagre`

Forventet:

- Lagring lykkes.

### TC-FRA-FORM-03: Ugyldig datointervall

Steg:

1. Sett `Til dato` tidligere enn `Fra dato`
2. Trykk `Lagre`

Forventet:

- Feilmelding vises.

### TC-FRA-FORM-04: Ugyldig tid pa samme dag

Steg:

1. Samme `Fra`/`Til` dato
2. Sett `Til tid` tidligere enn `Fra tid`
3. Trykk `Lagre`

Forventet:

- Feilmelding vises.

### TC-FRA-FORM-05: Slett fravær

Steg:

1. Apne eksisterende fravær
2. Trykk `Slett`

Forventet:

- Soft delete gjennomfores.

## 9. Navigasjon og UI

### TC-UI-01: Footer-handlinger

Steg:

1. Apne begge oversikter

Forventet:

- Footer-knapper ligger nederst.
- `Tilbake` returnerer riktig.
- `Nytt` apner riktig form.

### TC-UI-02: Responsiv typografi

Steg:

1. Test pa minst to skjermbredder

Forventet:

- Tekst skaleres konsistent (basert pa 400-baseline).
- Ingen overlapp i titler/knapper.

## 10. Datavalidering i Dataverse (spot-check)

Etter testene over, sjekk noen records direkte i Dataverse:

- Oppmøte records har riktig type og aktivitet.
- Fravær records har riktig type, arsak og heldag-felt.
- Slettede records er inaktive.

## 11. Exit-kriterier

Test godkjennes nar:

- Alle kritiske flyter (login, INN/UT, lagre/slette oppmøte/fravær) er bestatt.
- Ingen blokkende feil i validering eller navigasjon.
- Dataverse-data stemmer med forventede felter/verdier.
