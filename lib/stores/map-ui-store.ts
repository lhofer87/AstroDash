import { create } from 'zustand';
import type { BaseStyle } from '@/app/components/map/LayerToggle';

const DEFAULT_LNG = 14.4378;
const DEFAULT_LAT = 50.0755;
const DEFAULT_ZOOM = 7;

export interface MapUiState {
  centerLng: number;
  centerLat: number;
  zoom: number;
  pitch: number;
  bearing: number;
  baseStyle: BaseStyle;
  lightPollution: boolean;
  clouds: boolean;
  seeingUi: boolean;
  setViewFromMap: (
    lng: number,
    lat: number,
    zoom: number,
    pitch: number,
    bearing: number
  ) => void;
  setBaseStyle: (style: BaseStyle) => void;
  cycleBaseStyle: () => void;
  setLightPollution: (v: boolean) => void;
  setClouds: (v: boolean) => void;
  setSeeingUi: (v: boolean) => void;
  toggleLightPollution: () => void;
  toggleClouds: () => void;
  toggleSeeingUi: () => void;
}

export const useMapUiStore = create<MapUiState>((set) => ({
  centerLng: DEFAULT_LNG,
  centerLat: DEFAULT_LAT,
  zoom: DEFAULT_ZOOM,
  pitch: 0,
  bearing: 0,
  baseStyle: 'dark',
  lightPollution: true,
  clouds: false,
  seeingUi: true,

  setViewFromMap: (lng, lat, zoom, pitch, bearing) =>
    set({ centerLng: lng, centerLat: lat, zoom, pitch, bearing }),

  setBaseStyle: (baseStyle) => set({ baseStyle }),

  cycleBaseStyle: () =>
    set((s) => ({
      baseStyle:
        s.baseStyle === 'dark'
          ? 'satellite'
          : s.baseStyle === 'satellite'
            ? 'streets'
            : 'dark',
    })),

  setLightPollution: (lightPollution) => set({ lightPollution }),
  setClouds: (clouds) => set({ clouds }),
  setSeeingUi: (seeingUi) => set({ seeingUi }),

  toggleLightPollution: () => set((s) => ({ lightPollution: !s.lightPollution })),
  toggleClouds: () => set((s) => ({ clouds: !s.clouds })),
  toggleSeeingUi: () => set((s) => ({ seeingUi: !s.seeingUi })),
}));
