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

// A single (unclustered) place pin — colored by category.
const unclusteredPointLayer: LayerProps = {
  id: UNCLUSTERED_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": categoryCircleColor,
    "circle-radius": 7,
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

function formatMonthYear(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function popupLocation(city: string | null, country: string | null): string {
  return [city, country].filter(Boolean).join(", ");
}

function popupCaption(category: string | null, visitedDate: string | null): string {
  const parts = [
    category,
    visitedDate ? formatMonthYear(visitedDate) : null,
  ].filter(Boolean);
  return parts.join(" • ");
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

    // An individual place: name / City, Country / category • Month Year.
    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
    setPopupInfo({
      longitude,
      latitude,
      name: (feature.properties?.name as string) || "",
      visitedDate: (feature.properties?.visited_date as string) || null,
      category: (feature.properties?.category as string) || null,
      city: (feature.properties?.city as string) || null,
      country: (feature.properties?.country as string) || null,
    });
  }, []);

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
        interactiveLayerIds={[CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID]}
        onClick={handleClick}
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
          <Layer {...unclusteredPointLayer} />
        </Source>

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={12}
            closeButton={false}
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
