import { Tabs, useRouter } from 'expo-router';
import locationTrackingService from '@/services/location/locationTrackingService';
import jornadaService from '@/services/jornadas/jornadaService';
import * as Location from 'expo-location';
import React, { createContext, memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { HapticTab } from '@/components/haptic-tab';
import { ThemedText } from '@/components/themed-text';
import { HistorySvgIcon } from '@/components/ui/history-svg-icon';
import { HomeSvgIcon } from '@/components/ui/home-svg-icon';
import { MessagesSvgIcon } from '@/components/ui/messages-svg-icon';
import { ProfileSvgIcon } from '@/components/ui/profile-svg-icon';
import { ScannerSvgIcon } from '@/components/ui/scanner-svg-icon';
import { Colors } from '@/constants/theme';

// Contexto para compartir el estado de la jornada
const WorkdayContext = createContext({
  isWorkdayActive: false,
  setIsWorkdayActive: (val: boolean) => { },
  isScannerActive: false, // Nuevo: para controlar la visibilidad del escáner
  setIsScannerActive: (val: boolean) => { }, // Nuevo: para controlar la visibilidad del escáner
  checkWorkdayStatus: async () => { }, // Nuevo: para refrescar el estado
});

export const useWorkday = () => useContext(WorkdayContext);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Detectamos si es un dispositivo con pantalla pequeña (ej: iPhone SE o modelos antiguos)
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;

// --- NUEVOS COMPONENTES SVG INTERNOS ---
const APP_STORE_BLUE = '#4D92E4';

const ChevronLeftIcon = () => (
  <Svg width="12" height="20" viewBox="0 0 12 20" fill="none">
    <Path d="M10 2L2 10L10 18" stroke={APP_STORE_BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FriendsPlayingIcon = () => (
  <Svg width="36" height="29" viewBox="0 0 36 29" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M28.15 1.77253C21.1411 1.40916 14.5056 1.40916 7.49657 1.77253C4.48519 1.92863 2.00951 4.26391 1.77699 7.30486C1.40767 12.135 1.40767 16.7793 1.77699 21.6094C2.00952 24.6504 4.48519 26.9857 7.49657 27.1417C14.5056 27.5052 21.1411 27.5052 28.15 27.1417C31.1615 26.9857 33.637 24.6504 33.8697 21.6094C34.239 16.7793 34.239 12.135 33.8697 7.30486C33.637 4.26391 31.1615 1.92866 28.15 1.77253Z" stroke={APP_STORE_BLUE} strokeWidth="3" />
    <Path d="M13.2832 16.9368C16.2988 16.9368 18.4562 18.6735 18.9014 20.9963C18.9217 21.1029 18.8906 21.1979 18.8164 21.2766C18.7377 21.36 18.6106 21.4211 18.4629 21.4211H8.10352C7.95581 21.4211 7.82873 21.3601 7.75 21.2766C7.6759 21.198 7.64479 21.1027 7.66504 20.9963C8.11018 18.6735 10.2677 16.9368 13.2832 16.9368ZM23.165 16.5393H26.9443C27.5312 16.5393 28.0068 17.015 28.0068 17.6018C28.0067 18.1885 27.5311 18.6643 26.9443 18.6643H23.165C22.5784 18.6642 22.1027 18.1884 22.1025 17.6018C22.1025 17.0151 22.5783 16.5394 23.165 16.5393ZM13.2832 7.52075C14.3979 7.52079 15.1986 7.83265 15.7207 8.35474C16.2427 8.87686 16.5547 9.67755 16.5547 10.7922C16.5547 11.9069 16.2428 12.7076 15.7207 13.2297C15.1986 13.7518 14.3979 14.0637 13.2832 14.0637C12.1685 14.0637 11.3678 13.7518 10.8457 13.2297C10.3236 12.7076 10.0117 11.907 10.0117 10.7922C10.0117 9.67743 10.3236 8.87686 10.8457 8.35474C11.3678 7.83265 12.1684 7.52075 13.2832 7.52075ZM23.165 10.2502H26.9443C27.5312 10.2502 28.0068 10.7259 28.0068 11.3127C28.0067 11.8994 27.5311 12.3752 26.9443 12.3752H23.165C22.5784 12.3752 22.1027 11.8994 22.1025 11.3127C22.1025 10.726 22.5783 10.2503 23.165 10.2502Z" fill={APP_STORE_BLUE} stroke={APP_STORE_BLUE} />
  </Svg>
);

const UpcomingGamesIcon = () => (
  <Svg width="33" height="33" viewBox="0 0 33 33" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M6 14.7633C6 14.5317 6.04572 14.3025 6.13456 14.0886C6.22339 13.8747 6.3536 13.6804 6.51774 13.5166C6.68188 13.3529 6.87675 13.2231 7.09122 13.1345C7.30568 13.0459 7.53554 13.0003 7.76768 13.0003C7.99981 13.0003 8.22967 13.0459 8.44414 13.1345C8.6586 13.2231 8.85347 13.3529 9.01761 13.5166C9.18176 13.6804 9.31196 13.8747 9.4008 14.0886C9.48963 14.3025 9.53535 14.5317 9.53535 14.7633V23.2349C9.53535 23.7025 9.34912 24.1509 9.01761 24.4815C8.68611 24.8122 8.23649 24.9979 7.76768 24.9979C7.29886 24.9979 6.84924 24.8122 6.51774 24.4815C6.18624 24.1509 6 23.7025 6 23.2349L6 14.7656V14.7633ZM27 14.7633C27 14.2957 26.8138 13.8473 26.4823 13.5166C26.1508 13.186 25.7011 13.0003 25.2323 13.0003C24.7635 13.0003 24.3139 13.186 23.9824 13.5166C23.6509 13.8473 23.4646 14.2957 23.4646 14.7633V23.2349C23.4646 23.7025 23.6509 24.1509 23.9824 24.4815C24.3139 24.8122 24.7635 24.9979 25.2323 24.9979C25.7011 24.9979 26.1508 24.8122 26.4823 24.4815C26.8138 24.1509 27 23.7025 27 23.2349V14.7656V14.7633ZM19.4108 7.00016C19.8796 7.00016 20.3292 7.1859 20.6607 7.51653C20.9922 7.84715 21.1785 8.29558 21.1785 8.76315V18.0517C21.1785 18.5193 20.9922 18.9677 20.6607 19.2983C20.3292 19.629 19.8796 19.8147 19.4108 19.8147C18.942 19.8147 18.4923 19.629 18.1608 19.2983C17.8293 18.9677 17.6431 18.5193 17.6431 18.0517V8.76315C17.6431 8.29558 17.8293 7.84715 18.1608 7.51653C18.4923 7.1859 18.942 7.00016 19.4108 7.00016ZM17.6431 23.2373C17.6431 23.7049 17.8293 24.1533 18.1608 24.4839C18.4923 24.8145 18.942 25.0003 19.4108 25.0003C19.8796 25.0003 20.3292 24.8145 20.6607 24.4839C20.9922 24.1533 21.1785 23.7049 21.1785 23.2373V22.6261C21.1785 22.1585 20.9922 21.7101 20.6607 21.3795C20.3292 21.0488 19.8796 20.8631 19.4108 20.8631C18.942 20.8631 18.4923 21.0488 18.1608 21.3795C17.8293 21.7101 17.6431 22.1585 17.6431 22.6261V23.2373ZM13.5892 7.00016C14.058 7.00016 14.5077 7.1859 14.8392 7.51653C15.1707 7.84715 15.3569 8.29558 15.3569 8.76315V18.0517C15.3569 18.5193 15.1707 18.9677 14.8392 19.2983C14.5077 19.629 14.058 19.8147 13.5892 19.8147C13.1204 19.8147 12.6708 19.629 12.3393 19.2983C12.0078 18.9677 11.8215 18.5193 11.8215 18.0517V8.76315C11.8215 8.29558 12.0078 7.84715 12.3393 7.51653C12.6708 7.1859 13.1204 7.00016 13.5892 7.00016ZM11.8215 23.2373C11.8215 23.7049 12.0078 24.1533 12.3393 24.4839C12.6708 24.8145 13.1204 25.0003 13.5892 25.0003C14.058 25.0003 14.5077 24.8145 14.8392 24.4839C15.1707 24.1533 15.3569 23.7049 15.3569 23.2373V22.6261C15.3569 22.1585 15.1707 21.7101 14.8392 21.3795C14.5077 21.0488 14.058 20.8631 13.5892 20.8631C13.1204 20.8631 12.6708 21.0488 12.3393 21.3795C12.0078 21.7101 11.8215 22.1585 11.8215 22.6261V23.2373Z" fill={APP_STORE_BLUE} />
    <Path d="M6.13456 8.08613C6.04572 8.30003 6 8.52928 6 8.7608V8.76315V9.73485C6 10.2024 6.18624 10.6509 6.51774 10.9815C6.84924 11.3121 7.29886 11.4978 7.76768 11.4978C8.23649 11.4978 8.68611 11.3121 9.01761 10.9815C9.34912 10.6509 9.53535 10.2024 9.53535 9.73485V8.7608C9.53535 8.52928 9.48963 8.30003 9.4008 8.08613C9.31196 7.87223 9.18176 7.67788 9.01761 7.51417C8.85347 7.35046 8.6586 7.2206 8.44414 7.132C8.22967 7.0434 7.99981 6.9978 7.76768 6.9978C7.53554 6.9978 7.30568 7.0434 7.09122 7.132C6.87675 7.2206 6.68188 7.35046 6.51774 7.51417C6.3536 7.67788 6.22339 7.87223 6.13456 8.08613Z" fill={APP_STORE_BLUE} />
    <Path d="M23.6346 8.08833C23.5457 8.30222 23.5 8.53148 23.5 8.763V8.76535L23.4646 9.73485C23.4646 10.2024 23.6509 10.6509 23.9824 10.9815C24.3139 11.3121 24.7635 11.4978 25.2323 11.4978C25.7011 11.4978 26.1508 11.3121 26.4823 10.9815C26.8138 10.6509 27 10.2024 27 9.73485L27.0354 8.763C27.0354 8.53148 26.9896 8.30222 26.9008 8.08833C26.812 7.87443 26.6818 7.68008 26.5176 7.51637C26.3535 7.35266 26.1586 7.2228 25.9441 7.1342C25.7297 7.0456 25.4998 7 25.2677 7C25.0355 7 24.8057 7.0456 24.5912 7.1342C24.3768 7.2228 24.1819 7.35266 24.0177 7.51637C23.8536 7.68008 23.7234 7.87443 23.6346 8.08833Z" fill={APP_STORE_BLUE} />
    <Path fillRule="evenodd" clipRule="evenodd" d="M11.0211 1.62743C10.9693 1.14824 10.7294 0.709262 10.3543 0.407006C9.97919 0.104751 9.49948 -0.0360347 9.02067 0.0156033C8.17303 0.105284 7.33266 0.20466 6.50925 0.299188L6.3373 0.318578C4.79667 0.499175 3.36222 1.19549 2.2667 2.29455C1.17119 3.3936 0.478892 4.8309 0.302149 6.37322C0.205276 7.24821 0.10356 8.14259 0.0115314 9.04425C-0.0154736 9.28296 0.00506576 9.52466 0.0719622 9.75538C0.138859 9.98609 0.250785 10.2013 0.401272 10.3884C0.551758 10.5756 0.73782 10.731 0.948701 10.8458C1.15958 10.9605 1.3911 11.0323 1.62987 11.057C1.86864 11.0817 2.10993 11.0587 2.33978 10.9895C2.56964 10.9203 2.7835 10.8061 2.96902 10.6537C3.15453 10.5012 3.30801 10.3135 3.42058 10.1013C3.53315 9.88912 3.60259 9.65671 3.62487 9.41751C3.71448 8.53283 3.81377 7.65541 3.91065 6.778C3.99591 6.05261 4.32282 5.37711 4.83864 4.86042C5.35446 4.34374 6.02913 4.01599 6.75385 3.93004L6.92338 3.91064C7.75164 3.81369 8.57747 3.71916 9.41058 3.62948C9.88937 3.57763 10.328 3.3376 10.63 2.96217C10.932 2.58674 11.0727 2.10664 11.0211 1.62743ZM23.9729 0.0156033C23.7328 -0.0160917 23.4887 0.000607413 23.2551 0.0647181C23.0215 0.128829 22.8031 0.239056 22.6127 0.388913C22.4223 0.53877 22.2637 0.725229 22.1464 0.937319C22.0291 1.14941 21.9553 1.38284 21.9295 1.62389C21.9036 1.86493 21.9262 2.10871 21.9959 2.34089C22.0656 2.57307 22.181 2.78894 22.3353 2.97582C22.4896 3.1627 22.6797 3.3168 22.8944 3.42906C23.1091 3.54132 23.344 3.60946 23.5854 3.62948C24.4161 3.71916 25.242 3.81612 26.0702 3.91064L26.2397 3.93004C26.9645 4.01599 27.6391 4.34374 28.155 4.86042C28.6708 5.37711 28.9977 6.05261 29.0829 6.778L29.3711 9.41751C29.3871 9.66149 29.452 9.89975 29.562 10.118C29.6721 10.3363 29.825 10.5301 30.0116 10.6879C30.1983 10.8457 30.4148 10.9641 30.6482 11.0362C30.8817 11.1083 31.1273 11.1325 31.3703 11.1073C31.6133 11.0822 31.8487 11.0083 32.0625 10.89C32.2763 10.7717 32.4641 10.6114 32.6145 10.4188C32.765 10.2262 32.8751 10.0052 32.9383 9.76903C33.0014 9.53284 33.0163 9.28633 32.9821 9.04425C32.89 8.14017 32.7883 7.24821 32.6914 6.37322C32.5147 4.8309 31.8224 3.3936 30.7269 2.29455C29.6314 1.19549 28.1969 0.499175 26.6563 0.318578L26.4868 0.299188C25.6609 0.202236 24.8206 0.105284 23.9729 0.0156033ZM23.9729 32.9938C23.5004 33.033 23.0314 32.8857 22.6659 32.5835C22.3004 32.2812 22.0675 31.8479 22.0169 31.3761C21.9663 30.9043 22.1021 30.4314 22.3951 30.0584C22.6882 29.6855 23.1154 29.4419 23.5854 29.3799C24.4161 29.2902 25.242 29.1957 26.0678 29.0987L26.2373 29.0794C26.9625 28.9939 27.6377 28.6664 28.154 28.1497C28.6703 27.6329 28.9976 26.9571 29.0829 26.2314L29.3711 23.5919C29.3877 23.3482 29.453 23.1104 29.5634 22.8926C29.6738 22.6748 29.8269 22.4815 30.0136 22.3242C30.2002 22.1669 30.4166 22.0489 30.6499 21.9772C30.8831 21.9055 31.1284 21.8815 31.3711 21.9068C31.6139 21.932 31.849 22.006 32.0625 22.1242C32.276 22.2424 32.4636 22.4024 32.6139 22.5948C32.7643 22.7871 32.8744 23.0078 32.9376 23.2437C33.0009 23.4795 33.016 23.7257 32.9821 23.9676C32.89 24.8692 32.7883 25.7612 32.6914 26.6362C32.5143 28.1783 31.8219 29.6154 30.7264 30.7144C29.631 31.8133 28.1968 32.5098 26.6563 32.6908L26.4868 32.7102C25.6609 32.8072 24.8206 32.9041 23.9729 32.9938ZM9.02067 32.9938C9.49316 33.033 9.96224 32.8857 10.3277 32.5835C10.6932 32.2812 10.9261 31.8479 10.9767 31.3761C11.0273 30.9043 10.8915 30.4314 10.5984 30.0584C10.3054 29.6855 9.8782 29.4419 9.40816 29.3799C8.57748 29.2902 7.75164 29.1933 6.92338 29.0987L6.75385 29.0794C6.02913 28.9934 5.35446 28.6656 4.83864 28.149C4.32282 27.6323 3.99591 26.9568 3.91065 26.2314C3.81377 25.354 3.7169 24.4766 3.62487 23.5919C3.60022 23.3544 3.52909 23.1242 3.41552 22.9142C3.30196 22.7043 3.14819 22.5188 2.96299 22.3683C2.7778 22.2179 2.56481 22.1054 2.33618 22.0373C2.10755 21.9692 1.86777 21.9469 1.63051 21.9716C1.39326 21.9962 1.16318 22.0674 0.953416 22.1811C0.743653 22.2947 0.558312 22.4486 0.407976 22.634C0.25764 22.8193 0.145252 23.0325 0.07723 23.2613C0.00920795 23.4901 -0.0131165 23.7301 0.0115314 23.9676C0.10356 24.8692 0.205276 25.7612 0.302149 26.6362C0.479309 28.1783 1.17174 29.6154 2.26718 30.7144C3.36261 31.8133 4.79683 32.5098 6.3373 32.6908L6.50683 32.7102C7.33266 32.8072 8.17303 32.9041 9.02067 32.9938Z" fill={APP_STORE_BLUE} />
  </Svg>
);

const PlayIconWhite = () => (
  <Svg width="10" height="13" viewBox="0 0 10 13" fill="none">
    <Path d="M0.949407 13C1.22423 13 1.46783 12.8911 1.78014 12.6804L9.19425 7.6838C9.75016 7.31341 10 7.00112 10 6.5C10 6.00615 9.75016 5.69385 9.19425 5.3162L1.78014 0.319553C1.46783 0.108939 1.22423 0 0.949407 0C0.405996 0 0 0.486592 0 1.26369V11.7363C0 12.5207 0.405996 13 0.949407 13Z" fill="white" />
  </Svg>
);

// --- FIN DE COMPONENTES SVG ---

// Componente para una fila de característica (Ícono + Texto)
const FeatureRow = memo(({ Icon, title, description }: { Icon: React.ElementType, title: string, description: string }) => (
  <View style={styles.featureRow}>
    <View style={styles.iconContainer}>
      <Icon />
    </View>
    <View style={styles.textContainer}>
      <ThemedText style={styles.featureTitle}>{title}</ThemedText>
      <ThemedText style={styles.featureDescription}>{description}</ThemedText>
    </View>
  </View>
));

export default function TabLayout() {
  // Forzamos el esquema a 'light' para ignorar el modo oscuro del sistema
  const colorScheme = 'light';

  const [isScannerActive, setIsScannerActive] = useState(false); // Nuevo estado para el escáner
  const [isWorkdayActive, setIsWorkdayActive] = useState(false); // Estado local que alimentará al context
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStartingWorkday, setIsStartingWorkday] = useState(false);

  // Valor animado para controlar la opacidad del fondo oscuro
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const closeWorkdayModal = useCallback(() => {
    // Primero desvanecemos el fondo y luego cerramos el modal para que sea fluido
    Animated.timing(bgOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsModalVisible(false);
    });
  }, [bgOpacity]);

  const openWorkdayModal = useCallback(() => {
    setIsModalVisible(true);
    // Animamos el fondo para que aparezca suavemente
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 450, // Duración de la transición
      delay: 150,    // ESTO ES LA CLAVE: Espera a que el modal suba un poco antes de oscurecer
      useNativeDriver: false, // backgroundColor no soporta native driver
    }).start();
  }, [bgOpacity]);

  const checkWorkdayStatus = useCallback(async () => {
    try {
      const data = await jornadaService.getActiva();
      setIsWorkdayActive(data.activa);
    } catch { }
  }, []);

  const startWorkday = useCallback(async () => {
    try {
      setIsStartingWorkday(true); // Muestra el loader en el botón

      // 1. Validar si ya hay una jornada activa antes de intentar crear una nueva.
      const activeWorkday = await jornadaService.getActiva();
      if (activeWorkday.activa) {
        // Si ya hay una jornada, no mostramos alerta.
        // Simplemente sincronizamos el estado y navegamos a la pantalla de la jornada.
        setIsWorkdayActive(true); // Sincronizar estado
        closeWorkdayModal();
        return;
      }

      // 2. Pedir permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos de ubicación para iniciar la jornada.');
        return;
      }

      // 3. Obtener ubicación y iniciar jornada
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 4. Iniciar jornada.
      // OJO: el retry ante errores de red/5xx ya lo maneja internamente
      // jornadaService.iniciar() (vía authenticatedRequestWithRetry).
      // NO reintentamos acá manualmente: si el primer intento falla con un 4xx
      // (ej. "ya existe una jornada activa"), reintentar solo generaba más 400s
      // en cadena sin solucionar nada.
      try {
        await jornadaService.iniciar(loc.coords.latitude, loc.coords.longitude);
      } catch (error: any) {
        const msg = (error?.message || '').toLowerCase();
        // Si el backend dice que ya hay una jornada activa, no es un fallo real:
        // sincronizamos el estado local y seguimos como si hubiera iniciado bien.
        if (msg.includes('ya existe') || msg.includes('activa')) {
          setIsWorkdayActive(true);
          closeWorkdayModal();
          return;
        }
        throw error; // cualquier otro error sí se propaga y se muestra al usuario
      }

      // 5. Actualizar estado y navegar si todo fue exitoso
      setIsWorkdayActive(true);
      closeWorkdayModal();
    } catch (e: any) {
      alert(e.message || 'No se pudo iniciar la jornada. Por favor, intentá de nuevo.');
    } finally {
      setIsStartingWorkday(false);
    }
  }, [closeWorkdayModal]);

  useEffect(() => {
    checkWorkdayStatus();
  }, [checkWorkdayStatus]);

  // Navega a la pantalla de jornada cuando el estado se activa.
  // Esto asegura que la navegación ocurra DESPUÉS de que el estado se haya propagado.
  useEffect(() => {
    if (isWorkdayActive && !isModalVisible) {
      router.push('/workday');
    }
  }, [isWorkdayActive, isModalVisible, router]);

  useEffect(() => {
    if (isWorkdayActive) {
        locationTrackingService.start();
    } else {
        locationTrackingService.stop();
    }
}, [isWorkdayActive]);

  return (
    <WorkdayContext.Provider value={{ isWorkdayActive, setIsWorkdayActive, isScannerActive, setIsScannerActive, checkWorkdayStatus }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            tabBarInactiveTintColor: '#8E8E93', // Gris iOS estándar, muy legible
            headerShown: false,
            tabBarStyle: {
              height: isScannerActive ? 0 : (IS_SMALL_DEVICE ? 95 : 82),
              paddingBottom: isScannerActive ? 0 : (IS_SMALL_DEVICE ? 12 : 35),
              paddingTop: isScannerActive ? 0 : 12,
              backgroundColor: 'white',
              borderTopWidth: isScannerActive ? 0 : 1, // Ocultar el borde superior
              display: isScannerActive ? 'none' : 'flex', // Ocultar completamente el tab bar
              borderTopColor: '#E5E5E5',
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
            },
            tabBarButton: HapticTab,
          }}>

          <Tabs.Screen
            name="index"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ color, focused }) => (
                <HomeSvgIcon size={27} color={color} focused={focused} />
              ),
            }}
          />

          <Tabs.Screen
            name="chats"
            options={{
              title: 'Mensajes',
              tabBarIcon: ({ color, focused }) => (
                <MessagesSvgIcon size={27} color={color} focused={focused} />
              ),
            }}
          />

          <Tabs.Screen
            name="workday"
            listeners={{
              tabPress: (e) => {
                if (!isWorkdayActive) {
                  e.preventDefault();
                  openWorkdayModal();
                }
              },
            }}
            options={{
              title: 'Jornada laboral',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    top: IS_SMALL_DEVICE ? 10 : 10,
                    height: 62,
                    width: 62,
                    borderRadius: 31,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 2,
                  }}>
                  <ScannerSvgIcon focused={focused} size={62} isActive={isWorkdayActive} />
                </View>
              ),
              tabBarLabel: () => null,
            }}
          />

          <Tabs.Screen
            name="history"
            options={{
              title: 'Historial',
              tabBarIcon: ({ color, focused }) => (
                <HistorySvgIcon size={27} color={color} focused={focused} />
              ),
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, focused }) => (
                <ProfileSvgIcon size={27} color={color} focused={focused} />
              ),
            }}
          />
        </Tabs>

        {/* MODAL NATIVO (REEMPLAZO DE BOTTOM SHEET) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true} // Permite que el modal se dibuje detrás de la barra de estado
          onRequestClose={closeWorkdayModal}
        >
          {/* Usamos Animated.View para que el fondo se oscurezca progresivamente */}
          <Animated.View
            style={[
              styles.modalOverlay,
              {
                backgroundColor: bgOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'], // De transparente a 0.5
                }),
              },
            ]}
          >
            {/* Área superior que permite cerrar al tocar fuera de la tarjeta */}
            <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={closeWorkdayModal} />

            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Indicador visual (barrita) para deslizar */}
              <View style={styles.sheetHandle} />

              {/* 1. Encabezado con botón Cancelar */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeWorkdayModal}>
                  <ChevronLeftIcon />
                  <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
                </TouchableOpacity>
              </View>

              {/* 2. Título principal */}
              <View style={styles.titleContainer}>
                <ThemedText style={styles.mainTitle}>
                  Gestión de jornadas laborales y objetivos
                </ThemedText>
              </View>

              {/* 3. Lista de características */}
              <View style={styles.featuresList}>
                <FeatureRow
                  Icon={FriendsPlayingIcon}
                  title="Inicio y Cierre de Jornada"
                  description="Registra tus ingresos y egresos de los horarios laborales, para poder tener el control e historial de tu operación diaria."
                />
                <FeatureRow
                  Icon={UpcomingGamesIcon}
                  title="Control de Puntos Vinculados"
                  description="Escanea los QRs en tus ubicaciones geográficas asignadas para registrar el tiempo de permanencia en cada una."
                />
              </View>

              {/* Espaciador flexible para empujar el contenido inferior hacia abajo */}
              <View style={{ flex: 1 }} />

              {/* 4. Pie de página: Aviso y Botón */}
              <View style={styles.footer}>
                <ThemedText style={styles.disclaimerText}>
                  Los registros de escaneo, ubicación geográfica y actividad de jornada se utilizan exclusivamente para fines profesionales y laborales. Esta información permite auditar el tiempo de permanencia en tus objetivos asignados y garantizar la transparencia del servicio.{" "}
                </ThemedText>

                {/* Botón principal azul */}
                <TouchableOpacity style={styles.mainButton} onPress={startWorkday} disabled={isStartingWorkday}>
                  {isStartingWorkday ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <ThemedText style={styles.mainButtonText}>Iniciar jornada laboral</ThemedText>
                      <View style={styles.playIconContainer}>
                        <PlayIconWhite />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Modal>
      </View>
    </WorkdayContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1, // Este espacio vacío arriba permite ver el fondo y cerrar el modal
  },
  sheetContent: {
    height: '88%', // Aumentado ligeramente para que la tarjeta suba más
    paddingHorizontal: 25,
    backgroundColor: 'white',
    borderTopLeftRadius: 15, // Puntas redondeadas arriba
    borderTopRightRadius: 15,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D1D6', // Color gris suave tipo iOS
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12, // Espacio superior para que no choque con el borde
  },
  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 20, // Aumentado para pasar el "safe" arriba
    paddingBottom: 20,
    marginLeft: -10, // Para alinear el chevron con el borde del texto de abajo
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  cancelText: {
    color: APP_STORE_BLUE,
    fontSize: 18,
    fontWeight: '400',
  },
  // Título
  titleContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 41,
    letterSpacing: 0.37,
    color: 'black',
  },
  // Características
  featuresList: {
    gap: 35,
    marginTop: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 22,
  },
  iconContainer: {
    width: 36, // Ancho fijo basado en el SVG más ancho
    alignItems: 'center',
    marginTop: 7, // Ajuste fino de alineación vertical
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'black',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93', // Gris típico de iOS
    lineHeight: 20,
  },
  // Pie de página
  footer: {
    alignItems: 'center',
    paddingBottom: 25, // Reducido para que sea más estético
  },
  disclaimerText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
    paddingHorizontal: 10,
    marginTop: 90,
  },
  disclaimerLink: {
    fontSize: 13,
    color: APP_STORE_BLUE,
  },
  // Botón Principal
  mainButton: {
    backgroundColor: APP_STORE_BLUE,
    width: '100%',
    height: 56,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 13,
    // Sombra sutil para el botón
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 5,
    marginBottom: 40,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  playIconContainer: {
    marginTop: 1, // Ajuste fino vertical
  },
});