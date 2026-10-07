import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Cpu, Clock, Navigation } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatTime } from '../../utils/statusUtils';

// Fix Leaflet's default icon broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SERIAL_NUMBER  = 'ESP32-001';

/**
 * Clean Location and Device details card matching strict design system.
 */
export default function LocationDeviceCard({ isConnected, latest }) {
  const updatedAt = latest?.timestamp ? formatTime(latest.timestamp) : '—';
  const deviceId  = latest?.device_id ?? SERIAL_NUMBER;
  const latitude = Number(latest?.latitude);
  const longitude = Number(latest?.longitude);
  const hasGpsFix = latest?.gps_fix === true &&
    Number.isFinite(latitude) && Number.isFinite(longitude);
  const coordinates = hasGpsFix
    ? `${Math.abs(latitude).toFixed(6)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(6)}°${longitude >= 0 ? 'E' : 'W'}`
    : 'No GPS fix';

  return (
    <div className="ui-card h-full min-h-65 p-0! overflow-hidden flex flex-col">
      <div className="h-50 w-full relative z-0 border-b border-(--border-subtle)">
        {hasGpsFix ? (
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap latitude={latitude} longitude={longitude} />
            <Marker position={[latitude, longitude]}>
              <Popup>Live GPS position</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-(--bg-elevated) text-secondary">
            <div className="text-center">
              <Navigation className="w-6 h-6 mx-auto mb-2" strokeWidth={2} />
              <p className="text-14 font-medium text-primary">Waiting for GPS fix</p>
              <p className="text-12 mt-1">Coordinates appear when the receiver locks on.</p>
            </div>
          </div>
        )}
      </div>

      {/* Details panel (24px padding = p-6) */}
      <div className="p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-12 font-medium uppercase tracking-wider text-secondary">
              GPS Location
            </span>
            <h3 className="text-16 font-semibold text-primary mt-1">
              {hasGpsFix ? 'Live GPS position' : 'Position unavailable'}
            </h3>
          </div>
          <Badge
            label={isConnected ? 'Online' : 'Offline'}
            variant={isConnected ? 'safe' : 'danger'}
          />
        </div>

        {/* Metadata Details Grid (strict 12/14px type scale and 12px gap) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-(--border-subtle)">
          <DetailItem
            icon={Cpu}
            label="Hardware ID"
            value={deviceId}
          />
          <DetailItem
            icon={Navigation}
            label="GPS Fix"
            value={hasGpsFix ? 'Available' : 'Searching'}
          />
          <DetailItem
            icon={MapPin}
            label="Coordinates"
            value={coordinates}
            fullWidth
          />
          <DetailItem
            icon={Clock}
            label="Last Telemetry"
            value={updatedAt}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

function RecenterMap({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [map, latitude, longitude]);

  return null;
}

function DetailItem({ icon: Icon, label, value, fullWidth }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1.5 text-12 text-secondary mb-0.5">
        <Icon className="w-3.5 h-3.5 text-secondary shrink-0" strokeWidth={2} />
        <span>{label}</span>
      </div>
      <p className="text-14 font-medium text-primary truncate">
        {value}
      </p>
    </div>
  );
}
