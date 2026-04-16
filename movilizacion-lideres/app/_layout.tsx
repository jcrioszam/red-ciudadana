import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { PermissionsProvider } from '../src/contexts/PermissionsContext';
import { COLORS } from '../src/theme';

// Polyfill ES2023
if (!Array.prototype.findLastIndex) {
  (Array.prototype as any).findLastIndex = function (callback: any, thisArg?: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback.call(thisArg, this[i], i, this)) return i;
    }
    return -1;
  };
}

function RootNavigator() {
  const { token, loading, publicMode, publicModeLoaded } = useAuth() as any;
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !publicModeLoaded) return;

    const inPublic = segments[0] === '(public)';
    const inPrivate = segments[0] === '(tabs)';
    const inWelcome = segments[0] === undefined || segments[0] === 'welcome';
    const inLogin = segments[0] === 'login';

    if (token) {
      if (!inPrivate) router.replace('/(tabs)/' as any);
    } else if (publicMode) {
      if (!inPublic) router.replace('/(public)/' as any);
    } else {
      if (!inWelcome && !inLogin) router.replace('/welcome');
    }
  }, [token, loading, publicMode, publicModeLoaded, segments]);

  if (loading || !publicModeLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.navy }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <RootNavigator />
      </PermissionsProvider>
    </AuthProvider>
  );
}
