export interface CityConfig {
  /** Display name */
  name: string;
  /** URL-safe slug, also used as a stable key */
  id: string;
  /** Socrata Open Data API (SODA) JSON endpoint for the city's crime dataset */
  apiEndpoint: string;
  /** Map center as [latitude, longitude] */
  center: [number, number];
  /** Default Leaflet/map zoom level */
  defaultZoom: number;
  /** Unique accent color used for UI theming (hex) */
  accent: string;
  /** What this city calls its sub-divisions (e.g. "Districts", "Boroughs") */
  districtLabel: string;
  /** SoQL column holding the incident date/timestamp, used for date-range filters */
  dateField: string;
  /** SoQL column holding the crime category/type, used for crime-type filters */
  crimeTypeField: string;
  /** Which API the endpoint speaks: "socrata" supports SoQL filtering, "other" does not (yet) */
  apiType: "socrata" | "other";
  /** Filename of the city's boundary GeoJSON in src/assets/geo/ */
  geoJsonFile: string;
  /** Feature property holding each district/neighborhood's display name */
  districtNameField: string;
  /** Crime-record column holding the district, joined to districtNameField for choropleth counts */
  crimeDistrictField: string;
  /** Optional in-plane map rotation in degrees to fine-tune orientation (default 0) */
  rotationZ?: number;
  /** Optional: map a crime-record district value into the GeoJSON districtNameField format */
  normalizeDistrictName?: (crimeValue: string) => string;
}

/** English ordinal suffix for a positive integer (1 → "st", 11 → "th", 22 → "nd"). */
function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export const CITIES: CityConfig[] = [
  {
    name: "Chicago",
    id: "chicago",
    apiEndpoint: "https://data.cityofchicago.org/resource/ijzp-q8t2.json",
    center: [41.8781, -87.6298],
    defaultZoom: 11,
    accent: "#e84855",
    districtLabel: "Districts",
    dateField: "date",
    crimeTypeField: "primary_type",
    apiType: "socrata",
    geoJsonFile: "chicago.geojson",
    districtNameField: "dist_label",
    crimeDistrictField: "district",
    // Crime data uses zero-padded numbers ("011"); dist_label uses ordinals ("11TH").
    normalizeDistrictName: (v) => {
      const n = parseInt(v, 10);
      return Number.isNaN(n) ? v : `${n}${ordinalSuffix(n)}`.toUpperCase();
    },
  },
  {
    name: "New York City",
    id: "nyc",
    apiEndpoint: "https://data.cityofnewyork.us/resource/qgea-i56i.json",
    center: [40.7128, -74.006],
    defaultZoom: 11,
    accent: "#2d7dd2",
    districtLabel: "Boroughs",
    dateField: "cmplnt_fr_dt",
    crimeTypeField: "ofns_desc",
    apiType: "socrata",
    geoJsonFile: "new-york-city.geojson",
    districtNameField: "boroname",
    crimeDistrictField: "boro_nm",
    rotationZ: -30,
  },
  {
    name: "Los Angeles",
    id: "los-angeles",
    apiEndpoint: "https://data.lacity.org/resource/2nrs-mtv8.json",
    center: [34.0522, -118.2437],
    defaultZoom: 10,
    accent: "#f4a300",
    districtLabel: "Divisions",
    dateField: "date_occ",
    crimeTypeField: "crm_cd_desc",
    apiType: "socrata",
    geoJsonFile: "los-angeles.geojson",
    districtNameField: "APREC",
    crimeDistrictField: "area_name",
  },
  {
    name: "San Francisco",
    id: "san-francisco",
    apiEndpoint: "https://data.sfgov.org/resource/wg3w-h783.json",
    center: [37.7749, -122.4194],
    defaultZoom: 12,
    accent: "#ff6f3c",
    districtLabel: "Neighborhoods",
    dateField: "incident_datetime",
    crimeTypeField: "incident_category",
    apiType: "socrata",
    geoJsonFile: "san-francisco.geojson",
    districtNameField: "nhood",
    crimeDistrictField: "police_district",
  },
  {
    name: "Seattle",
    id: "seattle",
    apiEndpoint: "https://data.seattle.gov/resource/tazs-3rd5.json",
    center: [47.6062, -122.3321],
    defaultZoom: 11,
    accent: "#3cb371",
    districtLabel: "Precincts",
    dateField: "offense_start_datetime",
    crimeTypeField: "offense",
    apiType: "socrata",
    geoJsonFile: "seattle.geojson",
    districtNameField: "district",
    crimeDistrictField: "precinct",
  },
  {
    name: "Boston",
    id: "boston",
    apiEndpoint: "https://data.boston.gov/resource/crime.json",
    center: [42.3601, -71.0589],
    defaultZoom: 12,
    accent: "#8e44ad",
    districtLabel: "Neighborhoods",
    dateField: "occurred_on_date",
    crimeTypeField: "offense_description",
    apiType: "other",
    geoJsonFile: "boston.geojson",
    districtNameField: "name",
    crimeDistrictField: "district",
  },
  {
    name: "Denver",
    id: "denver",
    apiEndpoint: "https://data.colorado.gov/resource/6vp6-wxuq.json",
    center: [39.7392, -104.9903],
    defaultZoom: 11,
    accent: "#00a8a8",
    districtLabel: "Neighborhoods",
    dateField: "first_occurrence_date",
    crimeTypeField: "offense_category_id",
    apiType: "socrata",
    geoJsonFile: "denver.geojson",
    districtNameField: "nbhd_name",
    crimeDistrictField: "neighborhood_id",
  },
  {
    name: "Miami",
    id: "miami",
    apiEndpoint: "https://data.miamidade.gov/resource/s3is-scbp.json",
    center: [25.7617, -80.1918],
    defaultZoom: 11,
    accent: "#f7b731",
    districtLabel: "Districts",
    dateField: "date_occur",
    crimeTypeField: "offense",
    apiType: "socrata",
    geoJsonFile: "miami.geojson",
    districtNameField: "name",
    crimeDistrictField: "city",
  },
  {
    name: "Austin",
    id: "austin",
    apiEndpoint: "https://data.austintexas.gov/resource/fdj4-gpfu.json",
    center: [30.2672, -97.7431],
    defaultZoom: 11,
    accent: "#16a085",
    districtLabel: "Sectors",
    dateField: "occ_date_time",
    crimeTypeField: "crime_type",
    apiType: "socrata",
    geoJsonFile: "austin.geojson",
    districtNameField: "district_name",
    crimeDistrictField: "sector",
  },
  {
    name: "Philadelphia",
    id: "philadelphia",
    apiEndpoint: "https://phl.carto.com/api/v2/sql?q=SELECT+*+FROM+incidents_part1_part2",
    center: [39.9526, -75.1652],
    defaultZoom: 12,
    accent: "#d4af37",
    districtLabel: "Districts",
    dateField: "dispatch_date",
    crimeTypeField: "text_general_code",
    apiType: "other",
    geoJsonFile: "philadelphia.geojson",
    districtNameField: "dist_numc",
    crimeDistrictField: "district_occurance",
  },
];

/** Lookup map keyed by city id for O(1) access. */
export const CITY_BY_ID: Record<string, CityConfig> = Object.fromEntries(
  CITIES.map((city) => [city.id, city])
);

/** Default city shown on first load. */
export const DEFAULT_CITY = CITIES[0];
