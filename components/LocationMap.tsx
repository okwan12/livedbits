"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RollLocation } from "@/lib/getPhotos";

export default function LocationMap({
  locations,
}: {
  locations: RollLocation[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [10, 30],
      zoom: 1.4,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    locations.forEach((loc) => {
      const el = document.createElement("div");
      el.className = "map-pin";
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.background = "#C6603C";
      el.style.border = "2px solid #F6F3EC";
      el.style.boxShadow = "0 0 0 2px rgba(27,27,24,0.15)";
      el.style.cursor = "pointer";

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
        `<div style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">
           ${loc.city}, ${loc.country}<br/>${loc.count} frame${loc.count > 1 ? "s" : ""}
         </div>`
      );

      new mapboxgl.Marker({ element: el })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [locations]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return (
      <div className="aspect-[16/7] bg-ink/5 flex items-center justify-center font-mono text-xs uppercase tracking-widest2 text-ink/40">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to see the map
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="aspect-[16/7] w-full"
      role="img"
      aria-label="Map of places photographed"
    />
  );
}
