import authService from "../authentication/authService";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }
  return response.json();
}


export interface KPISupervisor {
  supervisor_id: number;
  supervisor: string;
  email: string;
  total: number;
  reales: number;
  sin_cerrar: number;
  tiempo_total_segundos: number;
  tiempo_promedio_segundos: number;
}

export interface KPIObjetivo {
  objetivo_id: number;
  objetivo: string;
  direccion: string;
  total_visitas: number;
  visitas_cerradas: number;
  visitas_abiertas: number;
  tiempo_total_segundos: number;
  tiempo_promedio_segundos: number;
  top_supervisores: { supervisor_id: number; visitas: number; supervisor: string }[];
}

export interface KPIDia {
  cantidad_visitas: number;
  minutos_visitas: number;
  supervisor_nombre: any;
  dia: number;
  visitas_reales: number;
  visitas_abiertas: number;
  horas: number;
}

export interface KPISupervisorMensual {
  supervisor_id: number;
  supervisor_nombre: string;
  minutos_visitas: number;
  cantidad_visitas: number;
}

export interface KPIAnualDia {
  fecha: string; // "YYYY-MM-DD"
  minutos: number;
}



export function segundosAHorasMin(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function segundosAHorasDecimal(seg: number): number {
  return seg / 3600;
}


class KpiService {

  async getSupervisores(month?: number, year?: number): Promise<KPISupervisor[]> {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));

    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/kpis/supervisores/?${params}`
    );
    return handleResponse<KPISupervisor[]>(response);
  }

  async getObjetivos(month?: number, year?: number): Promise<KPIObjetivo[]> {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));

    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/kpis/objetivos/?${params}`
    );
    return handleResponse<KPIObjetivo[]>(response);
  }

  async getMensual(
    month: number,
    year: number,
    supervisorId?: number | null
  ): Promise<KPIDia[]> {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    if (supervisorId != null) params.set("supervisor_id", String(supervisorId));

    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/kpis/mensual/?${params}`
    );
    return handleResponse<KPIDia[]>(response);
  }

  async getSupervisoresMensual(
    month: number,
    year: number
  ): Promise<KPISupervisorMensual[]> {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/kpis/supervisores/?${params}`
    );
    return handleResponse<KPISupervisorMensual[]>(response);
  }

  async getAnual(year: number, supervisorId?: number | null): Promise<KPIAnualDia[]> {
    const params = new URLSearchParams({ year: String(year) });
    if (supervisorId != null) params.set("supervisor_id", String(supervisorId));

    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/kpis/anual/?${params}`
    );
    return handleResponse<KPIAnualDia[]>(response);
  }

  async getMiRendimientoSemanal(
    date: Date
  ): Promise<KPIDia[]> {
    const user = await authService.getUser();
    if (!user.id) {
      throw new Error("Usuario no autenticado");
    }

    const params = new URLSearchParams({
      supervisor_id: String(user.id),
      date: date.toISOString().split('T')[0],
    });

    const response = await authService.authenticatedRequest(
      `${API_BASE_URL}/api/kpis/semanal/?${params}`
    );
    return handleResponse<KPIDia[]>(response);
  }
}

const kpiService = new KpiService();
export default kpiService;