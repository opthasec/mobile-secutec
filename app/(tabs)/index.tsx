import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import supervisorService from '@/services/supervisores/supervisorService';
import jornadaService from '@/services/jornadas/jornadaService';
import reunionService, { Reunion } from '@/services/reuniones/reunionService';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';

const APP_STORE_BLUE = '#4D92E4';
const MEETING_ORANGE = '#FF9500';

const EmptyActivitiesIcon = () => (
  <Svg width="64" height="64" viewBox="0 0 16 16" fill="none">
    <Path
      fill="#D1D1D6"
      d="M1.5 2.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0M3 2h13v1.5H3zM3 5.5h13V7H3zM3 9h13v1.5H3zM3 12.5h13V14H3zM.75 7a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M1.5 13.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0M.75 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"
    />
  </Svg>
);

const formatHora = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};

const formatHoraReunion = (hora: string) => {
  // hora viene como "HH:MM:SS", mostramos "HH:MM"
  return hora.slice(0, 5);
};

const formatDuracion = (segundos: number | null) => {
  if (segundos == null) return '—';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jornadaFechas, setJornadaFechas] = useState<Set<string>>(new Set());
  const [jornadasMap, setJornadasMap] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ reuniones reales
  const [reunionesMap, setReunionesMap] = useState<Record<string, Reunion[]>>({});

  const [userData, setUserData] = useState<any>(null);
  const [historialMes, setHistorialMes] = useState<{ horas: number; jornadas: number }>({ horas: 0, jornadas: 0 });

  // Carga de reuniones cuando cambia el mes
  const fetchReuniones = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const mes = `${year}-${month}`;
    try {
      const data = await reunionService.getByMonth(mes);
      const map: Record<string, Reunion[]> = {};
      data.forEach(r => {
        if (!map[r.fecha]) map[r.fecha] = [];
        map[r.fecha].push(r);
      });
      setReunionesMap(map);
    } catch (err) {
      console.error('Error cargando reuniones:', err);
    }
  }, [currentDate]);

  useEffect(() => { fetchReuniones(); }, [fetchReuniones]);

  useEffect(() => {
    supervisorService.getMe().then(setUserData).catch(console.error);
  }, []);

  useEffect(() => {
    jornadaService.getHistorial()
      .then((data: any[]) => {
        const ahora = new Date();
        const jornadasMes = data.filter((j: any) => {
          if (!j.fin) return false;
          const inicio = new Date(j.inicio);
          return inicio.getMonth() === ahora.getMonth() && inicio.getFullYear() === ahora.getFullYear();
        });
        const totalSegundos = jornadasMes.reduce((acc: number, j: any) => acc + (j.duracion_segundos ?? 0), 0);
        setHistorialMes({ horas: Math.round(totalSegundos / 3600), jornadas: jornadasMes.length });

        const map: Record<string, any> = {};
        data.filter((j: any) => j.fin).forEach((j: any) => {
          try {
            const date = new Date(j.inicio).toISOString().split('T')[0];
            map[date] = j;
          } catch { }
        });
        setJornadasMap(map);
        setJornadaFechas(new Set(Object.keys(map)));
      })
      .catch(() => { });
  }, []);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentDate);
    const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days, monthName, year, month };
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(calendarData.year, calendarData.month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(calendarData.year, calendarData.month + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === calendarData.month && today.getFullYear() === calendarData.year;
  };

  const hasWorkday = (day: number) => {
    const dateString = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return jornadaFechas.has(dateString);
  };

  // ✅ usa reunionesMap real
  const hasMeeting = (day: number) => {
    const dateString = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return !!reunionesMap[dateString]?.length;
  };

  const handleDayPress = (day: number) => {
    const dateString = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
    setModalVisible(true);
  };

  // ✅ actividades del día seleccionado con reuniones reales
  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return [];
    const activities: any[] = [];

    const workday = jornadasMap[selectedDate];
    if (workday) {
      activities.push({
        id: 'workday',
        type: 'workday',
        title: 'Jornada laboral',
        time: `${formatHora(workday.inicio)} - ${formatHora(workday.fin)}`,
        duration: formatDuracion(workday.duracion_segundos),
        icon: 'briefcase' as const,
        color: APP_STORE_BLUE,
      });
    }

    const dayMeetings = reunionesMap[selectedDate] || [];
    dayMeetings.forEach(r => {
      activities.push({
        id: `meeting-${r.id}`,
        type: 'meeting',
        title: r.asunto,
        time: formatHoraReunion(r.hora),
        description: r.descripcion,
        icon: 'people' as const,
        color: MEETING_ORANGE,
      });
    });

    return activities;
  }, [selectedDate, jornadasMap, reunionesMap]);

  // ✅ actividades de hoy con reuniones reales
  const todayDateString = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todayActivities = useMemo(() => {
    return (reunionesMap[todayDateString] || []).map(r => ({
      id: `today-meeting-${r.id}`,
      type: 'meeting',
      title: r.asunto,
      time: formatHoraReunion(r.hora),
      description: r.descripcion,
      icon: 'people' as const,
      color: MEETING_ORANGE,
    }));
  }, [todayDateString, reunionesMap]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ThemedText style={styles.greeting}>Hola, {userData?.first_name}</ThemedText>
      </View>

      <View style={styles.section}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color={APP_STORE_BLUE} />
            </TouchableOpacity>
            <ThemedText style={styles.monthTitle}>
              {calendarData.monthName} {calendarData.year}
            </ThemedText>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color={APP_STORE_BLUE} />
            </TouchableOpacity>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: APP_STORE_BLUE }]} />
              <ThemedText style={styles.legendText}>Jornada</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: MEETING_ORANGE }]} />
              <ThemedText style={styles.legendText}>Reunión</ThemedText>
            </View>
          </View>

          <View style={styles.weekDaysContainer}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
              <ThemedText key={i} style={styles.weekDayText}>{d}</ThemedText>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarData.days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day && (
                  <TouchableOpacity
                    style={[styles.dayButton, isToday(day) && styles.todayButton]}
                    activeOpacity={0.6}
                    onPress={() => handleDayPress(day)}
                  >
                    <ThemedText style={[styles.dayText, isToday(day) && styles.todayText]}>
                      {day}
                    </ThemedText>
                    <View style={styles.dotsContainer}>
                      {hasWorkday(day) && <View style={[styles.dot, { backgroundColor: APP_STORE_BLUE }]} />}
                      {hasMeeting(day) && <View style={[styles.dot, { backgroundColor: MEETING_ORANGE }]} />}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Actividades de hoy */}
      <View style={[styles.section, { marginTop: 24 }]}>
        <ThemedText style={styles.sectionTitle}>Actividades de hoy</ThemedText>
        {todayActivities.length === 0 ? (
          <View style={styles.emptyActivityCard}>
            <ThemedText style={styles.emptyActivityText}>No hay actividades programadas para hoy</ThemedText>
          </View>
        ) : (
          <View style={styles.activitiesCard}>
            {todayActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                    <Ionicons name={activity.icon} size={20} color={activity.color} />
                  </View>
                  <View style={styles.activityInfo}>
                    <View style={styles.activityTitleRow}>
                      <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                      {activity.time && <ThemedText style={styles.activityTime}>{activity.time}</ThemedText>}
                    </View>
                    {activity.description && (
                      <ThemedText style={styles.activityDetail}>{activity.description}</ThemedText>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C6C6C8" />
                </View>
                {index < todayActivities.length - 1 && <View style={styles.itemSeparator} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>HORAS ESTE MES</ThemedText>
          <ThemedText style={styles.statValue}>{historialMes.horas}h</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>JORNADAS</ThemedText>
          <ThemedText style={styles.statValue}>{historialMes.jornadas}</ThemedText>
        </View>
      </View>

      {/* Modal actividades del día */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Actividades</ThemedText>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {selectedDateActivities.length > 0 ? (
            <View style={styles.activitiesCard}>
              {selectedDateActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                      <Ionicons name={activity.icon} size={20} color={activity.color} />
                    </View>
                    <View style={styles.activityInfo}>
                      <View style={styles.activityTitleRow}>
                        <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                        {activity.time && <ThemedText style={styles.activityTime}>{activity.time}</ThemedText>}
                      </View>
                      {activity.type === 'workday' && activity.duration && (
                        <ThemedText style={styles.activityDetail}>Duración: {activity.duration}</ThemedText>
                      )}
                      {activity.type === 'meeting' && activity.description && (
                        <ThemedText style={styles.activityDetail}>{activity.description}</ThemedText>
                      )}
                    </View>
                  </View>
                  {index < selectedDateActivities.length - 1 && <View style={styles.itemSeparator} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyModalContainer}>
              <EmptyActivitiesIcon />
              <ThemedText style={styles.emptyModalText}>No hay actividades registradas</ThemedText>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  greeting: { fontSize: 15, color: '#8E8E93', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { paddingHorizontal: 16, marginTop: 10 },
  calendarCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10, gap: 20 },
  monthTitle: { fontSize: 18, minWidth: 200, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  navButton: { padding: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#8E8E93' },
  sectionTitle: { fontSize: 13, color: '#8E8E93', marginBottom: 8, marginLeft: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  activitiesCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  activityInfo: { flex: 1 },
  activityTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  activityTime: { fontSize: 12, color: APP_STORE_BLUE, fontWeight: '600' },
  activityDetail: { fontSize: 13, color: '#687076', marginTop: 6, lineHeight: 18 },
  itemSeparator: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
  emptyActivityCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center',
    justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#C6C6C8',
  },
  emptyActivityText: { color: '#8E8E93', fontSize: 14, textAlign: 'center' },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 },
  weekDayText: { width: '14.28%', textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#C6C6C8' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: '14.28%', height: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  dayButton: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  todayButton: { backgroundColor: '#f1f1f1', borderWidth: 1.5, borderColor: '#e2e2e2' },
  dayText: { fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  todayText: { color: APP_STORE_BLUE, fontWeight: '700' },
  dotsContainer: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 20, marginBottom: 40 },
  statCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  statLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1C1C1E' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 20, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  modalTitle: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  emptyModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 100 },
  emptyModalText: { fontSize: 16, color: '#8E8E93', textAlign: 'center', width: '70%' },
});