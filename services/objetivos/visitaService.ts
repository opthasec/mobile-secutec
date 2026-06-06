import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class VisitaService {
    async registrar(qrToken: string, lat: number, lng: number) {
        const response = await authService.authenticatedRequest(
            `${API_BASE_URL}/api/visitas/registrar/`,
            {
                method: 'POST',
                body: JSON.stringify({
                    qr_token: qrToken,
                    lat_supervisor: parseFloat(lat.toFixed(6)),
                    lng_supervisor: parseFloat(lng.toFixed(6)),
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // Lanzamos el detail del backend para mostrarlo directo al usuario
            throw new Error(data.detail || 'Error al registrar visita');
        }

        return data; // { detail, visita_id }
    }

    async getActiva() {
        const response = await authService.authenticatedRequest(
            `${API_BASE_URL}/api/visitas/activa/`
        );
        if (!response.ok) throw new Error('Error al consultar visita activa');
        return await response.json();
    }
}

const visitaService = new VisitaService();
export default visitaService;