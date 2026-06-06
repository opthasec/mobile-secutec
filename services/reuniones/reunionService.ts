import authService from '@/services/authentication/authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface Reunion {
  id: number;
  asunto: string;
  fecha: string;        // YYYY-MM-DD
  hora: string;         // HH:MM:SS
  descripcion?: string;
  todos_los_supervisores: boolean;
  supervisores: number[];
  creada_en: string;
}

class ReunionService {

  // GET /api/reuniones/?mes=YYYY-MM
  async getByMonth(mes: string): Promise<Reunion[]> {
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/reuniones/?mes=${mes}`
    );
    if (!response.ok) throw new Error('Error al obtener reuniones');
    return response.json();
  }
}

const reunionService = new ReunionService();
export default reunionService;