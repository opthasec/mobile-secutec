import authService from '@/services/authentication/authService';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { StatusBar, setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const navigationState = useRootNavigationState();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Refuerzo imperativo para asegurar que los valores se apliquen "siempre"
      setStatusBarBackgroundColor('#1f1f1f', false);
      NavigationBar.setButtonStyleAsync('dark');
    }
    // Priorizamos el estilo claro (iconos blancos) para el fondo oscuro
    setStatusBarStyle('light');
  }, []);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (hasChecked.current) return;

    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        if (authenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigationState?.key]);

  // ✅ El Stack SIEMPRE se renderiza
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="light" backgroundColor="#1f1f1f" translucent={false} />
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </ThemeProvider>

      {/* ✅ Loader como overlay encima del Stack */}
      {isChecking && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          zIndex: 999,
        }}>
          <ActivityIndicator size="large" color="#4D92E4" />
        </View>
      )}
    </GestureHandlerRootView>
  );
}