import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { FravaerFormScreen } from "../screens/FravaerFormScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OppmoteFormScreen } from "../screens/OppmoteFormScreen";
import { OversiktFravaerScreen, OversiktOppmoteScreen } from "../screens/OversiktScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { accessToken, profile } = useAuth();
  const isAuthenticated = Boolean(accessToken && profile?.oid);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="OversiktOppmote" component={OversiktOppmoteScreen} />
            <Stack.Screen name="OversiktFravaer" component={OversiktFravaerScreen} />
            <Stack.Screen name="OppmoteForm" component={OppmoteFormScreen} />
            <Stack.Screen name="FravaerForm" component={FravaerFormScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
