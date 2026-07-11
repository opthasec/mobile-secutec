import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class VisitaService {
    private async intentarRegistro(qrToken: string, lat: number, lng: number) {
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
    }

    async registrar(qrToken: string, lat: number, lng: number) {
        const MAX_REINTENTOS = 2;
        const ESPERA_MS = 2000;

        for (let intento = 0; intento <= MAX_REINTENTOS; intento++) {
            try {
                return await this.intentarRegistro(qrToken, lat, lng);
            } catch (error: any) {
                const esFalloDeRed = error instanceof TypeError && error.message === 'Network request failed';

                if (!esFalloDeRed) {
                    throw error; // errores de negocio: no se reintentan
                }

                if (intento < MAX_REINTENTOS) {
                    await new Promise(resolve => setTimeout(resolve, ESPERA_MS));
                    continue;
                }

                // Se agotaron los reintentos: mismo chequeo que ya existía antes
                // de reportar el error final al usuario.
                try {
                    const activa = await this.getActiva();
                    if (activa?.id || activa?.activa) {
                        return activa;
                    }
                } catch {
                    // Si el recheck también falla, seguimos al error de abajo.
                }
                throw new Error('Error de red. No se pudo registrar la supervisión.');
            }
        }

        // Inalcanzable, pero TypeScript necesita un retorno/throw explícito acá.
        throw new Error('Error de red. No se pudo registrar la supervisión.');
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
            // Mismo caso que en registrar(): el POST puede haber llegado al
            // backend y haber finalizado la visita, pero la respuesta no volvió
            // a tiempo. Verificamos si ya no hay visita activa (o si la activa
            // ya no es la misma) antes de reportar el error al usuario.
            if (error instanceof TypeError && error.message === 'Network request failed') {
                try {
                    const activa = await this.getActiva();
                    const sigueActiva = activa?.id === visitaId || (activa?.activa && activa?.id === visitaId);
                    if (!sigueActiva) {
                        return { finalizada: true }; // El backend sí la finalizó.
                    }
                } catch {
                    // Si el recheck también falla, seguimos al error de abajo.
                }
                throw new Error('Error de red. No se pudo finalizar la supervisión.');
            }
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