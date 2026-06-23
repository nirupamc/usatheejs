import { useEffect, useState } from "react";
import { CITY_BY_ID } from "../config/cities";
import { useDashboardStore } from "../stores/dashboardStore";

/**
 * Crime record shape, using the Chicago dataset as the baseline schema.
 * Other cities expose different fields; fields here are optional where they
 * are not guaranteed across the Socrata response.
 */
export interface CrimeRecord {
  id?: string;
  case_number?: string;
  /** Floating timestamp, e.g. "2023-04-12T13:00:00.000" */
  date?: string;
  block?: string;
  iucr?: string;
  /** High-level crime category, e.g. "THEFT" */
  primary_type?: string;
  description?: string;
  location_description?: string;
  arrest?: boolean;
  domestic?: boolean;
  beat?: string;
  district?: string;
  ward?: string;
  community_area?: string;
  fbi_code?: string;
  year?: string;
  updated_on?: string;
  latitude?: string;
  longitude?: string;
  /** Allow extra city-specific fields without losing type safety on the rest. */
  [key: string]: unknown;
}

interface UseCrimeDataResult {
  data: CrimeRecord[];
  isLoading: boolean;
  error: string | null;
}

/** Escape a single-quoted SoQL string literal. */
function escapeSoql(value: string): string {
  return value.replace(/'/g, "''");
}

export function useCrimeData(): UseCrimeDataResult {
  const selectedCity = useDashboardStore((s) => s.selectedCity);
  const selectedCrimeType = useDashboardStore((s) => s.selectedCrimeType);
  const dateRange = useDashboardStore((s) => s.dateRange);

  const [data, setData] = useState<CrimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const city = CITY_BY_ID[selectedCity];
    if (!city) {
      setError(`Unknown city: ${selectedCity}`);
      setData([]);
      return;
    }

    const controller = new AbortController();

    // Build the SODA query.
    const params = new URLSearchParams();
    params.set("$limit", "5000");

    if (city.apiType === "other") {
      // Non-Socrata endpoints (Boston CKAN, Philadelphia Carto) don't speak
      // SoQL — skip $where filtering until proper adapters are built.
      if (dateRange || selectedCrimeType) {
        console.warn(
          `[useCrimeData] Filtering skipped for "${city.name}" (apiType="other"): ` +
            `date range and crime type filters are not yet supported for this endpoint.`
        );
      }
    } else {
      // Newest-first so the 5000-row sample spans many months, not one batch.
      params.set("$order", `${city.dateField} DESC`);

      const whereClauses: string[] = [];
      if (dateRange) {
        whereClauses.push(
          `${city.dateField} >= '${dateRange.start}T00:00:00' and ${city.dateField} <= '${dateRange.end}T23:59:59'`
        );
      }
      if (selectedCrimeType) {
        whereClauses.push(`${city.crimeTypeField} = '${escapeSoql(selectedCrimeType)}'`);
      }
      if (whereClauses.length > 0) {
        params.set("$where", whereClauses.join(" and "));
      }
    }

    const url = `${city.apiEndpoint}?${params.toString()}`;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status} ${res.statusText}`);
        }
        const json = (await res.json()) as CrimeRecord[];
        setData(json);
      } catch (err) {
        // Ignore aborts triggered by a newer request / unmount.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to fetch crime data");
        setData([]);
      } finally {
        // Only clear loading if this request wasn't superseded.
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [selectedCity, selectedCrimeType, dateRange]);

  return { data, isLoading, error };
}
