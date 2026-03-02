const dataverseUrl = process.env.EXPO_PUBLIC_DATAVERSE_URL ?? "";
const dataverseHost = dataverseUrl.replace("https://", "").replace(/\/$/, "");

export const env = {
  entraTenantId: process.env.EXPO_PUBLIC_ENTRA_TENANT_ID ?? "",
  entraClientId: process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID ?? "",
  dataverseUrl,
  dataverseScope:
    process.env.EXPO_PUBLIC_DATAVERSE_SCOPE ??
    (dataverseHost ? `https://${dataverseHost}/user_impersonation` : ""),
};

export function validateEnv(): string[] {
  const missing: string[] = [];
  if (!env.entraTenantId) missing.push("EXPO_PUBLIC_ENTRA_TENANT_ID");
  if (!env.entraClientId) missing.push("EXPO_PUBLIC_ENTRA_CLIENT_ID");
  if (!env.dataverseUrl) missing.push("EXPO_PUBLIC_DATAVERSE_URL");
  if (!env.dataverseScope) missing.push("EXPO_PUBLIC_DATAVERSE_SCOPE");
  return missing;
}
