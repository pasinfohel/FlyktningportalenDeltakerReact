# Flyktningportalen Mobile (React Native)

Mobilapp som speiler Canvas-appen i dette repoet:

- INN/UT-stempling
- Oversikt for oppmøte og fravær
- Opprette/redigere/slette registreringer
- Entra ID innlogging
- Dataverse som datakilde (`socio_deltakelse`)

## Kom i gang

1. Installer avhengigheter:

```bash
npm install
```

2. Lag `.env` fra `.env.example` og fyll inn verdier.

3. Start appen:

```bash
npm run start
```

For web lokalt:

```bash
npm run web
```

For produksjonsbuild (web):

```bash
npm run build:web
```

## Viktig om Entra/Dataverse

Du ma konfigurere App Registration i Entra ID (web-first for SWA/PWA):

- Web redirect (Azure SWA): `https://<din-app>.azurestaticapps.net/auth`
- Lokal web redirect (utvikling): `http://localhost:8081/auth` (eller porten Expo bruker)
- Scope til Dataverse: `https://<org>.crm4.dynamics.com/user_impersonation`
- Delegated permissions for Dataverse API

Hvis du senere vil kjoere native app separat, kan du i tillegg registrere mobil redirect URI (`flyktningportalenmobile://auth`).

## Distribusjon via Azure Static Web Apps

Denne appen er satt opp for SWA-distribusjon av web-versjonen:

- `staticwebapp.config.json` er lagt til for SPA-fallback og `/auth`-route.
- GitHub workflow finnes i:
  - `.github/workflows/azure-static-web-apps.yml`

### Kort oppsett

1. Opprett en Azure Static Web App knyttet til repo/branch.
2. Legg til secret i GitHub:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
3. Push til `main`.
4. Workflow bygger med `npm run build:web` og publiserer `dist`.

### Viktig

SWA distribuerer web-klienten (og PWA-opplevelsen paa mobil/desktop). Native distribusjon (App Store/Google Play/MDM) krever egen native build/pipeline.

## PWA-stotte

Appen er satt opp som installbar webapp (PWA-grunnoppsett):

- `public/manifest.webmanifest`
- `public/sw.js` (service worker)
- registrering av service worker + manifest i `index.ts`

Merk:

- Android/Chrome vil vanligvis vise install-prompt når kriterier er oppfylt.
- iOS/Safari bruker "Legg til på hjemskjerm".
- For best install-opplevelse anbefales egne 192x192 og 512x512 app-ikoner.

## Datamapping (fra Canvas)

- Tabell: `socio_deltakelse` (`socio_deltakelses`)
- User-tabell: `systemuser` (`systemusers`)
- Option sets brukt:
  - `socio_deltakelsetype` (Tilstede/Fravær)
  - `socio_fravrstype` (Syk/Sykt barn/Timeavtale)
  - `socio_registreringsaktivitet`
  - `socio_heldagsfravr`

## Utfyllende dokumentasjon

Se `DOKUMENTASJON.md` for:

- arkitektur
- auth- og Dataverse-flyt
- UI/UX-samsvar mot Canvas
- valideringsregler
- test- og driftssjekkliste

For konkret manuell test, se `TESTPLAN.md`.
