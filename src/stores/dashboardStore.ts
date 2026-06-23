import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { DEFAULT_CITY, type CityConfig } from "../config/cities";

/** Inclusive date range as ISO date strings (YYYY-MM-DD). */
export interface DateRange {
  start: string;
  end: string;
}

export interface DashboardState {
  /** Currently selected city, keyed by CityConfig.id */
  selectedCity: CityConfig["id"];
  /** Selected crime type; null means "all types" */
  selectedCrimeType: string | null;
  /** Active date filter; null means "no date filter" */
  dateRange: DateRange | null;
  /** Whether crime data is currently being fetched */
  isLoading: boolean;

  // Actions
  setSelectedCity: (cityId: CityConfig["id"]) => void;
  setSelectedCrimeType: (crimeType: string | null) => void;
  setDateRange: (range: DateRange | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedCity: DEFAULT_CITY.id,
  selectedCrimeType: null,
  dateRange: null,
  isLoading: false,
} satisfies Partial<DashboardState>;

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setSelectedCity: (cityId) => set({ selectedCity: cityId }),
    setSelectedCrimeType: (crimeType) => set({ selectedCrimeType: crimeType }),
    setDateRange: (range) => set({ dateRange: range }),
    setIsLoading: (isLoading) => set({ isLoading }),
    reset: () => set(initialState),
  }))
);
