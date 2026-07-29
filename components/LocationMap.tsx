"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RollLocation } from "@/lib/getPhotos";

// Renders one heat "point" per photo (not per roll), so rolls with more
// frames naturally read as hotter spots on the map — closer to a real
// travel-density heatmap than one pin per trip.
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

    map.on("load", () => {
      // Expand each roll into `count` individual points so denser rolls
      // (more frames) contribute more heat, then feed that into a single
      // GeoJSON source.
      const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
      locations.forEach((loc) => {
        for (let i = 0; i < loc.count; i++) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
            properties: { city: loc.city, country: loc.country },
          });
        }
      });

      map.addSource("photo-points", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.addLayer({
        id: "photo-heat",
        type: "heatmap",
        source: "photo-points",
        maxzoom: 9,
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(246,243,236,0)",
            0.2, "#F0D9C4",
            0.4, "#E2AE8A",
            0.6, "#C6603C",
            0.8, "#A8482C",
            1, "#6B2A18",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 9, 30],
          "heatmap-opacity": 0.85,
        },
      });

      // Once zoomed in past maxzoom, fall back to visible dots so the
      // heatmap doesn't just vanish on close-up views.
      map.addLayer({
        id: "photo-points-visible",
        type: "circle",
        source: "photo-points",
        minzoom: 7,
        paint: {
          "circle-radius": 6,
          "circle-color": "#C6603C",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F6F3EC",
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 9, 1],
        },
      });
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
      aria-label="Heatmap of places photographed"
    />
  );
}
