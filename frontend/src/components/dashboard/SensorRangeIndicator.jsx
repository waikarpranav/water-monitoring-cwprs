import { THRESHOLDS, sensorStatus, getStatusColor, formatSensorValue } from '../../utils/statusUtils';

/**
 * High-precision sensor threshold and range visualization.
 * Visually communicates where the current value sits relative to configured acceptable limits:
 * min ─────────── ● ─────────── max
 *                 value
 */
export default function SensorRangeIndicator({ sensorKey, value }) {
  const threshold = THRESHOLDS[sensorKey];
  if (!threshold) return null;

  const { min, max, unit } = threshold;
  const numVal = typeof value === 'number' ? value : null;

  // Exact relative position calculation clamped to 0–100%
  const span = max - min || 1;
  const pct = numVal != null
    ? Math.min(100, Math.max(0, ((numVal - min) / span) * 100))
    : 50;

  const status = numVal != null ? sensorStatus(sensorKey, numVal) : 'OK';
  const color = getStatusColor(status);

  const statusLabel = (() => {
    switch (status) {
      case 'CRITICAL': return numVal > max ? 'Above Limit' : 'Below Limit';
      case 'WARNING': return 'Near Boundary';
      default: return 'Normal Range';
    }
  })();

  // Prevent current value pill from clipping on extreme edges
  const clampedLabelPct = Math.min(88, Math.max(12, pct));

  return (
    <div className="w-full select-none">
      {/* Top Header: Target Range label & Semantic Status */}
      <div className="flex items-center justify-between text-12 mb-2">
        <span className="font-medium text-secondary">
          Target Range
        </span>
        <span
          className="font-semibold text-12 transition-colors duration-200"
          style={{ color }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Track & Marker Container */}
      <div className="relative pt-1 pb-4">
        {/* Baseline Range Track */}
        <div className="relative h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
          {/* Subtle safe zone band */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
            }}
          />
        </div>

        {/* Current Value Marker (●) */}
        {numVal != null && (
          <div
            className="absolute top-1 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
            style={{ left: `${pct}%` }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-surface)] shadow-sm"
              style={{ backgroundColor: color }}
            />
          </div>
        )}

        {/* Current Value Tooltip/Label positioned at marker */}
        {numVal != null && (
          <div
            className="absolute top-3.5 -translate-x-1/2 transition-all duration-300 ease-out pointer-events-none"
            style={{ left: `${clampedLabelPct}%` }}
          >
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded shadow-xs"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color,
                border: `1px solid var(--border-subtle)`,
              }}
            >
              {formatSensorValue(sensorKey, numVal)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Range Limits */}
      <div className="flex items-center justify-between text-12 text-secondary pt-1">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
