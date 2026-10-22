import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AnekLatin_400Regular, AnekLatin_500Medium, AnekLatin_600SemiBold, AnekLatin_700Bold, AnekLatin_800ExtraBold } from '@expo-google-fonts/anek-latin';
import { ClerkProvider } from '@clerk/expo';
import { DEV_AUTH, useAuth } from '../auth';
import { tokenCache } from '@clerk/expo/token-cache';
import { resourceCache } from '@clerk/expo/resource-cache';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme';
import { QueryProvider } from '../query';
import { Txt } from '../ui/core';

SplashScreen.preventAutoHideAsync();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function Routes() {
  const { c } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => { if (isLoaded) SplashScreen.hideAsync(); }, [isLoaded]);
  if (!isLoaded) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="list/[id]/index" />
        <Stack.Screen name="list/[id]/add" />
        <Stack.Screen name="trip/[id]/index" />
        <Stack.Screen name="trip/[id]/bill" />
        <Stack.Screen name="txn/[id]" />
        <Stack.Screen name="txn/new" />
        <Stack.Screen name="trips/index" />
        <Stack.Screen name="trips/[id]" />
        <Stack.Screen name="product/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      {/* reachable signed-in or out: it is where Google sign-in lands */}
      <Stack.Screen name="sso-callback" />
    </Stack>
  );
}

// swipe-to-delete (react-native-gesture-handler) only receives touches inside this root view
export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><App /></GestureHandlerRootView>;
}

function App() {
  const { c, dark } = useTheme();
  const path = usePathname();
  const [loaded] = useFonts({
    AnekLatin_400Regular, AnekLatin_500Medium, AnekLatin_600SemiBold, AnekLatin_700Bold, AnekLatin_800ExtraBold,
    'AnekLatin-Wide800': require('../../assets/fonts/AnekLatin-Wide800.ttf'),
    'AnekLatin-Wordmark800': require('../../assets/fonts/AnekLatin-Wordmark800.ttf'),
  });
  if (!loaded) return null;
  // dev-only screen gallery works without auth, for design checks
  if (__DEV__ && path.startsWith('/dev')) {
    SplashScreen.hideAsync();
    return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
  }
  if (DEV_AUTH) {
    return (
      <QueryProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Routes />
      </QueryProvider>
    );
  }
  if (!publishableKey) {
    SplashScreen.hideAsync();
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'center' }}>
        <Txt v="section">Clerk key missing</Txt>
        <Txt color="mute" style={{ marginTop: 8 }}>Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in app/.env and restart.</Txt>
      </View>
    );
  }
  // resourceCache lets Clerk start signed-in with no network (cold start in a basement store)
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} __experimental_resourceCache={resourceCache}>
      <QueryProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Routes />
      </QueryProvider>
    </ClerkProvider>
  );
}
