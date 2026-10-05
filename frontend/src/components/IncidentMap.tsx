import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { LEAFLET_TILES } from "../carto";
import {
  AGENCY_LABEL,
  isMapped,
  MAP_CENTER,
  MAP_ZOOM,
  SEVERITY_COLOR,
  type IncidentCard,
} from "../types";
import { SeverityBadge } from "./SeverityBadge";

type Props = {
  incidents: IncidentCard[];
  selectedId: string | null;
  onSelect: (incident: IncidentCard) => void;
};

function pinIcon(severity: IncidentCard["severity"], selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<span class="pin pin-${severity}${selected ? " pin-selected" : ""}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function FlyToSelection({ incident }: { incident: IncidentCard | null }) {
  const map = useMap();
  useEffect(() => {
    if (incident && isMapped(incident) && incident.latitude != null && incident.longitude != null) {
      map.flyTo([incident.latitude, incident.longitude], 14, { duration: 0.75 });
    }
  }, [incident, map]);
  return null;
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

export function IncidentMap({ incidents, selectedId, onSelect }: Props) {
  const mapped = incidents.filter(isMapped);
  const selected = incidents.find((item) => item.incident_id === selectedId) ?? null;

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      scrollWheelZoom
      className="absolute inset-0 h-full w-full"
    >
      <TileLayer attribution={LEAFLET_TILES.attribution} url={LEAFLET_TILES.url} />
      <InvalidateOnResize />
      <FlyToSelection incident={selected} />
      {mapped.map((incident) => (
        <Marker
          key={incident.incident_id}
          position={[incident.latitude as number, incident.longitude as number]}
          icon={pinIcon(incident.severity, incident.incident_id === selectedId)}
          eventHandlers={{ click: () => onSelect(incident) }}
        >
          <Popup>
            <div className="min-w-48 space-y-2">
              <p className="font-mono text-[11px] text-[#8b9bb3]">{incident.incident_id}</p>
              <p className="text-sm font-medium text-[#0b1220]">{incident.summary}</p>
              <SeverityBadge severity={incident.severity} compact />
              <p className="text-xs text-[#334155]">{AGENCY_LABEL[incident.target_agency]}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      <div className="absolute bottom-6 left-4 z-[400] rounded-xl border border-[#243049] bg-[#0b1220]/90 px-3 py-2 text-[11px] text-[#c5d0e0]">
        <p className="mb-1 font-mono uppercase tracking-wide text-[#8b9bb3]">Severity</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(SEVERITY_COLOR).map(([name, color]) => (
            <span key={name} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {name}
            </span>
          ))}
        </div>
      </div>
    </MapContainer>
  );
}
