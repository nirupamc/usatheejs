import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { CITIES, CITY_BY_ID } from "../config/cities";
import { useDashboardStore } from "../stores/dashboardStore";

const Wrapper = styled.div`
  position: relative;
  width: 280px;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
`;

const Trigger = styled.button<{ $accent: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: #161b22;
  color: #e6edf3;
  border: 1px solid #30363d;
  border-left: 3px solid ${({ $accent }) => $accent};
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    background: #1c2129;
  }

  &:focus-visible {
    outline: 2px solid ${({ $accent }) => $accent};
    outline-offset: 1px;
  }
`;

const TriggerLabel = styled.span`
  flex: 1;
`;

const Caret = styled.span<{ $open: boolean }>`
  color: #8b949e;
  font-size: 11px;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 0.15s ease;
`;

const Dot = styled.span<{ $color: string }>`
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const Panel = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  background: #161b22;
  color: #e6edf3;
  border: none;
  border-bottom: 1px solid #30363d;
  font-size: 14px;

  &::placeholder {
    color: #6e7681;
  }

  &:focus {
    outline: none;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 280px;
  overflow-y: auto;
`;

const Option = styled.li<{ $active: boolean; $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: ${({ $selected }) => ($selected ? "#ffffff" : "#c9d1d9")};
  background: ${({ $active }) => ($active ? "#1f6feb33" : "transparent")};
  cursor: pointer;
`;

const OptionName = styled.span`
  flex: 1;
`;

const Check = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: 13px;
`;

const Empty = styled.div`
  padding: 14px;
  color: #6e7681;
  font-size: 14px;
  text-align: center;
`;

export default function CitySelector() {
  const selectedCity = useDashboardStore((s) => s.selectedCity);
  const setSelectedCity = useDashboardStore((s) => s.setSelectedCity);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = CITY_BY_ID[selectedCity];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  // Focus the search box and reset the highlight whenever the panel opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Defer so the input is mounted before focusing.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Keep the highlighted option in view as it moves.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const node = list?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(index: number) {
    const city = filtered[index];
    if (!city) return;
    setSelectedCity(city.id);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) =>
          filtered.length ? (i - 1 + filtered.length) % filtered.length : 0
        );
        break;
      case "Enter":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        $accent={selected?.accent ?? "#30363d"}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {selected && <Dot $color={selected.accent} />}
        <TriggerLabel>{selected?.name ?? "Select a city"}</TriggerLabel>
        <Caret $open={open}>▼</Caret>
      </Trigger>

      {open && (
        <Panel>
          <SearchInput
            ref={searchRef}
            value={query}
            placeholder="Search cities…"
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            aria-label="Search cities"
          />
          {filtered.length === 0 ? (
            <Empty>No cities found</Empty>
          ) : (
            <List ref={listRef} role="listbox" aria-label="Cities">
              {filtered.map((city, index) => {
                const isSelected = city.id === selectedCity;
                return (
                  <Option
                    key={city.id}
                    role="option"
                    aria-selected={isSelected}
                    $active={index === activeIndex}
                    $selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(index)}
                  >
                    <Dot $color={city.accent} />
                    <OptionName>{city.name}</OptionName>
                    {isSelected && <Check $color={city.accent}>✓</Check>}
                  </Option>
                );
              })}
            </List>
          )}
        </Panel>
      )}
    </Wrapper>
  );
}
