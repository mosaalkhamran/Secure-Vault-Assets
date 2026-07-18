import { Stack } from 'expo-router';

export default function PrivacyCoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        gestureEnabled: false,
        contentStyle: { backgroundColor: '#1C1C1E' },
      }}
    />
  );
}
