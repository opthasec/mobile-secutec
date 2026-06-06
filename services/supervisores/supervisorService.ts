import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class SupervisorService {
  async getMe() {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/supervisores/me/`
    );
    if (!response.ok) throw new Error('Error al obtener perfil');
    return await response.json();
  }
}

const supervisorService = new SupervisorService();
export default supervisorService;