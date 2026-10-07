import { useEffect, useRef, useState } from 'react';
import { Activity, Droplets, Thermometer, Wind } from 'lucide-react';
import Badge from '../ui/Badge';
import SparkLine from '../ui/SparkLine';
import SensorRangeIndicator from './SensorRangeIndicator';
import { THRESHOLDS, sensorStatus, formatSensorValue } from '../../utils/statusUtils';

const SENSOR_META = {
  ph: {
    label: 'pH Level',
    unit: 'pH',
    icon: Activity,
  },
  turbidity_ntu: {
    label: 'Turbidity',
    unit: 'NTU',
    icon: Droplets,
  },
  temperature_c: {
    label: 'Temperature',
    unit: '°C',
    icon: Thermometer,
  },
  h2s_ppm: {
    label: 'H₂S Concentration',
    unit: 'ppm',
    icon: Wind,
  },
};

/**
 * Industrial IoT Sensor Metric Card:
 * - 36px hero value (Inter font)
 * - Semantic status pill (SAFE / WARNING / CRITICAL)
 * - Accurate threshold range visualization (min ── ● ── max)
 * - Real-time sparkline trend
 */
export default function SensorMetricCard({ sensorKey, value, sparkData = [], loading }) {
  const meta = SENSOR_META[sensorKey];
  const threshold = THRESHOLDS[sensorKey];
  const prevValue = useRef(value);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (value !== null && value !== prevValue.current) {
      setIsFlashing(true);
      const t = setTimeout(() => setIsFlashing(false), 300);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  if (loading || value === null || !meta || !threshold) {
    return (
      <div className="ui-card flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[var(--bg-elevated)]" />
          <div className="w-14 h-5 rounded-full bg-[var(--bg-elevated)]" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 w-16 rounded bg-[var(--bg-elevated)]" />
          <div className="h-9 w-28 rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="h-10 rounded bg-[var(--bg-elevated)] mb-4" />
        <div className="h-8 rounded bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  const status = sensorStatus(sensorKey, value);
  const badgeVariant = status === 'OK' ? 'safe' : status === 'WARNING' ? 'warning' : 'danger';
  const badgeLabel = status === 'OK' ? 'SAFE' : status === 'WARNING' ? 'WARNING' : 'EXCEEDED';
  const IconComponent = meta.icon;

  const valueFormatted = formatSensorValue(sensorKey, value);

  return (
    <div className="ui-card flex h-full min-h-[260px] flex-col justify-between">
      {/* ── Row 1: Header (Icon + Sensor Name + Status Pill) ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-brand flex-shrink-0">
            <IconComponent className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <span className="text-12 font-medium uppercase tracking-wider text-secondary">Sensor</span>
            <h3 className="text-16 font-semibold text-primary leading-tight">{meta.label}</h3>
          </div>
        </div>
        <Badge
          label={badgeLabel}
          variant={badgeVariant}
        />
      </div>

      {/* ── Row 2: 36px Hero Value ── */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span
            className="text-36 font-bold tracking-tight text-primary leading-none transition-opacity duration-200"
            style={{ opacity: isFlashing ? 0.7 : 1 }}
          >
            {valueFormatted}
          </span>
          <span className="text-14 font-medium text-secondary">
            {meta.unit}
          </span>
        </div>
      </div>

      {/* ── Row 3: Target Range Visualization ── */}
      <div className="my-2">
        <SensorRangeIndicator sensorKey={sensorKey} value={value} />
      </div>

      {/* ── Row 4: Subtle Trend Sparkline ── */}
      <div className="pt-2 mt-1 border-t border-[var(--border-subtle)]">
        <SparkLine data={sparkData} />
      </div>
    </div>
  );
}
