import { ThemedText } from '@/components/themed-text'
import { Ionicons } from '@expo/vector-icons'
import { Stack } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Message {
  id: string;
  type: 'text' | 'product_card' | 'day_separator';
  sender?: 'user_me' | 'user_other';
  timestamp?: string;
  text?: string;
  status?: 'sent' | 'delivered' | 'read';
  label?: string;
  product?: {
    title: string;
    description: string;
    image: string;
  };
  link?: {
    url: string;
    preview: boolean;
  };
}

const rawMessages: Message[] = [
  {
    id: 'msg_000_a',
    type: 'day_separator',
    label: 'Ayer',
  },
  {
    id: 'msg_000_b',
    type: 'text',
    sender: 'user_me',
    timestamp: '09:30',
    text: 'Hola, buen día. ¿Tienen stock del iPhone 15 Pro Max?',
    status: 'read',
  },
  {
    id: 'msg_000_c',
    type: 'text',
    sender: 'user_other',
    timestamp: '09:45',
    text: 'Hola! Sí, tenemos stock en color Natural Titanium y Blue Titanium. ¿Cuál te interesa?',
  },
  {
    id: 'msg_000_d',
    type: 'text',
    sender: 'user_me',
    timestamp: '10:05',
    text: 'Me interesa el Natural Titanium de 256GB.',
    status: 'read',
  },
  {
    id: 'msg_000_e',
    type: 'product_card',
    sender: 'user_other',
    timestamp: '10:10',
    product: {
      title: 'iPhone 15 Pro Max',
      description: 'Diseño de titanio. Chip A17 Pro. Botón de Acción. Y el sistema de cámaras más potente en un iPhone.',
      image: 'iphone_15_pro_max.png',
    },
    link: {
      url: 'https://www.apple.com/ar/iphone-15-pro/',
      preview: true,
    },
  },
  {
    id: 'msg_000_f',
    type: 'text',
    sender: 'user_other',
    timestamp: '10:11',
    text: 'Acá te dejo la ficha técnica. El precio es de 1300 USD.',
  },
  {
    id: 'msg_001',
    type: 'day_separator',
    label: 'Hoy',
  },
  {
    id: 'msg_002',
    type: 'product_card',
    sender: 'user_other',
    timestamp: '14:43',
    product: {
      title: 'AirPods Pro 2',
      description:
        'Cancelación activa de ruido de nivel profesional y un gran avance en la salud auditiva.',
      image: 'airpods_pro_2.png',
    },
    link: {
      url: 'https://www.apple.com/ar/airpods-pro/',
      preview: true,
    },
  },
  {
    id: 'msg_003',
    type: 'text',
    sender: 'user_other',
    timestamp: '14:44',
    text: 'Hola! Te dejo el link de los AirPods Pro 2 que me pediste. Son la versión con USB-C.',
  },
  {
    id: 'msg_005',
    type: 'text',
    sender: 'user_me',
    timestamp: '14:52',
    text: 'Genial, gracias. ¿Tienen stock para retirar hoy mismo?',
    status: 'read',
  },
  {
    id: 'msg_006',
    type: 'text',
    sender: 'user_me',
    timestamp: '14:53',
    text: 'Ah, y aceptan USDT?',
    status: 'read',
  },
  {
    id: 'msg_007',
    type: 'text',
    sender: 'user_other',
    timestamp: '14:55',
    text: 'Sí, tenemos stock inmediato en la sucursal de Belgrano. Aceptamos USDT (TRC20) con un 1% de recargo sobre el precio de lista.',
  },
  {
    id: 'msg_008',
    type: 'text',
    sender: 'user_me',
    timestamp: '14:56',
    text: 'Perfecto. ¿Hasta qué hora están abiertos?',
    status: 'read',
  },
  {
    id: 'msg_009',
    type: 'text',
    sender: 'user_other',
    timestamp: '15:00',
    text: 'Estamos hasta las 19:30hs. Te esperamos!',
  },
  {
    id: 'msg_010',
    type: 'text',
    sender: 'user_me',
    timestamp: '16:30',
    text: 'Estoy saliendo para allá.',
    status: 'read',
  },
  {
    id: 'msg_011',
    type: 'text',
    sender: 'user_other',
    timestamp: '16:32',
    text: 'Dale, avisame cuando llegues y te anuncio en seguridad.',
  },
  {
    id: 'msg_012',
    type: 'text',
    sender: 'user_me',
    timestamp: '17:15',
    text: 'Ya estoy en la puerta.',
    status: 'read',
  },
  {
    id: 'msg_013',
    type: 'text',
    sender: 'user_other',
    timestamp: '17:16',
    text: 'Perfecto!',
  },
]


export default function ChatScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const flatListRef = useRef<FlatList<Message>>(null)
  const insets = useSafeAreaInsets()

  const APP_STORE_BLUE = '#4D92E4'

  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true)
        // Pequeño delay para asegurar que el teclado terminó de subir
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
      }
    )
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    )

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  useEffect(() => {
    setMessages(rawMessages)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = () => {
    if (message.trim().length === 0) return

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'text',
      sender: 'user_me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: message.trim(),
      status: 'read',
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage('')
    
    // Scroll al final después de que el estado se actualice
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const renderItem = React.useCallback(({ item, index }: { item: Message; index: number }) => {
    if (item.type === 'day_separator') {
      return (
        <View style={styles.separatorContainer}>
          <Text style={styles.separatorText}>{item.label}</Text>
        </View>
      )
    }

    const isMe = item.sender === 'user_me'
    const nextItem = messages[index + 1]
    const isNextSameSender =
      nextItem && nextItem.sender === item.sender && nextItem.type !== 'day_separator'
    const marginBottom = isNextSameSender ? 4 : 16

    if (item.type === 'product_card') {
      return (
        <View style={[styles.messageRow, { justifyContent: 'flex-start', marginBottom }]}>
          <View style={[styles.productBubble]}>
            {/* Preview */}
            <View style={styles.productPreview}>
              <View style={styles.productText}>
                <Text style={styles.productTitle}>{item.product?.title}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {item.product?.description}
                </Text>
              </View>
            </View>
            <View style={styles.productFooter}>
              <TouchableOpacity style={{ flexShrink: 1 }} activeOpacity={0.6}>
                <Text style={styles.productLink} numberOfLines={1}>{item.link?.url}</Text>
              </TouchableOpacity>
              <Text style={styles.productTime}>{item.timestamp}</Text>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={[styles.messageRow, { justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom }]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <View style={styles.messageContent}>
            <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]} selectable>
              {item.text}
            </Text>
            <View style={styles.timeContainer}>
              <Text style={[styles.time, { color: isMe ? '#656565' : '#86868B' }]}>{item.timestamp}</Text>
              {isMe && (
                <Ionicons 
                  name="checkmark-done" 
                  size={15} 
                  color={item.status === 'read' ? APP_STORE_BLUE : '#8E8E93'} 
                  style={{ marginLeft: 2 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    )
  }, [messages])

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header personalizado para tapar el "blanco" de arriba y ser más compacto */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.customHeaderTitle}>Mensajes</ThemedText>
        <View style={styles.headerSeparator} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3384D5" />
        </View>
      ) : (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 0}
      >
      <FlatList
        ref={flatListRef}
        data={messages}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16, paddingTop: 16 }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
      <View
        style={[
          styles.footer,
          {
            paddingBottom: keyboardVisible ? 10 : (insets.bottom > 0 ? insets.bottom : 10),
            height: keyboardVisible ? 60 : (60 + insets.bottom),
          },
        ]}
      >
        <TextInput
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#A3A3A3"
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200)}
          multiline
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSend}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
      </KeyboardAvoidingView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#E9E9EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#ebebebff',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  headerTitleText: {
    fontSize: 16,
    color: '#fff',
  },
  profileImage: {
    width: 35,
    height: 35,
    backgroundColor: '#3384D5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E1E1E6',
    borderRadius: 21,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#202020e7',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3384D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 2,
  },
  separatorContainer: {
    marginTop: 5,
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorText: {
    fontSize: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 35,
    paddingVertical: 3,
    borderRadius: 10,
    color: '#444444',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    flexShrink: 1,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 18,
    position: 'relative',
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#BADDFF',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1C1C1E',
  },
  textMe: {
    color: '#202020',
  },
  textOther: {
    color: '#202020',
  },
  messageContent: {
    flexDirection: 'column',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    minWidth: 50,
  },
  time: {
    fontSize: 11,
  },
  customHeader: {
    backgroundColor: 'white',
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  headerSeparator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F2F2F7',
  },
  productBubble: {
    maxWidth: '95%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
  },
  productPreview: {
    flexDirection: 'row',
    gap: 10,
  },
  productText: {
    flex: 1,
    gap: 2,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  productLink: {
    fontSize: 13,
    color: '#0071E3',
    textDecorationLine: 'underline',
    paddingLeft: 6,
  },
  productTime: {
    marginLeft: 8,
    fontSize: 11,
    color: '#7F7F7F',
  },
  productTitle: {
    fontSize: 14,
    color: '#1D1D1F',
  },
  productDesc: {
    fontSize: 12,
    color: '#6E6E73',
  },
  bannerContainer: {
    backgroundColor: '#FEEECD',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e6d89cbb',
  },
  bannerText: {
    color: '#000000bd',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  bannerLink: {
    textDecorationLine: 'underline',
  },
})