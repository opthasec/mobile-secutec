import { ThemedText } from '@/components/themed-text'
import { Stack } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const ComingSoonIcon = () => (
  <Svg width="80" height="80" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.5 7.5C12.5 6.94772 12.0523 6.5 11.5 6.5C10.9477 6.5 10.5 6.94772 10.5 7.5V11.5C10.5 12.0523 10.9477 12.5 11.5 12.5H15.5C16.0523 12.5 16.5 12.0523 16.5 11.5C16.5 10.9477 16.0523 10.5 15.5 10.5H12.5V7.5Z"
      fill="#C6C6C8"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"
      fill="#C6C6C8"
    />
  </Svg>
)

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ComingSoonIcon />
      <ThemedText style={styles.title}>Próximamente</ThemedText>
      <ThemedText style={styles.subtitle}>
        Esta sección se encuentra en desarrollo y estará disponible en futuras actualizaciones.
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3C3C43',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
})