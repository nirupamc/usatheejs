import { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import CitySelector from "../../components/CitySelector";
import CityMap from "./CityMap";
import ChartPanel from "./ChartPanel";
import { CITY_BY_ID } from "../../config/cities";
import { useCrimeData } from "../../hooks/useCrimeData";
import { useCityGeoJSON } from "../../hooks/useCityGeoJSON";
import { useDashboardStore } from "../../stores/dashboardStore";

const Page = styled.div`
  min-height: 100vh;
  padding: 24px;
  background: #0d1117;
  color: #e6edf3;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid #21262d;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.4px;
  line-height: 1.1;
`;

const Subtitle = styled.span`
  font-size: 13px;
  color: #6e7681;
`;

const SelectorWrap = styled.div<{ $accent: string }>`
  border-left: 4px solid ${({ $accent }) => $accent};
  padding-left: 12px;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
`;

const Content = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 24px;
  animation: ${fadeIn} 400ms ease-out both;
`;

const MapArea = styled.div`
  flex: 1 1 60%;
  min-width: 0;
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
`;

const SkeletonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
`;

const Skel = styled.div<{ $w?: string; $h: number }>`
  flex: ${({ $w }) => ($w ? `0 0 ${$w}` : "1 1 60%")};
  min-width: 0;
  height: ${({ $h }) => $h}px;
  background: #161b22;
  border-radius: 8px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SkelColumn = styled.div`
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ErrorText = styled.p`
  font-size: 15px;
  color: #f85149;
`;

export default function USCrimeDashboard() {
  const selectedCity = useDashboardStore((s) => s.selectedCity);
  const city = CITY_BY_ID[selectedCity];
  const { data, isLoading, error } = useCrimeData();
  const { geoJSON, isLoading: geoLoading, error: geoError } =
    useCityGeoJSON(selectedCity);

  useEffect(() => {
    if (!geoJSON) return;
    console.log(`[GeoJSON] ${city?.name}: ${geoJSON.features.length} features`);
  }, [geoJSON, city?.name]);

  const ready = !!geoJSON && !isLoading && !geoLoading;

  return (
    <Page>
      <Header>
        <TitleGroup>
          <Title>US Crime Dashboard</Title>
          <Subtitle>Interactive 3D crime mapping across major US cities</Subtitle>
        </TitleGroup>
        <SelectorWrap $accent={city?.accent ?? "#30363d"}>
          <CitySelector />
        </SelectorWrap>
      </Header>

      {geoError && <ErrorText>Boundary error: {geoError}</ErrorText>}
      {error && <ErrorText>Crime data error: {error}</ErrorText>}

      {!ready && !geoError && !error && (
        <SkeletonRow>
          <Skel $h={520} aria-label={`Loading ${city?.name} map`} />
          <SkelColumn>
            <Skel $w="400px" $h={156} />
            <Skel $w="400px" $h={156} />
            <Skel $w="400px" $h={156} />
          </SkelColumn>
        </SkeletonRow>
      )}

      {ready && city && (
        <Content key={selectedCity}>
          <MapArea>
            <CityMap geoJSON={geoJSON} city={city} crimeData={data} />
          </MapArea>
          <ChartPanel city={city} crimeData={data} />
        </Content>
      )}
    </Page>
  );
}
