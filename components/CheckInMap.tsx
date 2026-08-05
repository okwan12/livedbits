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
import type { GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  placesToGeoJSON,
  initialViewState,
  type Place,
} from "@/data/places";

// Layer ids are referenced both in the <Layer> definitions and when we detect
// what was clicked, so they live here as constants.
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const UNCLUSTERED_LAYER_ID = "unclustered-point";
const SOURCE_ID = "places";

// Rust = #C6603C, cream/paper = #F6F3EC — matches the site's palette.
const RUST = "#C6603C";
const PAPER = "#F6F3EC";

// Filled circle for a cluster; grows a little as the cluster gets bigger.
const clusterLayer: LayerProps = {
  id: CLUSTER_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": RUST,
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

// A single (unclustered) place pin.
const unclusteredPointLayer: LayerProps = {
  id: UNCLUSTERED_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": RUST,
    "circle-radius": 6,
    "circle-stroke-width": 2,
    "circle-stroke-color": PAPER,
  },
};

type PopupInfo = {
  longitude: number;
  latitude: number;
  name: string;
  visitedDate: string | null;
};

export default function CheckInMap({
  places,
  className = "h-64 md:h-80 w-full overflow-hidden rounded-2xl",
}: {
  places: Place[];
  className?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const data = placesToGeoJSON(places);

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

    // An individual place: show name + visited date (when present).
    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
    setPopupInfo({
      longitude,
      latitude,
      name: (feature.properties?.name as string) ?? "",
      visitedDate: (feature.properties?.visited_date as string) ?? null,
    });
  }, []);

  // No token → render nothing rather than crashing.
  if (!token) return null;

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactiveLayerIds={[CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID]}
        onClick={handleClick}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
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
              <p className="text-sm text-ink">{popupInfo.name}</p>
              {popupInfo.visitedDate && (
                <p className="text-xs uppercase tracking-widest2 text-ink/50">
                  {popupInfo.visitedDate}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
