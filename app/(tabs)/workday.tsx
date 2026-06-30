import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import jornadaService from '@/services/jornadas/jornadaService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import visitaService from '@/services/objetivos/visitaService';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Dimensions, PanResponder, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { useWorkday } from './_layout';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';
import locationTrackingService from '@/services/location/locationTrackingService';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INFO_PANEL_HEIGHT = SCREEN_HEIGHT * 0.5; // altura del panel en estado normal
const INFO_PANEL_COLLAPSED = SCREEN_HEIGHT * 0.08; // solo el handle visible
const APP_STORE_BLUE = '#4D92E4';

const MapPinIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke={APP_STORE_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke={APP_STORE_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EmptyActivitiesIcon = () => (
  <Svg width="64" height="64" viewBox="0 0 16 16" fill="none">
    <Path
      fill="#D1D1D6"
      d="M1.5 2.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0M3 2h13v1.5H3zM3 5.5h13V7H3zM3 9h13v1.5H3zM3 12.5h13V14H3zM.75 7a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M1.5 13.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0M.75 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"
    />
  </Svg>
);

const ClockWaitIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M12 7V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HistoryActionIcon = ({ color = APP_STORE_BLUE }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 16 16" fill="none">
    <G fill={color}>
      <Path d="m3.507 7.73.963-.962 1.06 1.06-2.732 2.732L-.03 7.732l1.06-1.06.979.978a7 7 0 1 1 2.041 5.3l1.061-1.06a5.5 5.5 0 1 0-1.604-4.158" />
      <Path d="M8.25 8V4h1.5v3.69l1.78 1.78-1.06 1.06-2-2A.75.75 0 0 1 8.25 8" />
    </G>
  </Svg>
);

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Helper para formatear duración desde segundos
const formatDuracion = (segundos: number | null) => {
  if (segundos == null) return '—';

  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;

  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}h ${mm}m ${ss}s`;
  }
  return `${m}m ${ss}s`;
};

// Helper para formatear hora desde ISO string
const formatHora = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

// Helper para calcular duración de visita
const calcDuracionVisita = (entrada: string, salida: string | null) => {
  if (!salida) return 'En curso';
  const seg = Math.floor((new Date(salida).getTime() - new Date(entrada).getTime()) / 1000);
  return formatDuracion(seg);
};

export default function WorkdayScreen() {
  const { isWorkdayActive, setIsWorkdayActive, setIsScannerActive, checkWorkdayStatus } = useWorkday();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [jornadaData, setJornadaData] = useState<any>(null); // datos reales de la jornada activa
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const webViewRef = useRef<any>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEndSupervisionModal, setShowEndSupervisionModal] = useState(false); // Nuevo: para finalizar supervisión
  const [isProcessing, setIsProcessing] = useState(false);
  const [loaderText, setLoaderText] = useState('Procesando...');

  const scanAnim = useRef(new Animated.Value(0)).current;

  const [visitaActiva, setVisitaActiva] = useState<{
    activa: boolean;
    visita?: { id: number; objetivo_nombre: string; entrada: string }
  }>({ activa: false });

  const [duracionSupervision, setDuracionSupervision] = useState<string>('');
  const [canFinalizeSupervision, setCanFinalizeSupervision] = useState(false);
  const [visitasAnteriores, setVisitasAnteriores] = useState<any[]>([]);
  const [escaneosCount, setEscaneosCount] = useState<number>(0);

  const panelAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = colapsado
  const panelCollapsed = useRef(false);

  // Helper para refrescar datos de la jornada (lista de visitas)
  const refreshJornadaDetails = useCallback(async (jornadaId: number) => {
    try {
      const detail = await jornadaService.getDetalle(jornadaId);
      setVisitasAnteriores(detail.visitas);
      setEscaneosCount(detail.visitas.length);
    } catch { }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 40) {
          // deslizó hacia abajo → colapsar
          Animated.spring(panelAnim, {
            toValue: 1,
            useNativeDriver: false,
            tension: 40,
            friction: 8,
          }).start();
          panelCollapsed.current = true;
        } else if (gs.dy < -40) {
          // deslizó hacia arriba → expandir
          Animated.spring(panelAnim, {
            toValue: 0,
            useNativeDriver: false,
            tension: 40,
            friction: 8,
          }).start();
          panelCollapsed.current = false;
        }
      },
    })
  ).current;

  const panelHeight = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [INFO_PANEL_HEIGHT, INFO_PANEL_COLLAPSED],
  });

  const checkVisitaActiva = useCallback(async () => {
    try {
      const data = await visitaService.getActiva();
      setVisitaActiva(data);

      // Sincronizamos con el background task para el recordatorio de salida
      if (data.activa && data.visita) {
        await locationTrackingService.setVisitaActiva({
          id: data.visita.id,
          entrada: data.visita.entrada,
          objetivo_nombre: data.visita.objetivo_nombre,
        });
      } else {
        await locationTrackingService.setVisitaActiva(null);
      }

      if (jornadaData?.id) {
        refreshJornadaDetails(jornadaData.id);
      }
    } catch {
      // silencioso, no crítico
    }
  }, [jornadaData?.id, refreshJornadaDetails]);

  // ── Todos los hooks ANTES de cualquier return ──
  // Timer para la duración de la supervisión actual
    
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (visitaActiva.activa && visitaActiva.visita) {
      const tick = () => {
        const start = new Date(visitaActiva.visita!.entrada).getTime();
        const now = Date.now();
        const diffSeconds = Math.floor((now - start) / 1000);
        setDuracionSupervision(formatDuracion(diffSeconds));
        // Check if duration is >= 5 minutes (300 seconds)
        setCanFinalizeSupervision(diffSeconds >= 300);
      };
      tick();
      interval = setInterval(tick, 1000); // Cada segundo
    } else {
      // Reset when no active visit
      setCanFinalizeSupervision(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visitaActiva]);

  useEffect(() => {
    if (isWorkdayActive) checkVisitaActiva();
  }, [isWorkdayActive, checkVisitaActiva]);

  useEffect(() => {
    if (showScanner) {
      animationRef.current = Animated.loop(
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      animationRef.current?.start();
      setIsScannerActive(true);

      const backAction = () => {
        handleCloseScanner();
        return true;
      };

      let backHandlerSubscription: any;
      if (Platform.OS === 'android') {
        backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', backAction);
      }

      return () => {
        animationRef.current?.stop();
        scanAnim.setValue(0);
        setIsScannerActive(false);
        backHandlerSubscription?.remove();
      };
    } else {
      animationRef.current?.stop();
      scanAnim.setValue(0);
      setIsScannerActive(false);
    }
  }, [showScanner, setIsScannerActive, scanAnim]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      if (!isWorkdayActive) {
        setLocation(null);
        setErrorMsg(null);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation);
          webViewRef.current?.injectJavaScript(`
          if (window.liveMarker && window.liveMap && window.liveCircle) {
            var latlng = [${newLocation.coords.latitude}, ${newLocation.coords.longitude}];
            window.liveMarker.setLatLng(latlng);
            window.liveCircle.setLatLng(latlng);
            window.liveCircle.setRadius(${newLocation.coords.accuracy ?? 50});
            window.liveMap.panTo(latlng);
          }
          true;
        `);
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [isWorkdayActive]);

  // Cargar datos reales de la jornada activa
  useEffect(() => {
    if (!isWorkdayActive) return;
    jornadaService.getActiva()
      .then(data => {
        if (data.activa) {
          setJornadaData(data.jornada);
          refreshJornadaDetails(data.jornada.id);
        }
      })
      .catch(() => { });
  }, [isWorkdayActive]);

  const locationBadgeText = location
    ? `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`
    : errorMsg || 'Obteniendo ubicación GPS...';

  const handleOpenScanner = useCallback(async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        alert('Se requieren permisos de cámara para escanear el código QR.');
        return;
      }
    }
    setShowScanner(true);
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback(async ({ data }: { data: string }) => {
    console.log('--- Iniciando handleBarcodeScanned ---');
    console.log('Dato del QR escaneado:', data);
    setShowScanner(false);
    setLoaderText('Registrando supervisión...');
    setIsProcessing(true); // <-- Mostramos el loader

    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Estado del permiso de ubicación:', status);
    if (status !== 'granted') {
      alert('Se necesitan permisos de ubicación para registrar la visita.');
      setIsProcessing(false); // <-- Ocultamos el loader
      return;
    }

    let loc;
    try {
      console.log('Obteniendo ubicación actual...');
      loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      console.log('Ubicación obtenida:', loc);
    } catch (err) {
      console.error('Error al obtener la ubicación:', err);
      alert('No se pudo obtener la ubicación. Intentá de nuevo.');
      setIsProcessing(false); // <-- Ocultamos el loader
      return;
    }

    try {
      console.log('Llamando a visitaService.registrar con:', {
        qrData: data,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      // Simulamos una pequeña demora para que el loader sea visible
      // en redes rápidas. Puedes quitar esto si no lo necesitas.
      await new Promise(resolve => setTimeout(resolve, 500));

      const result: any = await visitaService.registrar(data, loc.coords.latitude, loc.coords.longitude);
      console.log('Respuesta de visitaService.registrar:', result);
      alert(result?.detail ?? 'Supervisión registrada correctamente.');
      await checkVisitaActiva(); // ← actualiza el botón
    } catch (e: any) {
      console.error('Error en visitaService.registrar:', e);
      alert(e.message || 'No se pudo registrar la supervisión. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setIsProcessing(false); // <-- Ocultamos el loader en cualquier caso
    }
  }, [checkVisitaActiva]);
  const handleCloseScanner = useCallback(() => {
    setShowScanner(false);
  }, []);

  // ✅ Nuevo: para finalizar la supervisión sin escanear
  const handleFinalizarSupervision = useCallback(async () => {
    if (!visitaActiva.activa || !visitaActiva.visita?.id) {
      alert('No hay una supervisión activa para finalizar.');
      return;
    }

    setShowEndSupervisionModal(false);
    setLoaderText('Finalizando supervisión...');
    setIsProcessing(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos de ubicación para registrar el egreso.');
        setIsProcessing(false);
        return; // <-- Aseguramos que el loader se oculte
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const result = await visitaService.finalizar(
        visitaActiva.visita.id,
        loc.coords.latitude,
        loc.coords.longitude
      );

      alert(result?.detail ?? 'Supervisión finalizada correctamente.');
      await checkVisitaActiva(); // Actualiza el estado de la UI
    } catch (e: any) {
      console.error('Error en visitaService.finalizar:', e);
      console.error('Detalles del error:', e.message, e.stack);
      alert(e.message || 'No se pudo finalizar la supervisión. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  }, [visitaActiva, checkVisitaActiva]);

  // ✅ Movido acá, antes de cualquier return condicional
  const handleFinalizarJornada = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos de ubicación para finalizar la jornada.');
        return;
      }

      setShowConfirmModal(false);
      setLoaderText('Finalizando jornada...');
      setIsProcessing(true);

      // Si hay una visita activa, la finalizamos primero.
      // Esta lógica ahora está DENTRO del try/catch principal.
      if (visitaActiva.activa && visitaActiva.visita?.id) {
        const supervisionLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await visitaService.finalizar(
          visitaActiva.visita.id,
          supervisionLoc.coords.latitude,
          supervisionLoc.coords.longitude
        );
        // Refrescamos el estado para que la UI sepa que ya no hay visita activa.
        await checkVisitaActiva();
      }


      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Pequeña demora para que el loader sea visible
      await new Promise(resolve => setTimeout(resolve, 500));

      const jornadaFinalizada = await jornadaService.finalizar(
        loc.coords.latitude,
        loc.coords.longitude
      );

      // Guardar jornada finalizada
      setJornadaData(jornadaFinalizada);

      // Obtener detalle REAL de esa jornada
      try {
        const detalle = await jornadaService.getDetalle(
          jornadaFinalizada.jornada?.id || jornadaFinalizada.id
        );

        setEscaneosCount(detalle.visitas.length);
      } catch {
        setEscaneosCount(0);
      }

      setIsWorkdayActive(false);

      // Forzamos la re-verificación del estado global para evitar inconsistencias.
      await checkWorkdayStatus();

    } catch (e: any) {
      console.error('Error en jornadaService.finalizar:', e);
      alert(e.message || 'No se pudo finalizar la jornada. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  }, [setIsWorkdayActive, jornadaData, checkWorkdayStatus, visitaActiva, checkVisitaActiva]);

  // ── Returns condicionales DESPUÉS de todos los hooks ──

  if (showScanner) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 375 772"
            style={StyleSheet.absoluteFill}
            preserveAspectRatio="xMidYMid slice"
          >
            <Path
              fillRule="evenodd"
              d="M375 772H0V0H375V772ZM56 173.406C47.1634 173.406 40 180.57 40 189.406V503.238C40 512.075 47.1634 519.238 56 519.238H319C327.837 519.238 335 512.075 335 503.238V189.406C335 180.57 327.837 173.406 319 173.406H56Z"
              fill="black"
              fillOpacity={0.7}
            />
            <G stroke="white" strokeWidth={6} strokeLinecap="round">
              <Line x1="43" y1="196" x2="43" y2="176" />
              <Line x1="43" y1="176" x2="63" y2="176" />
              <Line x1="312" y1="176" x2="332" y2="176" />
              <Line x1="332" y1="176" x2="332" y2="196" />
              <Line x1="43" y1="496" x2="43" y2="516" />
              <Line x1="43" y1="516" x2="63" y2="516" />
              <Line x1="312" y1="516" x2="332" y2="516" />
              <Line x1="332" y1="496" x2="332" y2="516" />
            </G>
          </Svg>
          <ThemedText style={styles.scannerInstructionTextPrimary}>
            {visitaActiva.activa
              ? 'Escaneá el QR para egresar al punto de control'
              : 'Escaneá el QR para ingresar del punto de control'}
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={handleCloseScanner}>
            <ThemedText style={styles.backButtonText}>Volver atrás</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isWorkdayActive) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <View style={styles.emptyIllustration}>
          <Svg width="110" height="110" viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#81a366" strokeWidth="1" />
            <Path d="M8 12L11 15L16 9" stroke="#81a366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <ThemedText style={styles.emptyTitle}>JORNADA FINALIZADA</ThemedText>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>INICIO</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {jornadaData ? formatHora(jornadaData.inicio) : '—'}
              </ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>FIN</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {jornadaData ? formatHora(jornadaData.fin) : '—'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.summarySeparator} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>ESCANEOS</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {escaneosCount}
              </ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>DURACIÓN</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {jornadaData ? formatDuracion(jornadaData.duracion_segundos) : '—'}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={styles.emptySubtitle}>
          Si deseas iniciar una nueva jornada presiona el botón central de abajo
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>

      {/* Modal de Carga */}
      <Modal
        visible={isProcessing}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={APP_STORE_BLUE} />
            <ThemedText style={styles.loaderText}>{loaderText}</ThemedText>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para FINALIZAR SUPERVISIÓN */}
      <Modal
        visible={showEndSupervisionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndSupervisionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>¿Finalizar supervisión?</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Se registrará el egreso del objetivo{' '}
              <ThemedText style={{ fontWeight: 'bold' }}>
                "{visitaActiva.visita?.objetivo_nombre ?? 'actual'}".
              </ThemedText>
            </ThemedText>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEndSupervisionModal(false)}
              >
                <ThemedText style={styles.modalCancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleFinalizarSupervision}
              >
                <ThemedText style={styles.modalConfirmText}>Sí, finalizar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal de confirmación */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>¿Finalizar jornada?</ThemedText>

            {visitaActiva.activa && (
              <View style={styles.modalWarning}>
                <ThemedText style={styles.modalWarningText}>
                  ⚠️ Tenés un ingreso activo en{' '}
                  <ThemedText style={styles.modalWarningBold}>
                    {visitaActiva.visita?.objetivo_nombre ?? 'un objetivo'}
                  </ThemedText>
                  . Se registrará el egreso automáticamente.
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.modalSubtitle}>
              Esta acción no se puede deshacer.
            </ThemedText>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <ThemedText style={styles.modalCancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleFinalizarJornada}
              >
                <ThemedText style={styles.modalConfirmText}>Sí, finalizar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de historial de la jornada actual */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalHistoryContainer}>
          <View style={styles.modalHistoryHeader}>
            <View>
              <ThemedText style={styles.modalHistoryTitle}>Registros de la jornada</ThemedText>
              <ThemedText style={styles.modalHistorySubtitle}>Supervisiones de esta jornada</ThemedText>
            </View>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.closeHistoryButton}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {visitasAnteriores.length > 0 ? (
              visitasAnteriores.map((visita, index) => (
                <View key={visita.id} style={styles.visitaHistoryCard}>
                  <View style={styles.timelineColumn}>
                    <View style={styles.timelineDot} />
                    {index < visitasAnteriores.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.visitaHistoryContent}>
                    <ThemedText style={styles.objectiveTitle} numberOfLines={1}>
                      {visita.objetivo_nombre}
                    </ThemedText>
                    <ThemedText style={styles.visitaDuracion} numberOfLines={1}>
                      {visita.objetivo_direccion}
                    </ThemedText>
                    <View style={styles.visitaHorarios}>
                      <ThemedText style={styles.visitaHoraText}>
                        {formatHora(visita.entrada)} — {visita.salida ? formatHora(visita.salida) : 'En curso'}
                      </ThemedText>
                      <ThemedText style={styles.visitaDuracion}>
                        {calcDuracionVisita(visita.entrada, visita.salida)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyHistoryContainer}>

                <EmptyActivitiesIcon />

                <ThemedText style={styles.emptyHistoryText}>
                  No hay supervisiones registradas.
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <View style={styles.mapSection}>
        {location ? (
          <WebView
            ref={webViewRef}
            style={{ flex: 1 }}
            scrollEnabled={false}
            javaScriptEnabled={true}
            source={{
              html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body, #map { width: 100%; height: 100%; }
              @keyframes pulse {
                0% { transform: scale(0.8); opacity: 0.8; }
                70% { transform: scale(1.8); opacity: 0; }
                100% { transform: scale(0.8); opacity: 0; }
              }
            </style>
          </head>
          <body>
            <div id="map"></div>
            <script>
              var map = L.map('map', { zoomControl: false, attributionControl: false })
                .setView([${location.coords.latitude}, ${location.coords.longitude}], 16);

              L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                { subdomains: 'abcd', maxZoom: 19 }
              ).addTo(map);

              var icon = L.divIcon({
                className: '',
                html: '<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:40px;height:40px;background:rgba(77,146,228,0.25);border-radius:50%;animation:pulse 2s infinite;"></div><div style="width:16px;height:16px;background:#4D92E4;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:1;"></div></div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
              });

              window.liveMap = map;
              window.liveMarker = L.marker([${location.coords.latitude}, ${location.coords.longitude}], { icon }).addTo(map);
              window.liveCircle = L.circle([${location.coords.latitude}, ${location.coords.longitude}], {
                radius: ${location.coords.accuracy ?? 50},
                color: '#4D92E4',
                fillColor: '#4D92E4',
                fillOpacity: 0.08,
                weight: 1
              }).addTo(map);
            </script>
          </body>
          </html>
        `,
            }}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <View style={styles.gridOverlay} />
            <View style={styles.pulseContainer}>
              <View style={styles.pulseOuter} />
              <View style={styles.pulseInner} />
            </View>
            <View style={styles.mapBadge}>
              <ThemedText style={styles.mapBadgeText}>{locationBadgeText}</ThemedText>
            </View>
          </View>
        )}

        {/* Botón flotante para abrir el historial de la jornada actual */}
        <TouchableOpacity
          style={styles.historyMapButton}
          onPress={() => {
            if (jornadaData?.id) refreshJornadaDetails(jornadaData.id);
            setShowHistoryModal(true);
          }}
          activeOpacity={0.8}
        >
          <HistoryActionIcon color={APP_STORE_BLUE} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.infoSection, { height: panelHeight }]}>
        <TouchableOpacity
          onPress={() => {
            const toValue = panelCollapsed.current ? 0 : 1;
            Animated.spring(panelAnim, {
              toValue,
              useNativeDriver: false,
              tension: 40,
              friction: 8,
            }).start();
            panelCollapsed.current = !panelCollapsed.current;
          }}
          activeOpacity={1}
          hitSlop={{ top: 15, bottom: 15, left: 80, right: 80 }}
        >
          <View style={styles.handle} {...panResponder.panHandlers} />
        </TouchableOpacity>

        <View style={styles.statusHeader}>
          <View>
            <ThemedText style={styles.statusValue}>Jornada en curso</ThemedText>
          </View>
          {visitaActiva.activa && (
            <View style={styles.timeBadge}>
              <ThemedText style={styles.timeText}>Supervisando</ThemedText>
            </View>
          )}
        </View>

        {visitaActiva.activa && (
          <View style={styles.objectiveCard}>
            <MapPinIcon />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.objectiveTitle}>
                {visitaActiva.visita?.objetivo_nombre}
              </ThemedText>
              <ThemedText style={styles.objectiveSubtitle}>
                Supervisaste por ( {duracionSupervision || '0h 00m 00s'} ) este objetivo.
              </ThemedText>
            </View>
          </View>
        )}

        <ThemedText style={{ color: '#687076', fontSize: 15, lineHeight: 22, marginBottom: 24 }}>
          {visitaActiva.activa ? (
            'Para finalizar la supervisión actual, presiona el botón rojo de abajo.'
          ) : (
            'Escaneá el código QR del objetivo para iniciar el registro de supervisión.'
          )}
        </ThemedText>

        <View style={styles.actionsContainer}>
          {visitaActiva.activa ? (
            canFinalizeSupervision ? (
              <TouchableOpacity
                style={[styles.qrButton, styles.qrButtonFinalizando]}
                activeOpacity={0.8}
                onPress={() => setShowEndSupervisionModal(true)}
              >
                <ThemedText style={styles.qrButtonText}>Finalizar supervisión</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.waitCard}>
                <ClockWaitIcon />
                <ThemedText style={styles.waitCardText}>
                  Debe permanecer al menos 5 minutos.
                </ThemedText>
              </View>
            )
          ) : (
            <TouchableOpacity style={styles.qrButton} activeOpacity={0.8} onPress={handleOpenScanner}>
              <ThemedText style={styles.qrButtonText}>
                Iniciar supervisión por QR
              </ThemedText>
            </TouchableOpacity>
          )}

          {!visitaActiva.activa && (
            <TouchableOpacity
              style={styles.endButton}
              onPress={() => setShowConfirmModal(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.endButtonText}>Finalizar mi jornada laboral</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIllustration: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 10,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#687076',
    fontSize: 16,
    lineHeight: 22,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 24,
    marginVertical: 32,
    borderWidth: 1,
    borderColor: '#ccd0d4',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#ccd0d4c9',
  },
  summarySeparator: {
    height: 1,
    backgroundColor: '#ccd0d4c9',
    marginVertical: 20,
  },
  mapSection: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: APP_STORE_BLUE,
  },
  mapBadge: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mapBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_STORE_BLUE,
  },
  pulseOuter: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_STORE_BLUE,
    opacity: 0.2,
  },
  pulseInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: APP_STORE_BLUE,
    borderWidth: 3,
    borderColor: 'white',
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    overflow: 'hidden', // ← importante para que el contenido no se desborde
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  timeBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  objectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#e7eaec',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    marginBottom: 30,
  },
  objectiveTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  objectiveSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionsContainer: {
    gap: 12,
  },
  qrButton: {
    backgroundColor: APP_STORE_BLUE,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  endButton: {
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2cbe',
  },
  endButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: '#474747',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 100,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scannerInstructionTextPrimary: {
    position: 'absolute',
    top: 670,
    width: '80%',
    alignSelf: 'center',
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  scannerInstructionTextSecondary: {
    position: 'absolute',
    top: 660,
    width: '80%',
    alignSelf: 'center',
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  qrButtonFinalizando: {
    backgroundColor: '#FF6B6B',
  },
  waitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    height: 56,
    borderRadius: 10,
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#e7eaec',
  },
  waitCardText: {
    flex: 1,
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '400',
  },
  // Estilos para el Historial en Mapa
  historyMapButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  modalHistoryContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalHistoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalHistorySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeHistoryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitaHistoryCard: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  visitaHistoryContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_STORE_BLUE,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  visitaHorarios: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  visitaHoraText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  visitaDuracion: {
    fontSize: 13,
    color: APP_STORE_BLUE,
    fontWeight: '600',
  },
  emptyHistoryContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 12,
  },
  modalWarningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  modalWarningBold: {
    fontWeight: '700',
    color: '#856404',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Estilos para el loader
  loaderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loaderText: {
    fontSize: 16,
    color: '#3C3C43',
  },
});