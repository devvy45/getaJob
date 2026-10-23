"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./location-input.module.css";

type Place = { label: string; detail: string };

const REMOTE: Place = { label: "Remote", detail: "Anywhere" };

/**
 * Free worldwide place search (Photon, built on OpenStreetMap). No key needed.
 * People can still type anything; suggestions just make it faster and consistent.
 */
async function searchPlaces(query: string, signal: AbortSignal): Promise<Place[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en&layer=city&layer=state&layer=country`;
  const response = await fetch(url, { signal });
  if (!response.ok) return [];
  const json = await response.json() as { features?: { properties?: { name?: string; state?: string; country?: string; type?: string } }[] };
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const feature of json.features || []) {
    const p = feature.properties || {};
    if (!p.name) continue;
    const parts = p.type === "country" ? [p.name] : p.type === "state" ? [p.name, p.country] : [p.name, p.state !== p.name ? p.state : undefined, p.country];
    const label = parts.filter(Boolean).join(", ");
    if (seen.has(label)) continue;
    seen.add(label);
    places.push({ label, detail: p.type === "country" ? "Country" : p.type === "state" ? "Region" : "City" });
  }
  return places.slice(0, 6);
}

export default function LocationInput({ value, onChange, invalid, placeholder = "Start typing a city" }: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const typed = useRef(false);

  useEffect(() => {
    const query = value.trim();
    if (!typed.current || query.length < 2) { setPlaces([]); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then((result) => { setPlaces(result); setActive(-1); })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 220);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [value]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!wrapRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const options = [...places, ...(REMOTE.label.toLowerCase().startsWith(value.trim().toLowerCase()) || value.trim().length < 2 ? [REMOTE] : [])];
  const choose = (place: Place) => { typed.current = false; onChange(place.label); setOpen(false); setPlaces([]); };

  return <div className={styles.wrap} ref={wrapRef}>
    <input
      className={invalid ? styles.invalid : ""}
      type="text"
      role="combobox"
      aria-expanded={open && options.length > 0}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      onFocus={() => setOpen(true)}
      onChange={(e) => { typed.current = true; onChange(e.target.value); setOpen(true); }}
      onKeyDown={(e) => {
        if (!open || !options.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? options.length - 1 : i - 1)); }
        else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(options[active]); }
        else if (e.key === "Escape") setOpen(false);
      }}
    />
    {loading && <span className={styles.spinner} aria-hidden="true" />}
    {open && options.length > 0 && <ul className={styles.list} id={listId} role="listbox">
      {options.map((place, index) => <li
        key={place.label}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={index === active}
        className={index === active ? styles.active : ""}
        onMouseDown={(e) => { e.preventDefault(); choose(place); }}
        onMouseEnter={() => setActive(index)}
      ><span>{place.label}</span><small>{place.detail}</small></li>)}
    </ul>}
  </div>;
}
