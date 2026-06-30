import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ObjetivoPendiente {
    id: number;
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    radio_metros: number;
}

class ObjetivoService {
    async getPendientesHoy(): Promise<ObjetivoPendiente[]> {
        const response = await authService.authenticatedRequest(
            `${API_BASE_URL}/api/objetivos/pendientes-hoy/`
        );
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Error al consultar objetivos pendientes' }));
            throw new Error(error.detail || 'Error al consultar objetivos pendientes');
        }
        return await response.json();
    }
}

const objetivoService = new ObjetivoService();
export default objetivoService;