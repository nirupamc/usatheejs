import { useMemo, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import * as THREE from "three";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { CityConfig } from "../../config/cities";
import type { CrimeRecord } from "../../hooks/useCrimeData";

/** Size (in world units) the projected map is fit into, and extrusion depth. */
const SIZE = 8;
const DEPTH = 0.3;

const EDGE_COLOR = "#4a90d9";
const LOW_HEX = "#0d1b3e"; // few/no crimes
const HIGH_HEX = "#e84855"; // most crimes
const LOW_COLOR = new THREE.Color(LOW_HEX);
const HIGH_COLOR = new THREE.Color(HIGH_HEX);
const HOVER_BRIGHTEN = 1.4;

interface CityMapProps {
  geoJSON: FeatureCollection;
  city: CityConfig;
  crimeData: CrimeRecord[];
}

/** A district ready to render: extruded geometry, choropleth color, name & count. */
interface District {
  geometry: THREE.ExtrudeGeometry;
  color: THREE.Color;
  name: string;
  count: number;
}

/** Tooltip state, with cursor position in viewport coordinates. */
interface HoverInfo {
  index: number;
  name: string;
  count: number;
  x: number;
  y: number;
}

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const LegendOverlay = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 10;
  width: 168px;
  padding: 10px 12px;
  background: rgba(13, 17, 23, 0.82);
  border: 1px solid #21262d;
  border-radius: 8px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
`;

const LegendTitle = styled.div`
  font-size: 11px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #8b949e;
  margin-bottom: 6px;
`;

const LegendBar = styled.div`
  height: 10px;
  border-radius: 5px;
  border: 1px solid #21262d;
  background: linear-gradient(to right, ${LOW_HEX}, ${HIGH_HEX});
`;

const LegendLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: #6e7681;
`;

/** Multiply RGB by a factor, clamped to 1.0, for the hover highlight. */
function brighten(color: THREE.Color, factor: number): THREE.Color {
  return new THREE.Color(
    Math.min(1, color.r * factor),
    Math.min(1, color.g * factor),
    Math.min(1, color.b * factor)
  );
}

/** Normalize a district value from either side of the join into a comparable key. */
function districtKey(value: unknown): string {
  return value == null ? "" : String(value).trim().toLowerCase();
}

/** Normalize Polygon / MultiPolygon into a list of polygons (each = list of rings). */
function getPolygons(geometry: Geometry): Position[][][] {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

/** Build one extruded geometry per feature, keeping the source feature for joins. */
function buildGeometries(
  geoJSON: FeatureCollection
): { geometry: THREE.ExtrudeGeometry; feature: Feature }[] {
  const projection = geoMercator().fitSize([SIZE, SIZE], geoJSON);

  // Project lng/lat → centered XY, flipping Y so north points up.
  const project = (coord: Position): [number, number] => {
    const p = projection([coord[0], coord[1]]);
    if (!p) return [0, 0];
    return [p[0] - SIZE / 2, -(p[1] - SIZE / 2)];
  };

  const ringToPath = (ring: Position[], path: THREE.Path) => {
    ring.forEach((coord, i) => {
      const [x, y] = project(coord);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
  };

  const result: { geometry: THREE.ExtrudeGeometry; feature: Feature }[] = [];

  for (const feature of geoJSON.features) {
    if (!feature.geometry) continue;
    const polygons = getPolygons(feature.geometry);
    if (polygons.length === 0) continue;

    const shapes: THREE.Shape[] = polygons.map((rings) => {
      const shape = new THREE.Shape();
      ringToPath(rings[0], shape); // outer ring
      for (let h = 1; h < rings.length; h++) {
        const hole = new THREE.Path();
        ringToPath(rings[h], hole); // inner rings = holes
        shape.holes.push(hole);
      }
      return shape;
    });

    result.push({
      geometry: new THREE.ExtrudeGeometry(shapes, {
        depth: DEPTH,
        bevelEnabled: false,
      }),
      feature,
    });
  }

  return result;
}

/** Count crime records per district, keyed by the normalized district value. */
function countByDistrict(
  crimeData: CrimeRecord[],
  crimeDistrictField: string,
  normalize?: (crimeValue: string) => string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of crimeData) {
    const raw = record[crimeDistrictField];
    if (raw == null || raw === "") continue;
    // Apply the city's normalizer so crime values match GeoJSON district names.
    const value = normalize ? normalize(String(raw)) : String(raw);
    const key = districtKey(value);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function Districts({
  districts,
  rotationZ,
  hoveredIndex,
  onHover,
}: {
  districts: District[];
  rotationZ: number;
  hoveredIndex: number | null;
  onHover: (info: HoverInfo | null) => void;
}) {
  const handleMove =
    (district: District, index: number) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover({
        index,
        name: district.name,
        count: district.count,
        x: e.nativeEvent.clientX,
        y: e.nativeEvent.clientY,
      });
    };

  // Outer group lays the map flat (XY → XZ); inner group applies per-city spin.
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <group rotation={[0, 0, rotationZ]}>
        {districts.map((district, i) => {
          const color =
            i === hoveredIndex
              ? brighten(district.color, HOVER_BRIGHTEN)
              : district.color;
          return (
            <mesh
              key={i}
              geometry={district.geometry}
              onPointerOver={handleMove(district, i)}
              onPointerMove={handleMove(district, i)}
              onPointerOut={(e) => {
                e.stopPropagation();
                onHover(null);
              }}
            >
              <meshStandardMaterial color={color} flatShading />
              <lineSegments>
                <edgesGeometry args={[district.geometry]} />
                <lineBasicMaterial color={EDGE_COLOR} />
              </lineSegments>
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function CityMap({ geoJSON, city, crimeData }: CityMapProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const districts = useMemo<District[]>(() => {
    const built = buildGeometries(geoJSON);
    const counts = countByDistrict(
      crimeData,
      city.crimeDistrictField,
      city.normalizeDistrictName
    );

    const featureCounts = built.map(({ feature }) =>
      counts.get(districtKey(feature.properties?.[city.districtNameField])) ?? 0
    );
    const max = featureCounts.length ? Math.max(...featureCounts) : 0;
    const min = featureCounts.length ? Math.min(...featureCounts) : 0;
    const range = max - min;

    return built.map(({ geometry, feature }, i) => {
      const count = featureCounts[i];
      const t = range > 0 ? (count - min) / range : 0;
      const rawName = feature.properties?.[city.districtNameField];
      return {
        geometry,
        color: new THREE.Color().lerpColors(LOW_COLOR, HIGH_COLOR, t),
        name: rawName == null ? "Unknown" : String(rawName),
        count,
      };
    });
  }, [
    geoJSON,
    crimeData,
    city.crimeDistrictField,
    city.districtNameField,
    city.normalizeDistrictName,
  ]);

  const rotationZ = THREE.MathUtils.degToRad(city.rotationZ ?? 0);

  return (
    <MapContainer>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 6, 8], fov: 45 }}
        aria-label={`3D district map of ${city.name}`}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 8, 0]} intensity={0.6} />
        <Districts
          districts={districts}
          rotationZ={rotationZ}
          hoveredIndex={hover?.index ?? null}
          onHover={setHover}
        />
        <OrbitControls target={[0, 0, 0]} minDistance={3} maxDistance={20} />
      </Canvas>

      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 14,
            top: hover.y + 14,
            pointerEvents: "none",
            zIndex: 30,
            padding: "8px 11px",
            background: "#0d1117",
            color: "#e6edf3",
            border: `2px solid ${city.accent}`,
            borderRadius: 6,
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.55)",
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: 13,
            lineHeight: 1.4,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 600 }}>{hover.name}</div>
          <div style={{ color: city.accent }}>
            {hover.count.toLocaleString()} crimes
          </div>
        </div>
      )}

      <LegendOverlay>
        <LegendTitle>Crime Intensity</LegendTitle>
        <LegendBar />
        <LegendLabels>
          <span>Low</span>
          <span>High</span>
        </LegendLabels>
      </LegendOverlay>
    </MapContainer>
  );
}
