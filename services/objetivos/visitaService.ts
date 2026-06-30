import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class VisitaService {
    async registrar(qrToken: string, lat: number, lng: number) {
        try {
            const endpoint = `${API_BASE_URL}/api/visitas/registrar/`;
            const response = await authService.authenticatedRequest(
                endpoint,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        qr_token: qrToken,
                        lat_supervisor: parseFloat(lat.toFixed(6)),
                        lng_supervisor: parseFloat(lng.toFixed(6)),
                    }),
                },
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({ detail: 'Error al registrar visita' }));
                throw new Error(data.detail || 'Error al registrar visita');
            }
            return await response.json();
        } catch (error: any) {
            if (error instanceof TypeError && error.message === 'Network request failed') {
                throw new Error('Error de red. No se pudo registrar la supervisión.');
            }
            throw error;
        }
    }

    async finalizar(visitaId: number, lat: number, lng: number) {
        try {
            const endpoint = `${API_BASE_URL}/api/visitas/finalizar/`;
            const response = await authService.authenticatedRequest(
                endpoint,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        visita_id: visitaId,
                        lat_supervisor: parseFloat(lat.toFixed(6)),
                        lng_supervisor: parseFloat(lng.toFixed(6)),
                    }),
                },
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({ detail: 'Error al finalizar visita' }));
                throw new Error(data.detail || 'Error al finalizar visita');
            }
            return await response.json();
        } catch (error: any) {
            throw error;
        }
    }

    async getActiva() {
        const response = await authService.authenticatedRequest(
            `${API_BASE_URL}/api/visitas/activa/`
        );
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Error al consultar visita activa' }));
            throw new Error(error.detail || 'Error al consultar visita activa');
        }
        return await response.json();
    }
}

const visitaService = new VisitaService();
export default visitaService;