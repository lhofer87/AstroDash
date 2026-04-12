export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  bortleClass: number;
  radiance: number;
  isFavorite: boolean;
  notes: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type SpotInput = Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>;
