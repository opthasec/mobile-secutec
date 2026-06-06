import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import authService from '@/services/authentication/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
const APP_STORE_BLUE = '#4D92E4';
const IOS_GRAY = '#8E8E93';
const INPUT_BG = '#F2F2F7';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      await authService.login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.header}>
            <View>
              <Svg width="158" height="65" viewBox="0 0 158 65" fill="none">
                <G clipPath="url(#clip0_179_34)">
                  <Path d="M154.504 4.68385C144.17 -7.30955 85.3263 5.97846 72.5793 19.2738L67.1869 21.4848V29.7689C67.1869 33.0418 65.5808 34.5691 62.6666 34.5691C59.7524 34.5691 58.2262 32.9618 58.2262 29.7689V21.4193L52.6885 19.732V29.4561C52.6885 35.2965 56.2931 37.8857 62.4922 37.8857C67.95 37.8857 71.5182 35.922 72.463 31.849C80.8568 46.4244 110.224 60.3888 129.483 64.5635C135.319 65.8291 139.977 64.3308 143.552 59.5087C148.342 53.1084 165.209 17.1064 154.504 4.67657V4.68385Z" fill="#2272b4" />
                  <Path d="M10.5014 26.6924C7.2965 25.7905 5.94477 25.2741 5.94477 24.1031C5.94477 23.1722 7.11482 22.3285 9.52032 22.3285C11.9258 22.3285 13.6773 22.8449 14.622 23.2013L15.8575 19.8702C14.404 19.3538 12.3982 18.9392 9.59299 18.9392C3.82996 18.9392 0.298019 21.3102 0.298019 24.4522C0.298019 27.1288 2.99422 28.8161 7.07848 29.9144C10.029 30.678 11.1991 31.3326 11.1991 32.4818C11.1991 33.6309 9.84735 34.4746 7.2965 34.4746C4.92734 34.4746 2.59451 33.9 1.13377 33.3255L0.00732422 36.7366C1.39539 37.3111 4.16426 37.8857 6.96947 37.8857C13.7136 37.8857 16.8458 35.2674 16.8458 32.1836C16.8458 29.5871 14.84 27.8997 10.5014 26.6924Z" fill="#2272b4" />
                  <Path d="M46.6129 22.3503C48.6187 22.3503 50.1812 22.6776 51.2785 23.034L52.4486 19.7611C51.4602 19.3538 49.28 18.9392 46.3949 18.9392C39.8978 18.9392 34.5127 21.5866 33.2555 26.4451H22.8849V22.6267H32.4706V19.2156H17.3472V37.6093H32.9866V34.1982H22.8922V29.8344H33.0665C33.6697 34.4964 37.9938 37.9148 45.8571 37.9148C48.8076 37.9148 51.1405 37.4784 52.1288 37.122L51.3294 33.8491C50.1957 34.2055 48.3789 34.4455 46.6638 34.4455C41.7437 34.4455 38.8295 32.1254 38.8295 28.4452C38.8295 24.3504 42.2525 22.3576 46.6274 22.3576L46.6129 22.3503Z" fill="#2272b4" />
                  <Path d="M122.477 34.4456C117.557 34.4456 114.643 32.1255 114.643 28.4452C114.643 24.3505 118.066 22.3576 122.441 22.3576C124.447 22.3576 126.016 22.6849 127.106 23.0413L128.276 19.7684C127.288 19.3611 125.108 18.9465 122.223 18.9465C115.726 18.9465 110.341 21.594 109.083 26.4524H98.7128V22.634H108.298V19.1284H74.2944V22.634H80.9295V37.6094H86.4673V22.634H93.1751V37.6094H108.814V34.1983H98.7201V29.8344H108.894C109.498 34.4965 113.822 37.9149 121.685 37.9149C124.643 37.9149 126.968 37.4785 127.957 37.1221L127.157 33.8419C126.024 34.1983 124.207 34.4383 122.492 34.4383L122.477 34.4456Z" fill="white" />
                </G>
                <Defs>
                  <ClipPath id="clip0_179_34">
                    <Rect width="158" height="65" fill="white" />
                  </ClipPath>
                </Defs>
              </Svg>
            </View>
            <ThemedText style={styles.subtitle}>Gestión de Seguridad Profesional</ThemedText>
          </View>

          <View style={styles.form}>
            {/* Input de Correo */}
            <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={20} color={emailFocused ? APP_STORE_BLUE : IOS_GRAY} style={styles.inputIcon} />
              <TextInput
                placeholder="Correo electrónico"
                placeholderTextColor={IOS_GRAY}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Input de Contraseña */}
            <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? APP_STORE_BLUE : IOS_GRAY} style={styles.inputIcon} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={IOS_GRAY}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={IOS_GRAY}
                />
              </TouchableOpacity>
            </View>
            {error ? <ThemedText style={{ color: 'red', marginBottom: 10 }}>{error}</ThemedText> : null}
            <TouchableOpacity
              style={[styles.button, (!email || !password || isLoading) && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={!email || !password || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 20,
    backgroundColor: '#F0F7FF',
    padding: 15,
    borderRadius: 25,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#2272b4',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: IOS_GRAY,
    marginTop: 15,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  button: {
    backgroundColor: '#2272b4',
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#2272b4',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 56,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#2272b4',
    backgroundColor: 'white',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    marginTop: -5,
  },
  forgotText: {
    color: '#2272b4',
    fontSize: 14,
    fontWeight: '600',
  },
});