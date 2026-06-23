import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { CITY_BY_ID } from "../config/cities";

/**
 * Lazy importers for every GeoJSON file under src/assets/geo/.
 * Vite resolves this glob at build time; each file becomes its own chunk.
 * Loaded as raw text because Vite does not auto-parse the .geojson extension.
 */
const geoLoaders = import.meta.glob("../assets/geo/*.geojson", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

interface UseCityGeoJSONResult {
  geoJSON: FeatureCollection | null;
  isLoading: boolean;
  error: string | null;
}

export function useCityGeoJSON(cityId: string): UseCityGeoJSONResult {
  const [geoJSON, setGeoJSON] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const city = CITY_BY_ID[cityId];
    if (!city) {
      setError(`Unknown city: ${cityId}`);
      setGeoJSON(null);
      return;
    }

    // Key off the explicit filename, not the id (e.g. nyc → new-york-city.geojson).
    const path = `../assets/geo/${city.geoJsonFile}`;
    const loader = geoLoaders[path];
    if (!loader) {
      setError(`GeoJSON file not found: ${city.geoJsonFile}`);
      setGeoJSON(null);
      return;
    }

    // Dynamic import can't be aborted; guard against stale updates instead.
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    // Clear the previous city's data so stale boundaries/counts never render
    // while the new file loads.
    setGeoJSON(null);

    loader()
      .then((raw) => {
        if (cancelled) return;
        setGeoJSON(JSON.parse(raw) as FeatureCollection);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load GeoJSON");
        setGeoJSON(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cityId]);

  return { geoJSON, isLoading, error };
}
