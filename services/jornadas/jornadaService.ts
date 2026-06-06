import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class JornadaService {

  async getActiva() {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/activa/`
    );
    if (!response.ok) throw new Error('Error al consultar jornada activa');
    return await response.json();
  }

  async iniciar(lat: number, lng: number) {
    const body = {
      lat_inicio: parseFloat(lat.toFixed(6)),
      lng_inicio: parseFloat(lng.toFixed(6)),
    };
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/iniciar/`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al iniciar jornada');
    }
    return await response.json();
  }

  async finalizar(lat: number, lng: number) {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/finalizar/`,
      {
        method: 'POST',
        body: JSON.stringify({
          lat_fin: parseFloat(lat.toFixed(6)),
          lng_fin: parseFloat(lng.toFixed(6)),
        }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al finalizar jornada');
    }
    return await response.json();
  }

  async getHistorial() {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/historial/`
    );
    if (!response.ok) throw new Error('Error al obtener historial');
    return await response.json();
  }

  async getDetalle(jornadaId: number) {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/${jornadaId}/detalle/`
    );
    if (!response.ok) throw new Error('Error al obtener detalle de jornada');
    return await response.json();
  }
}

const jornadaService = new JornadaService();
export default jornadaService;