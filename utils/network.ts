import authService from '@/services/authentication/authService';

/**
 * Realiza una solicitud autenticada. La lógica de reintentos ha sido eliminada.
 * @param endpoint La URL del endpoint.
 * @param options Opciones de la solicitud (método, cuerpo, etc.).
 * @returns Una promesa que se resuelve con la respuesta.
 * @throws Lanza un error si la solicitud falla.
 */
export const authenticatedRequestWithRetry = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  // La lógica de reintentos ha sido eliminada según el requerimiento.
  return authService.authenticatedRequest(endpoint, options);
};