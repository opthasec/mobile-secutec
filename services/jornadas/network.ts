import authService from '@/services/authentication/authService';

/**
 * Realiza una solicitud autenticada con reintentos automáticos en caso de fallos de red o errores del servidor (5xx).
 * @param endpoint La URL del endpoint.
 * @param options Opciones de la solicitud (método, cuerpo, etc.).
 * @param retries Número de reintentos.
 * @param delay Retardo inicial antes del primer reintento.
 * @returns Una promesa que se resuelve con la respuesta.
 * @throws Lanza un error si la solicitud falla después de todos los reintentos.
 */
export const authenticatedRequestWithRetry = async (
  endpoint: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await authService.authenticatedRequest(endpoint, options);
      // Los errores 4xx (cliente) no se reintentan. Los 5xx (servidor) sí.
      if (response.status < 500) {
        return response;
      }
      // Si es un error 5xx, se considera un fallo temporal y se reintenta.
    } catch (error: any) {
      // Si es un error de red (TypeError), se reintenta.
      if (i === retries - 1) throw error; // En el último intento, se lanza el error original.
    }
    await new Promise(res => setTimeout(res, delay * (i + 1)));
  }
  throw new Error('No se pudo conectar con el servidor después de varios intentos. Por favor, revisá tu conexión a internet.');
};