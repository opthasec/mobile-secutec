import authService from '@/services/authentication/authService';

/**
 * Realiza una solicitud autenticada. Esta función envolvía una lógica de reintentos que ha sido eliminada.
 * Ahora es un alias directo para `authService.authenticatedRequest`.
 * @param endpoint La URL del endpoint.
 * @param options Opciones de la solicitud (método, cuerpo, etc.).
 * @returns Una promesa que se resuelve con la respuesta.
 */
export const authenticatedRequestWithRetry = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  // La lógica de reintentos ha sido eliminada según el requerimiento.
  return authService.authenticatedRequest(endpoint, options);
};