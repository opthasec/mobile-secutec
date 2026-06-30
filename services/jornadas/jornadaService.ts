import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class JornadaService {

  async getActiva() {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/activa/`
    );
    if (!response.ok) throw new Error('Error al consultar jornada activa');
    try {
      return await response.json();
    } catch (e) {
      // Si la respuesta no es un JSON válido pero fue exitosa (ej. 204 No Content)
      return { activa: false };
    }
  }

  async iniciar(lat: number, lng: number) {
    const body = {
      lat_inicio: parseFloat(lat.toFixed(6)),
      lng_inicio: parseFloat(lng.toFixed(6)),
    };
    try {
      const response = await authService.authenticatedRequest(
        `${API_BASE_URL}/api/jornadas/iniciar/`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({ detail: 'Error al iniciar jornada' }));
        throw new Error(data.detail || 'Error al iniciar jornada');
      }
      return await response.json();
    } catch (error: any) {
      // Si el fetch falló a nivel red (timeout, conexión cortada, etc.), el POST
      // puede haber llegado igual al backend y haber creado la jornada, pero la
      // respuesta nunca volvió al cliente. Antes de reportar el error, verificamos
      // contra el backend si la jornada quedó iniciada de todas formas.
      if (error instanceof TypeError && error.message === 'Network request failed') {
        try {
          const activa = await this.getActiva();
          if (activa?.activa) {
            return activa; // El backend sí la creó; devolvemos como si hubiese funcionado.
          }
        } catch {
          // Si el recheck también falla (sin conexión real), seguimos al error de abajo.
        }
        throw new Error('Error de red. No se pudo iniciar la jornada.');
      }
      throw error; // Re-lanzamos otros errores
    }
  }

  async finalizar(lat: number, lng: number) {
    try {
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
        const data = await response.json().catch(() => ({ detail: 'Error al finalizar jornada' }));
        throw new Error(data.detail || 'Error al finalizar jornada');
      }
      return await response.json();
    } catch (error: any) {
      if (error instanceof TypeError && error.message === 'Network request failed') {
        throw new Error('Error de red. No se pudo finalizar la jornada.');
      }
      throw error;
    }
  }

  async getHistorial() {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/historial/`
    );
    if (!response.ok) {
      // Si la respuesta no es OK, intentamos parsear el error.
      // Si falla, lanzamos un error genérico.
      const error = await response.json().catch(() => ({ detail: 'Error al obtener historial' }));
      throw new Error(error.detail || 'Error al obtener historial');
    }
    return await response.json();
  }

  async getDetalle(jornadaId: number) {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/jornadas/${jornadaId}/detalle/`
    );
    if (!response.ok) {
      // Si la respuesta no es OK, intentamos parsear el error.
      // Si falla, lanzamos un error genérico.
      const error = await response.json().catch(() => ({ detail: 'Error al obtener detalle de jornada' }));
      throw new Error(error.detail || 'Error al obtener detalle de jornada');
    }
    return await response.json();
  }
}

const jornadaService = new JornadaService();
export default jornadaService;