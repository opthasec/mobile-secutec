import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    async requestPermissions(): Promise<boolean> {
        const { status } = await Notifications.requestPermissionsAsync();
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Secutec',
                importance: Notifications.AndroidImportance.HIGH,
            });
        }
        return status === 'granted';
    }

    async send(title: string, body: string, data: Record<string, any> = {}) {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data },
            trigger: null, // inmediata
        });
    }
}

export default new NotificationService();