# Flyktningportalen Mobile - Dokumentasjon

Denne dokumentasjonen beskriver mobilappen i `flyktningportalen-mobile` som er laget for aa speile Canvas-appen i `Flyktningportalen`.

## 1. Mal og formaal

Appen skal levere samme kjernefunksjonalitet som Canvas-appen:

- INN/UT-stempling
- Oversikt over oppmøte
- Oversikt over fravær
- Opprette/redigere/slette registreringer
- Innlogging med Entra ID
- Bruk av samme Dataverse-data og option sets

I tillegg er layout og font/logikk tilpasset mobil med samme design-intensjon som i Canvas (store primarknapper, footer-handlinger, tydelig status).

## 2. Teknologistack

- React Native (Expo) + TypeScript
- React Navigation (native stack)
- React Query (`@tanstack/react-query`)
- Entra ID OAuth2 PKCE via `expo-auth-session`
- Lagring av token/session via `expo-secure-store`
- Dataverse Web API (v9.0) direkte fra app

## 3. Prosjektstruktur

```text
flyktningportalen-mobile/
  src/
    components/
      PrimaryButton.tsx
      RecordCard.tsx
    config/
      env.ts
      theme.ts
    context/
      AuthContext.tsx
    hooks/
      useDeltakelser.ts
      useFontScale.ts
      useTypography.ts
    navigation/
      AppNavigator.tsx
      types.ts
    screens/
      LoginScreen.tsx
      HomeScreen.tsx
      OversiktScreen.tsx
      OppmoteFormScreen.tsx
      FravaerFormScreen.tsx
    services/
      dataverse.ts
    types/
      domain.ts
    utils/
      date.ts
```

## 4. Miljovariabler

Fil: `.env` (opprettes fra `.env.example`)

- `EXPO_PUBLIC_ENTRA_TENANT_ID`
- `EXPO_PUBLIC_ENTRA_CLIENT_ID`
- `EXPO_PUBLIC_DATAVERSE_URL`
- `EXPO_PUBLIC_DATAVERSE_SCOPE`

Eksempel i `.env.example`:

```env
EXPO_PUBLIC_ENTRA_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EXPO_PUBLIC_ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EXPO_PUBLIC_DATAVERSE_URL=https://flyktningportalenutvikling.crm4.dynamics.com
EXPO_PUBLIC_DATAVERSE_SCOPE=https://flyktningportalenutvikling.crm4.dynamics.com/user_impersonation
```

## 5. Innlogging (Entra ID)

### 5.1 Flyt

1. `LoginScreen` starter OAuth2 PKCE-flow med `expo-auth-session`.
2. Bruker logger inn i Entra.
3. Autorisasjonskode byttes mot access token/id token.
4. Token lagres i `SecureStore`.
5. `AppNavigator` viser app-skjermene naar `accessToken` finnes.

### 5.2 Redirect URI

- App scheme: `flyktningportalenmobile://`
- Maa registreres som redirect URI i Entra App Registration (public client/mobile).
- For Azure Static Web Apps (web): `https://<din-app>.azurestaticapps.net/auth`

## 6. Dataverse-integrasjon

### 6.1 Datakilder

- Tabell: `socio_deltakelse` (`socio_deltakelses`)
- Brukertabell: `systemuser` (`systemusers`)

### 6.2 Sentral service

Fil: `src/services/dataverse.ts`

Hovedoperasjoner:

- `listMineRegistreringer()`
  - henter aktive registreringer for innlogget bruker via FetchXML og `azureactivedirectoryobjectid`
- `hentFnrForInnloggetBruker()`
  - henter `governmentid` fra `systemusers`
- `stempleInn()`
- `stempleUt()`
- `saveOppmote()`
- `saveFravaer()`
- `softDelete()` (setter `statecode=1`, `statuscode=2`)

### 6.3 Option sets / domene

Fil: `src/types/domain.ts`

- `DeltakelseType`
  - `Tilstede = 624610000`
  - `Fravaer = 624610001`
- `Fravaerstype`
  - `Syk = 624610000`
  - `SyktBarn = 624610001`
  - `Timeavtale = 624610002`
- `Registreringsaktivitet`
  - `StempletInn = 624610000`
  - `StempletUt = 624610001`
  - `LukketAutomatisk = 624610002`
  - `RegistrertIApp = 624610003`
  - `RedigertIApp = 624610004`

## 7. Skjermlogikk (Canvas-speiling)

## 7.1 Login

- Viser login-knapp hvis env er gyldig.
- Viser tydelig feiltekst ved manglende env.

## 7.2 Home (Startside)

- Viser innlogget bruker + status for dagens siste stempling.
- `INN` er disablet hvis aaapen stempling finnes.
- `UT` er disablet hvis aaapen stempling ikke finnes.
- Navigasjon:
  - `OPPMØTE` -> oversikt oppmøte
  - `FRAVÆR` -> oversikt fravær

## 7.3 Oversikt oppmøte

- Lister registreringer med `DeltakelseType.Tilstede`.
- Filterknapp `Maa rettes` viser kun elementer med aktivitet `LukketAutomatisk`.
- Footer med:
  - Tilbake
  - Maa rettes / Vis alle
  - Nytt

## 7.4 Oversikt fravær

- Lister registreringer med `DeltakelseType.Fravaer`.
- Footer med:
  - Tilbake
  - Nytt

## 7.5 Oppmøte-form

- New / Edit / Readonly styres av valgt record + cutoff-regel.
- Validering:
  - datoformat `YYYY-MM-DD`
  - gyldig tid (00-23 / 00-59)
  - `Til` maa vaere etter `Fra`
  - kommentar maks 150 tegn
  - dato eldre enn cutoff stoppes
- Slett = soft delete.

## 7.6 Fravær-form

- Stotter heldag/fleredager.
- Validering:
  - datoformat `YYYY-MM-DD`
  - `Til-dato >= Fra-dato`
  - ved ikke-heldag: gyldig klokkeslett
  - hvis samme dato: `Til-tid > Fra-tid`
  - kommentar maks 150 tegn
  - cutoff-regel
- Slett = soft delete.

## 8. Typografi og skalering

### 8.1 FontScale (Canvas-baseline)

Fil: `src/hooks/useFontScale.ts`

- Baseline: `width / 400`
- Samme modell som Canvas-oppsettet (telefon-baseline 400).
- Returnerer `xs/small/medium/large/xl`.

### 8.2 Typografi-tokens

Fil: `src/hooks/useTypography.ts`

- Semantiske tokens brukes i stedet for hardkodede fontstorrrelser:
  - titler
  - body
  - labels/input
  - knapper
  - card-tekst
  - empty-state/counters

## 9. UX-sjekkliste mot Canvas

Status: **Implementert i kode**, men maa bekreftes med manuell test i riktig miljo.

- [x] Startside har store vertikale handlingsknapper
- [x] Statusfelt viser ikke inn / inn siden / ut kl.
- [x] INN/UT enable/disable styres av aaapen stempling
- [x] Oppmøte-oversikt har filter "Maa rettes"
- [x] Fravær-oversikt viser kun fravær
- [x] New/Edit/View-logikk med cutoff pa formskjermer
- [x] Soft delete brukes i stedet for hard delete
- [x] Kommentar-felt har tegnbegrensning
- [x] Datofelter/tidsfelter valideres
- [x] Mobil layout med tydelig footer-handlinger

## 10. Kjent gap / anbefalt neste steg

Selv om funksjonaliteten er speilet, anbefales disse stegene for produksjonsklarhet:

1. Sikkerhetsmodell:
   - vurder API-mellomlag (BFF/Azure Function) for aa skjerme direkte Dataverse-kall fra klient.
2. Feilhaandtering:
   - bedre brukerfeedback for spesifikke Dataverse-feilkoder.
3. Robusthet:
   - legg til e2e-test (minimum happy path for INN/UT og lagring).
4. Domeneverifisering:
   - bekreft alle feltnavn i faktisk Dataverse-schema (spesielt FNR-felt i `systemuser`).
5. Observability:
   - legg inn app-logging/telemetri i produksjon.

## 11. Oppstart

```bash
npm install
npm run start
```

Web lokalt:

```bash
npm run web
```

Web build:

```bash
npm run build:web
```

## 12. Azure Static Web Apps

Appen er klargjort for SWA:

- `app.json` -> `expo.web.output = "single"` (SPA)
- `staticwebapp.config.json` for SPA fallback + `/auth` rewrite
- GitHub workflow:
  - `.github/workflows/azure-static-web-apps.yml`

Deploy-flyt:

1. Opprett SWA i Azure portal
2. Knytt repo/branch
3. Sett secret `AZURE_STATIC_WEB_APPS_API_TOKEN` i GitHub
4. Push til `main`
5. Workflow bygger `dist` via `npm run build:web` og publiserer

## 13. Kvalitetssjekk kommandoer

```bash
npx tsc --noEmit
```

Ved endringer:

- kjore typecheck
- sjekke lints
- teste manuelle flyter:
  - login -> INN -> UT
  - nytt oppmøte/fravær
  - redigering
  - slett
  - cutoff/read-only
