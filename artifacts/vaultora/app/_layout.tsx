import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { VaultProvider } from '@/contexts/VaultContext';
import AppLockOverlay from '@/components/AppLockOverlay';
import { useAutoLock } from '@/hooks/useAutoLock';

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

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
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
  );
}
