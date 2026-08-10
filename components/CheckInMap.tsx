"use client";

import { useCallback, useRef, useState } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  type MapRef,
  type MapLayerMouseEvent,
  type LayerProps,
} from "react-map-gl";
import type { Expression, GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  placesToGeoJSON,
  initialViewState,
  categoryColorMatchExpression,
  type Place,
} from "@/data/places";

// Layer ids are referenced both in the <Layer> definitions and when we detect
// what was clicked, so they live here as constants.
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const UNCLUSTERED_LAYER_ID = "unclustered-point";
// Invisible larger circle under the pin — easier to click without changing the look.
const UNCLUSTERED_HIT_LAYER_ID = "unclustered-point-hit";
const SOURCE_ID = "places";

const PAPER = "#F6F3EC";
const CLUSTER_COLOR = "#6B6B6B";

const categoryCircleColor = categoryColorMatchExpression() as Expression;

// Filled circle for a cluster; grows a little as the cluster gets bigger.
// Clusters stay neutral — they mix categories.
const clusterLayer: LayerProps = {
  id: CLUSTER_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": CLUSTER_COLOR,
    "circle-opacity": 0.85,
    "circle-radius": ["step", ["get", "point_count"], 16, 5, 22, 15, 28],
    "circle-stroke-width": 2,
    "circle-stroke-color": PAPER,
  },
};

// The number sitting on top of each cluster circle.
const clusterCountLayer: LayerProps = {
  id: CLUSTER_COUNT_LAYER_ID,
  type: "symbol",
  source: SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
  paint: {
    "text-color": PAPER,
  },
};

// Larger transparent hit target so pins aren't pixel-perfect to click.
const unclusteredHitLayer: LayerProps = {
  id: UNCLUSTERED_HIT_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#000000",
    "circle-opacity": 0,
    "circle-radius": 16,
  },
};

// A single (unclustered) place pin — colored by category.
const unclusteredPointLayer: LayerProps = {
  id: UNCLUSTERED_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": categoryCircleColor,
    "circle-radius": 8,
    "circle-stroke-width": 2,
    "circle-stroke-color": PAPER,
  },
};

type PopupInfo = {
  longitude: number;
  latitude: number;
  name: string;
  visitedDate: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
};

/** Keep only the 4-digit year from visited_date (e.g. 2026-01-01 → "2026"). */
function formatYear(isoDate: string): string | null {
  const match = String(isoDate).match(/^(\d{4})/);
  return match ? match[1] : null;
}

function cleanProp(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return null;
  return text;
}

function popupLocation(city: string | null, country: string | null): string {
  return [city, country]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .join(", ");
}

function popupCaption(
  category: string | null,
  visitedDate: string | null
): string {
  const year = visitedDate ? formatYear(visitedDate) : null;
  return [category?.trim() || null, year].filter(Boolean).join(" · ");
}

export default function CheckInMap({
  // Avoid overflow-hidden here — it can blank the Mapbox WebGL canvas
  // in some browsers while leaving the HTML logo visible.
  places,
  className = "h-64 md:h-80 w-full rounded-2xl",
}: {
  places: Place[];
  className?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [cursor, setCursor] = useState<"auto" | "pointer">("auto");

  const data = placesToGeoJSON(places);

  const handleMapLoad = useCallback(() => {
    mapRef.current?.getMap()?.resize();
  }, []);

  const handleMapError = useCallback((event: { error?: Error }) => {
    console.error("[CheckInMap]", event.error ?? event);
  }, []);

  const handleClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setPopupInfo(null);
      return;
    }

    // A cluster: smoothly zoom in until it breaks apart.
    if (feature.properties?.cluster) {
      setPopupInfo(null);
      const clusterId = feature.properties.cluster_id as number;
      const map = mapRef.current;
      const source = map?.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (!map || !source) return;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        const [longitude, latitude] = (
          feature.geometry as GeoJSON.Point
        ).coordinates;
        map.easeTo({ center: [longitude, latitude], zoom, duration: 600 });
      });
      return;
    }

    // An individual place: name / City, Country / category · YYYY.
    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
    setPopupInfo({
      longitude,
      latitude,
      name: cleanProp(feature.properties?.name) || "",
      visitedDate: cleanProp(feature.properties?.visited_date),
      category: cleanProp(feature.properties?.category),
      city: cleanProp(feature.properties?.city),
      country: cleanProp(feature.properties?.country),
    });
  }, []);

  const handleMouseEnter = useCallback(() => setCursor("pointer"), []);
  const handleMouseLeave = useCallback(() => setCursor("auto"), []);

  // No token → show a clear empty state rather than a silent blank.
  if (!token) {
    return (
      <div
        className={`${className} flex items-center justify-center border border-ink/10 bg-ink/[0.02] font-body text-sm text-ink/50`}
      >
        Map token missing — add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
      </div>
    );
  }

  const locationLine = popupInfo
    ? popupLocation(popupInfo.city, popupInfo.country)
    : "";
  const caption = popupInfo
    ? popupCaption(popupInfo.category, popupInfo.visitedDate)
    : "";

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactiveLayerIds={[
          CLUSTER_LAYER_ID,
          UNCLUSTERED_HIT_LAYER_ID,
          UNCLUSTERED_LAYER_ID,
        ]}
        cursor={cursor}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onLoad={handleMapLoad}
        onError={handleMapError}
        attributionControl={false}
        style={{ width: "100%", height: "100%", borderRadius: "1rem" }}
      >
        <Source
          id={SOURCE_ID}
          type="geojson"
          data={data}
          cluster
          clusterRadius={50}
          clusterMaxZoom={14}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredHitLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={12}
            closeButton={false}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            className="font-body"
          >
            <div className="px-1 py-0.5">
              <p className="text-sm font-medium text-ink">{popupInfo.name}</p>
              {locationLine && (
                <p className="text-sm text-ink/70 mt-0.5">{locationLine}</p>
              )}
              {caption && (
                <p className="text-xs text-ink/45 mt-0.5">{caption}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
