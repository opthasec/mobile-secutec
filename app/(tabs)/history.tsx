import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, FlatList, Modal, ScrollView, RefreshControl,
  StyleSheet, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import jornadaService from '@/services/jornadas/jornadaService';

const HistoryDecorationIcon = () => (
  <Svg width="30" height="34" viewBox="0 0 30 34" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M25.689 10.1121H4.069C1.822 10.1121 0 11.9341 0 14.1821V29.7521C0 31.9991 1.822 33.8211 4.069 33.8211H25.689C27.937 33.8211 29.758 31.9991 29.758 29.7521V14.1821C29.758 11.9341 27.937 10.1121 25.689 10.1121Z" fill="#4D92E4" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M23.8335 2.385V2.153C23.8335 0.964 22.8685 0 21.6795 0H8.0785C6.8895 0 5.9255 0.964 5.9255 2.153V2.385H23.8335Z" fill="#FC2F55" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M26.979 7.67021C26.866 6.16421 25.622 4.97321 24.086 4.97321H5.672C4.137 4.97321 2.892 6.16421 2.779 7.67021H26.979Z" fill="#FECD00" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M14.8794 15.0462C11.0374 15.0462 7.9224 18.1612 7.9224 22.0032C7.9224 25.8452 11.0374 28.9602 14.8794 28.9602C18.7214 28.9602 21.8354 25.8452 21.8354 22.0032C21.8354 18.1612 18.7214 15.0462 14.8794 15.0462Z" fill="white" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M17.8599 19.2015C17.6529 19.0535 17.3979 18.9935 17.1479 19.0355C16.8969 19.0775 16.6759 19.2155 16.5289 19.4225L14.0349 22.9095L13.1779 21.9075C12.8369 21.5085 12.2329 21.4605 11.8329 21.8035C11.4329 22.1445 11.3859 22.7485 11.7279 23.1485L13.3769 25.0765C13.5569 25.2875 13.8199 25.4095 14.1379 25.4095H14.1419C14.4369 25.3965 14.7049 25.2525 14.8779 25.0115L18.0819 20.5325C18.2299 20.3255 18.2889 20.0725 18.2469 19.8215C18.2049 19.5695 18.0669 19.3495 17.8599 19.2015Z" fill="#4D92E4" />
  </Svg>
);

interface Jornada {
  id: number;
  inicio: string;
  fin: string | null;
  duracion_segundos: number | null;
  activa: boolean;
}

interface VisitaDetalle {
  id: number;
  objetivo_nombre: string;
  objetivo_direccion: string;
  entrada: string;
  salida: string | null;
}

const formatFecha = (iso: string) => {
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return 'Hoy';
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatHora = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const formatDuracion = (segundos: number | null) => {
  if (segundos == null) return '—';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${m}m`;
};

const calcDuracionVisita = (entrada: string, salida: string | null) => {
  if (!salida) return 'En curso';
  const seg = Math.floor((new Date(salida).getTime() - new Date(entrada).getTime()) / 1000);
  return formatDuracion(seg);
};

export default function TabTwoScreen() {
  const [historial, setHistorial] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<Jornada | null>(null);
  const [detalle, setDetalle] = useState<{ jornada: Jornada; visitas: VisitaDetalle[] } | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await jornadaService.getHistorial();
      setHistorial(data);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      jornadaService.getHistorial()
        .then(data => setHistorial(data))
        .catch(() => { })
        .finally(() => setLoading(false));
    }, [])
  );

  const handleVerDetalle = async (jornada: Jornada) => {
    setJornadaSeleccionada(jornada);
    setModalVisible(true);
    setLoadingDetalle(true);
    setDetalle(null);
    try {
      const data = await jornadaService.getDetalle(jornada.id);
      setDetalle(data);
    } catch {
      setDetalle(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setDetalle(null);
    setJornadaSeleccionada(null);
  };

  const renderItem = ({ item }: { item: Jornada }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => handleVerDetalle(item)}>
      <View style={styles.cellFecha}>
        <View style={styles.statusDot} />
        <ThemedText style={styles.dateText} numberOfLines={1}>
          {formatFecha(item.inicio)}
        </ThemedText>
      </View>
      <View style={styles.cellHorario}>
        <ThemedText style={styles.rangeText} numberOfLines={1}>
          {formatHora(item.inicio)} - {formatHora(item.fin)}
        </ThemedText>
      </View>
      <View style={{ width: 80, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4}}>
        <ThemedText style={styles.durationText}>
          {formatDuracion(item.duracion_segundos)}
        </ThemedText>
        <Ionicons name="chevron-forward" size={14} color="#C6C6C8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.titleRow}>
          <ThemedText type="title" style={styles.title}>Historial</ThemedText>
          <HistoryDecorationIcon />
        </View>
        <ThemedText style={styles.subtitle}>Resumen de tus jornadas pasadas</ThemedText>
      </View>

      {/* ── CAMBIO 1: sectionContainer ahora tiene flex: 1 ── */}
      <View style={styles.sectionContainer}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#4D92E4" />
        ) : (
          /* ── CAMBIO 2: FlatList reemplaza al View groupCard como raíz,
                         tableHeader pasa a ListHeaderComponent ── */
          <FlatList
            data={historial}
            style={styles.groupCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4D92E4" />
            }
            alwaysBounceVertical={true}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.tableHeader}>
                <ThemedText style={[styles.columnLabel, { flex: 1, paddingLeft: 14 }]}>FECHA</ThemedText>
                <ThemedText style={[styles.columnLabel, { flex: 1, paddingLeft: 20 }]}>HORARIO</ThemedText>
                <ThemedText style={[styles.columnLabel, { width: 80, textAlign: 'right', paddingRight: 18 }]}>TOTAL</ThemedText>
              </View>
            }
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>No hay jornadas registradas</ThemedText>
            }
          />
        )}
      </View>

      {/* ── Modal detalle — sin cambios ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCerrarModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>
                {jornadaSeleccionada ? formatFecha(jornadaSeleccionada.inicio) : ''}
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                {jornadaSeleccionada
                  ? `${formatHora(jornadaSeleccionada.inicio)} — ${formatHora(jornadaSeleccionada.fin)}`
                  : ''}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleCerrarModal} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {jornadaSeleccionada && (
            <View style={styles.modalSummaryRow}>
              <View style={styles.modalSummaryItem}>
                <ThemedText style={styles.modalSummaryLabel}>DURACIÓN</ThemedText>
                <ThemedText style={styles.modalSummaryValue}>
                  {formatDuracion(jornadaSeleccionada.duracion_segundos)}
                </ThemedText>
              </View>
              <View style={styles.modalSummaryDivider} />
              <View style={styles.modalSummaryItem}>
                <ThemedText style={styles.modalSummaryLabel}>ESCANEOS</ThemedText>
                <ThemedText style={styles.modalSummaryValue}>
                  {detalle ? detalle.visitas.length : '—'}
                </ThemedText>
              </View>
            </View>
          )}

          <ThemedText style={styles.modalSectionTitle}>SUPERVISIONES</ThemedText>

          {loadingDetalle ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#4D92E4" />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {detalle && detalle.visitas.length > 0 ? (
                detalle.visitas.map((visita, index) => (
                  <View key={visita.id} style={styles.visitaCard}>
                    <View style={styles.timelineColumn}>
                      <View style={styles.timelineDot} />
                      {index < detalle.visitas.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.visitaContent}>
                      <ThemedText style={styles.visitaObjetivo} numberOfLines={1}>
                        {visita.objetivo_nombre}
                      </ThemedText>
                      <ThemedText style={styles.visitaDireccion} numberOfLines={1}>
                        {visita.objetivo_direccion}
                      </ThemedText>
                      <View style={styles.visitaHorarios}>
                        <View style={styles.visitaHorarioItem}>
                          <View style={[styles.visitaBadge, styles.visitaBadgeEntrada]}>
                            <ThemedText style={styles.visitaBadgeText}>ENTRADA</ThemedText>
                          </View>
                          <ThemedText style={styles.visitaHoraText}>
                            {formatHora(visita.entrada)}
                          </ThemedText>
                        </View>
                        <View style={styles.visitaHorarioItem}>
                          <View style={[styles.visitaBadge, visita.salida ? styles.visitaBadgeSalida : styles.visitaBadgeEnCurso]}>
                            <ThemedText style={styles.visitaBadgeText}>
                              {visita.salida ? 'SALIDA' : 'EN CURSO'}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.visitaHoraText}>
                            {formatHora(visita.salida)}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.visitaDuracion}>
                          {calcDuracionVisita(visita.entrada, visita.salida)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>
                  No hubo supervisiones en esta jornada
                </ThemedText>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 34, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 15, color: '#8E8E93', marginTop: 5 },
  sectionContainer: { marginTop: 10, flex: 1, marginBottom: 21}, // ← flex: 1 agregado
  groupCard: {
    backgroundColor: 'white', borderRadius: 12, marginHorizontal: 16,
    overflow: 'hidden', shadowColor: '#00000067', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  columnLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#56b867' },
  rangeText: { fontSize: 14, color: '#8E8E93' },
  durationText: { fontSize: 15, fontWeight: '600', color: '#4D92E4' },
  separator: { height: 1, backgroundColor: '#F2F2F7' },
  emptyText: { textAlign: 'center', padding: 24, color: '#8E8E93' },
  // Celdas de la tabla
  cellFecha: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  cellHorario: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 8,
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1C1C1E' },
  modalSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center',
  },
  modalSummaryRow: {
    flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 16,
    padding: 20, marginBottom: 24,
  },
  modalSummaryItem: { flex: 1, alignItems: 'center' },
  modalSummaryLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 4 },
  modalSummaryValue: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  modalSummaryDivider: { width: 1, backgroundColor: '#E5E5EA' },
  modalSectionTitle: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 16 },

  // Timeline de visitas
  visitaCard: { flexDirection: 'row', marginBottom: 8 },
  timelineColumn: { width: 24, alignItems: 'center', paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4D92E4', zIndex: 1 },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#E5E5EA', marginTop: 4 },
  visitaContent: {
    flex: 1, marginLeft: 12, backgroundColor: '#F8F9FA',
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  visitaObjetivo: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  visitaDireccion: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  visitaHorarios: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  visitaHorarioItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  visitaBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  visitaBadgeEntrada: { backgroundColor: '#E8F5E9', borderColor: 'rgba(163, 201, 164, 0.47)' },
  visitaBadgeSalida: { backgroundColor: '#FFF3E0', borderColor: '#ebdabe' },
  visitaBadgeEnCurso: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
  visitaBadgeText: { fontSize: 10, fontWeight: '700', color: '#555' },
  visitaHoraText: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  visitaDuracion: { fontSize: 13, color: '#4D92E4', fontWeight: '600', marginLeft: 'auto' },
});