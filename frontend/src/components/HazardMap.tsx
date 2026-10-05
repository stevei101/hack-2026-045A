import { useEffect } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import {
  MAP_CENTER,
  categoryMark,
  isMapped,
  severityClass,
  type Incident,
} from "../incidents.ts"

type HazardMapProps = {
  incidents: Incident[]
  selectedId: string | null
  panToken: number
  recenterToken: number
  onSelect: (id: string) => void
}

function markerIcon(incident: Incident): L.DivIcon {
  const pulse = incident.severity === "CRITICAL" ? "marker-pulse-critical" : ""
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="${severityClass(incident.severity)} ${pulse} flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg">${categoryMark(incident.category)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function FlyToSelected({
  incident,
  panToken,
}: {
  incident: Incident | undefined
  panToken: number
}) {
  const map = useMap()
  useEffect(() => {
    if (!incident || !isMapped(incident) || panToken === 0) return
    map.flyTo([incident.latitude, incident.longitude], 14, { duration: 1.2 })
  }, [incident, map, panToken])
  return null
}

function Recenter({ token }: { token: number }) {
  const map = useMap()
  useEffect(() => {
    if (token === 0) return
    map.setView(MAP_CENTER, 11)
  }, [map, token])
  return null
}

export function HazardMap({ incidents, selectedId, panToken, recenterToken, onSelect }: HazardMapProps) {
  const selected = incidents.find((item) => item.incident_id === selectedId)
  const mapped = incidents.filter(isMapped)

  return (
    <MapContainer center={MAP_CENTER} zoom={11} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={18}
      />
      <FlyToSelected incident={selected} panToken={panToken} />
      <Recenter token={recenterToken} />
      {mapped.map((incident) => (
        <Marker
          key={incident.incident_id}
          position={[incident.latitude, incident.longitude]}
          icon={markerIcon(incident)}
          eventHandlers={{ click: () => onSelect(incident.incident_id) }}
        >
          <Popup>
            <div className="space-y-1.5 font-sans text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-slate-100">{incident.incident_id}</span>
                <span className={`${severityClass(incident.severity)} rounded px-2 py-0.5 text-[10px] font-bold text-white`}>
                  {incident.severity}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200">{incident.summary}</div>
              <div className="text-[11px] text-slate-400">{incident.address}</div>
              <div className="border-t border-slate-700 pt-1 font-mono text-[10px] text-brand-100">
                Route: {incident.target_agency}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
