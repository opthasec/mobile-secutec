import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import objetivoService from '@/services/objetivos/objetivoService';
import { BACKGROUND_LOCATION_TASK, BackgroundLocationStorageKeys } from './backgroundLocationTask';

import notificationService from '@/services/notificaciones/notificationService';

class LocationTrackingService {
    async start() {
        const fgPerm = await Location.requestForegroundPermissionsAsync();
        if (fgPerm.status !== 'granted') return false;

        const bgPerm = await Location.requestBackgroundPermissionsAsync();
        if (bgPerm.status !== 'granted') {
            // Sin permiso de background, seguimos pero solo va a andar con la app abierta/minimizada reciente, no garantizado en background real
            console.warn('Permiso de ubicación en background no concedido.');
        }

        await notificationService.requestPermissions();
        await this.refreshPendientes();

        const yaRegistrado = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (yaRegistrado) return true;

        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5 * 60 * 1000, // chequeo cada 5 min (también para el timer de salida)
            distanceInterval: 50, // o cuando se mueva 50m
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Secutec',
                notificationBody: 'Monitoreando tu jornada laboral en curso.',
            },
        });

        return true;
    }

    async stop() {
        const yaRegistrado = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (yaRegistrado) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }
        await AsyncStorage.multiRemove([
            BackgroundLocationStorageKeys.KEY_PENDIENTES,
            BackgroundLocationStorageKeys.KEY_AVISADOS_CERCANIA,
            BackgroundLocationStorageKeys.KEY_VISITA_ACTIVA,
            BackgroundLocationStorageKeys.KEY_ULTIMO_RECORDATORIO_SALIDA,
        ]);
    }

    async refreshPendientes() {
        try {
            const pendientes = await objetivoService.getPendientesHoy();
            await AsyncStorage.setItem(BackgroundLocationStorageKeys.KEY_PENDIENTES, JSON.stringify(pendientes));
        } catch (e) {
            console.warn('No se pudieron refrescar los objetivos pendientes:', e);
        }
    }

    async setVisitaActiva(visita: { id: number; entrada: string; objetivo_nombre: string } | null) {
        if (visita) {
            await AsyncStorage.setItem(BackgroundLocationStorageKeys.KEY_VISITA_ACTIVA, JSON.stringify(visita));
            await AsyncStorage.removeItem(BackgroundLocationStorageKeys.KEY_ULTIMO_RECORDATORIO_SALIDA);
        } else {
            await AsyncStorage.removeItem(BackgroundLocationStorageKeys.KEY_VISITA_ACTIVA);
            await AsyncStorage.removeItem(BackgroundLocationStorageKeys.KEY_ULTIMO_RECORDATORIO_SALIDA);
        }
    }
}

export default new LocationTrackingService();