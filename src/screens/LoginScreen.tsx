import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { PrimaryButton } from "../components/PrimaryButton";
import { env, validateEnv } from "../config/env";
import { theme } from "../config/theme";
import { useAuth } from "../context/AuthContext";
import { useTypography } from "../hooks/useTypography";
import {
  clearStampActionParamsFromUrl,
  parseStampActionFromUrl,
  setPendingStampAction,
} from "../utils/stampAction";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${env.entraTenantId}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${env.entraTenantId}/oauth2/v2.0/token`,
};

export function LoginScreen() {
  const { setSession } = useAuth();
  const ty = useTypography();
  const redirectUri = AuthSession.makeRedirectUri({
    path: "auth",
  });
  const missingEnv = validateEnv();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: env.entraClientId,
      scopes: ["openid", "profile", "offline_access", env.dataverseScope],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  useEffect(() => {
    const action = parseStampActionFromUrl();
    if (!action) return;
    setPendingStampAction(action);
    clearStampActionParamsFromUrl();
  }, []);

  useEffect(() => {
    async function complete() {
      if (!response || response.type !== "success") return;
      const code = response.params.code;
      if (!code || !request?.codeVerifier) return;

      const token = await AuthSession.exchangeCodeAsync(
        {
          clientId: env.entraClientId,
          code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery,
      );

      await setSession(token.accessToken, token.idToken);
    }
    void complete();
  }, [request?.codeVerifier, redirectUri, response, setSession]);

  if (missingEnv.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: ty.titleXL }]}>Mangler miljøvariabler</Text>
        <Text style={[styles.subtitle, { fontSize: ty.caption }]}>{missingEnv.join("\n")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: ty.titleXL }]}>Flyktningportalen</Text>
      <Text style={[styles.subtitle, { fontSize: ty.bodyS }]}>Logg inn med Entra ID</Text>
      {!request ? (
        <ActivityIndicator />
      ) : (
        <PrimaryButton
          label="Logg inn"
          icon="login"
          size="md"
          textSize={ty.buttonMd}
          iconSize={ty.iconMd}
          onPress={() => void promptAsync()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  title: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    textAlign: "center",
  },
});
