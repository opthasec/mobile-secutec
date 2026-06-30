import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

import notificationService from '@/services/notificaciones/notificationService';

export const BACKGROUND_LOCATION_TASK = 'secutec-background-location';

const KEY_PENDIENTES = 'bg:pendientes_hoy';
const KEY_AVISADOS_CERCANIA = 'bg:avisados_cercania';
const KEY_VISITA_ACTIVA = 'bg:visita_activa'; // { id, entrada (ISO), objetivo_nombre }
const KEY_ULTIMO_RECORDATORIO_SALIDA = 'bg:ultimo_recordatorio_salida'; // ISO de la última vez que avisamos

const RADIO_ALERTA_METROS = 300;
const HORAS_RECORDATORIO_SALIDA = 0.05; // ~3 minutos
const COOLDOWN_RECORDATORIO_SALIDA_MIN = 1; // no repetir el aviso antes de 1 min

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error('[BackgroundLocationTask] error:', error);
        return;
    }
    const { locations } = data;
    const location = locations?.[0];
    if (!location) return;

    const { latitude, longitude } = location.coords;

    try {
        // --- 1. Alertas de cercanía a objetivos pendientes ---
        const pendientesRaw = await AsyncStorage.getItem(KEY_PENDIENTES);
        const pendientes: Array<{ id: number; nombre: string; latitud: number; longitud: number; radio_metros: number }> =
            pendientesRaw ? JSON.parse(pendientesRaw) : [];

        const avisadosRaw = await AsyncStorage.getItem(KEY_AVISADOS_CERCANIA);
        const avisados: Record<number, boolean> = avisadosRaw ? JSON.parse(avisadosRaw) : {};

        for (const obj of pendientes) {
            const distancia = haversine(latitude, longitude, obj.latitud, obj.longitud);
            const umbral = Math.max(obj.radio_metros + RADIO_ALERTA_METROS, RADIO_ALERTA_METROS);

            if (distancia <= umbral && !avisados[obj.id]) {
                await notificationService.send(
                    'Estás cerca de tu destino',
                    `Te encontrás a ${Math.round(distancia)}m de "${obj.nombre}".`,
                    { tipo: 'cercania', objetivoId: obj.id }
                );
                avisados[obj.id] = true;
            } else if (distancia > umbral + 100 && avisados[obj.id]) {
                // se alejó lo suficiente, reseteamos para poder volver a avisar si vuelve
                delete avisados[obj.id];
            }
        }
        await AsyncStorage.setItem(KEY_AVISADOS_CERCANIA, JSON.stringify(avisados));

        // --- 2. Recordatorio de registrar salida ---
        const visitaRaw = await AsyncStorage.getItem(KEY_VISITA_ACTIVA);
        if (visitaRaw) {
            const visita = JSON.parse(visitaRaw);
            const entradaMs = new Date(visita.entrada).getTime();
            const horasTranscurridas = (Date.now() - entradaMs) / (1000 * 60 * 60);

            if (horasTranscurridas >= HORAS_RECORDATORIO_SALIDA) {
                const ultimoAvisoRaw = await AsyncStorage.getItem(KEY_ULTIMO_RECORDATORIO_SALIDA);
                const minutosDesdeUltimoAviso = ultimoAvisoRaw
                    ? (Date.now() - new Date(ultimoAvisoRaw).getTime()) / (1000 * 60)
                    : Infinity;

                if (minutosDesdeUltimoAviso >= COOLDOWN_RECORDATORIO_SALIDA_MIN) {
                    await notificationService.send(
                        'Recordá registrar tu salida',
                        `Llevás más de ${HORAS_RECORDATORIO_SALIDA}hs en "${visita.objetivo_nombre}" sin registrar el egreso.`,
                        { tipo: 'recordatorio_salida', visitaId: visita.id }
                    );
                    await AsyncStorage.setItem(KEY_ULTIMO_RECORDATORIO_SALIDA, new Date().toISOString());
                }
            }
        }
    } catch (e) {
        console.error('[BackgroundLocationTask] error procesando:', e);
    }
});

export const BackgroundLocationStorageKeys = {
    KEY_PENDIENTES,
    KEY_AVISADOS_CERCANIA,
    KEY_VISITA_ACTIVA,
    KEY_ULTIMO_RECORDATORIO_SALIDA,
};