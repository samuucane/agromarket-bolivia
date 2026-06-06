export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type Department =
  | 'Santa Cruz' | 'La Paz' | 'Cochabamba' | 'Oruro'
  | 'Potosí' | 'Chuquisaca' | 'Tarija' | 'Beni' | 'Pando';

export type Language = 'es' | 'ay' | 'qu';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}
