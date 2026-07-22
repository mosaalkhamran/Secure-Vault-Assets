import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { VaultProvider } from '@/contexts/VaultContext';
import AppLockOverlay from '@/components/AppLockOverlay';
import { useAutoLock } from '@/hooks/useAutoLock';
import i18n, { initI18n } from '@/services/i18n';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function AutoLockMount() {
  useAutoLock();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true)).catch(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nReady) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, i18nReady]);

  if ((!fontsLoaded && !fontError) || !i18nReady) return null;

  return (
    <I18nextProvider i18n={i18n}>
    <SafeAreaProvider>
      <ErrorBoundary>
        <VaultProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AutoLockMount />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: { backgroundColor: '#0A0A12' },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="lock" options={{ animation: 'none', gestureEnabled: false }} />
                  <Stack.Screen name="forgot-pin" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="onboarding" options={{ animation: 'none', gestureEnabled: false }} />
                  <Stack.Screen name="viewer" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="trash" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="subscription" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                  <Stack.Screen name="privacy-cover" options={{ animation: 'none', gestureEnabled: false }} />
                  <Stack.Screen name="album/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="legal" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="setup-decoy-pin" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                </Stack>
                <AppLockOverlay />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </VaultProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </I18nextProvider>
  );
}
