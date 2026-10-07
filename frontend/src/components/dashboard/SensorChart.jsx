import { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Droplets, Thermometer, Wind } from 'lucide-react';
import { THRESHOLDS, formatSensorValue } from '../../utils/statusUtils';

const SENSOR_META = {
  ph:            { label: 'pH Level',          unit: 'pH',  icon: Activity },
  turbidity_ntu: { label: 'Turbidity',         unit: 'NTU', icon: Droplets },
  temperature_c: { label: 'Temperature',       unit: '°C',  icon: Thermometer },
  h2s_ppm:       { label: 'H₂S Concentration', unit: 'ppm', icon: Wind },
};

const TIME_RANGES = [
  { label: '5m',  minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '1h',  minutes: 60 },
  { label: '6h',  minutes: 360 },
  { label: '24h', minutes: 1440 },
  { label: '7d',  minutes: 10080 },
];

function formatXAxisTick(ms, rangeMinutes) {
  if (!ms || isNaN(ms)) return '';
  const date = new Date(ms);
  if (rangeMinutes <= 15) {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  if (rangeMinutes <= 1440) {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDurationShort(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !parts.length) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

function CustomTooltip({ active, payload, unit, sensorKey }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const val = item?.value;
  const rawTs = item?.payload?.timestamp;
  const timeStr = rawTs
    ? new Date(rawTs).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';
  const dateStr = rawTs
    ? new Date(rawTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[8px] p-3 shadow-md text-12">
      <div className="flex items-center justify-between gap-4 text-secondary mb-1">
        <span>{dateStr}</span>
        <span className="text-primary font-medium">{timeStr}</span>
      </div>
      <p className="font-bold text-primary text-14 mt-1">
        {formatSensorValue(sensorKey, val)} <span className="text-12 font-normal text-secondary">{unit}</span>
      </p>
    </div>
  );
}

/**
 * Industrial-grade Sensor Chart:
 * - Dynamic, unclipped Y-axis with sensor-specific precision
 * - Intelligently spaced, non-repeating X-axis timestamps
 * - Current | Min | Avg | Max balanced 4-column statistics
 * - Full 5m | 15m | 1h | 6h | 24h | 7d range selection
 */
export default function SensorChart({ sensorKey, data = [], loading }) {
  const [rangeMinutes, setRangeMinutes] = useState(15);
  const meta = SENSOR_META[sensorKey];
  const threshold = THRESHOLDS[sensorKey];

  const { chartData, xTicks, minTime, maxTime, coverageLabel } = useMemo(() => {
    const now = Date.now();
    const requestedStart = now - rangeMinutes * 60 * 1000;

    if (!data?.length) {
      return {
        chartData: [],
        xTicks: [],
        minTime: requestedStart,
        maxTime: now,
        coverageLabel: 'No data available',
      };
    }

    const parsed = data
      .map(d => ({
        ...d,
        timestampMs: d.timestamp ? new Date(d.timestamp).getTime() : 0,
      }))
      .filter(d => d.timestampMs > 0)
      .sort((a, b) => a.timestampMs - b.timestampMs);

    const withinRange = parsed.filter(d => d.timestampMs >= requestedStart && d.timestampMs <= now);

    if (!withinRange.length) {
      return {
        chartData: [],
        xTicks: [],
        minTime: requestedStart,
        maxTime: now,
        coverageLabel: 'No telemetry available',
      };
    }

    const availableStart = withinRange[0].timestampMs;
    const availableEnd = withinRange[withinRange.length - 1].timestampMs;
    const availableMs = availableEnd - availableStart;
    const requestedMs = now - requestedStart;
    const shouldUseActualWindow = availableMs < requestedMs * 0.9;

    const domainStart = shouldUseActualWindow ? availableStart : requestedStart;
    const domainEnd = shouldUseActualWindow ? availableEnd : now;

    const padMs = Math.max(30000, (domainEnd - domainStart) * 0.08);
    const finalMin = domainStart - padMs;
    const finalMax = domainEnd + padMs;

    const tickCount = Math.min(5, Math.max(2, withinRange.length));
    const ticks = [];
    for (let i = 0; i < tickCount; i++) {
      const t = Math.round(finalMin + (i / (tickCount - 1)) * (finalMax - finalMin));
      ticks.push(t);
    }

    const coverageLabel = requestedMs <= availableMs + 1000
      ? `${TIME_RANGES.find(r => r.minutes === rangeMinutes)?.label || `${rangeMinutes}m`} · Full range`
      : `${TIME_RANGES.find(r => r.minutes === rangeMinutes)?.label || `${rangeMinutes}m`} · Showing ${formatDurationShort(availableMs)} available`;

    return {
      chartData: withinRange,
      xTicks: ticks,
      minTime: finalMin,
      maxTime: finalMax,
      coverageLabel,
    };
  }, [data, rangeMinutes]);

  // Compute balanced statistics: Current, Min, Avg, Max
  const stats = useMemo(() => {
    const vals = chartData.map(d => d[sensorKey]).filter(v => v != null && !isNaN(v));
    if (!vals.length) return null;

    const current = vals[vals.length - 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

    return {
      current: formatSensorValue(sensorKey, current),
      min: formatSensorValue(sensorKey, min),
      avg: formatSensorValue(sensorKey, avg),
      max: formatSensorValue(sensorKey, max),
    };
  }, [chartData, sensorKey]);

  // Compute dynamic unclipped Y-axis domain
  const yDomain = useMemo(() => {
    const vals = chartData.map(d => d[sensorKey]).filter(v => v != null && !isNaN(v));
    if (!vals.length) return ['auto', 'auto'];

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    if (sensorKey === 'ph') {
      return [
        Math.max(0, Math.floor((min - 0.4) * 2) / 2),
        Math.min(14, Math.ceil((max + 0.4) * 2) / 2),
      ];
    }
    if (sensorKey === 'turbidity_ntu') {
      return [0, Math.max(4, Math.ceil(max + 1))];
    }
    if (sensorKey === 'temperature_c') {
      return [Math.floor(min - 2), Math.ceil(max + 2)];
    }
    if (sensorKey === 'h2s_ppm') {
      return [0, Math.max(0.05, Number((max * 1.3).toFixed(3)))];
    }
    return ['auto', 'auto'];
  }, [chartData, sensorKey]);

  if (loading || !meta) {
    return (
      <div className="ui-card flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-32 rounded bg-[var(--bg-elevated)]" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-6 w-8 rounded bg-[var(--bg-elevated)]" />
            ))}
          </div>
        </div>
        <div className="h-[220px] rounded-[8px] bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  const IconComponent = meta.icon;
  const brandColor = '#2563eb';
  const gradId = `chart-grad-${sensorKey}`;

  return (
    <div className="ui-card flex h-[360px] max-h-[360px] flex-col justify-between overflow-hidden">
      {/* Header with Title and Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-brand">
            <IconComponent className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-16 font-semibold text-primary leading-tight">
              {meta.label}
            </h3>
            <span className="text-12 text-secondary">Historical Telemetry</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-[8px] border border-[var(--border-subtle)] overflow-x-auto">
            {TIME_RANGES.map(r => {
              const isActive = rangeMinutes === r.minutes;
              return (
                <button
                  key={r.label}
                  onClick={() => setRangeMinutes(r.minutes)}
                  className={[
                    'px-2.5 py-1 rounded-[6px] text-12 font-medium transition-colors cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-[var(--brand-blue)] text-white shadow-xs'
                      : 'text-secondary hover:text-primary hover:bg-[var(--bg-surface)]',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {chartData.length > 0 && (
            <span className="text-[10px] text-secondary">{coverageLabel}</span>
          )}
        </div>
      </div>

      {/* Chart Canvas: Height 220px, left margin 8 + width 48 ensures ZERO label clipping */}
      <div className="w-full my-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 8, bottom: 4 }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={brandColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={brandColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                horizontal={true}
                vertical={false}
                stroke="var(--border-subtle)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="timestampMs"
                type="number"
                domain={[minTime, maxTime]}
                ticks={xTicks}
                tickFormatter={(ms) => formatXAxisTick(ms, rangeMinutes)}
                tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-subtle)' }}
              />
              <YAxis
                domain={yDomain}
                tickFormatter={(val) => {
                  if (sensorKey === 'h2s_ppm') return val.toFixed(3);
                  return val.toFixed(1);
                }}
                tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip unit={meta.unit} sensorKey={sensorKey} />} />
              {threshold && (
                <>
                  <ReferenceLine
                    y={threshold.min}
                    stroke="#9ca3af"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{ value: `Min ${threshold.min}`, position: 'insideTopLeft', fontSize: 10, fill: '#6b7280' }}
                  />
                  <ReferenceLine
                    y={threshold.max}
                    stroke="#9ca3af"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{ value: `Max ${threshold.max}`, position: 'insideTopLeft', fontSize: 10, fill: '#6b7280' }}
                  />
                </>
              )}
              <Area
                type="monotone"
                dataKey={sensorKey}
                stroke="none"
                fill={`url(#${gradId})`}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={sensorKey}
                stroke={brandColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center text-center text-14 text-secondary px-4">
            <p className="font-medium text-primary">No telemetry available</p>
            <p className="mt-1">No readings were recorded during this period.</p>
          </div>
        )}
      </div>

      {/* Balanced 4-column statistics: Current | Min | Avg | Max */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-[var(--border-subtle)] text-center">
          <div>
            <span className="block text-12 text-secondary">Current</span>
            <span className="text-14 font-bold text-primary">
              {stats.current} <span className="text-12 font-normal text-secondary">{meta.unit}</span>
            </span>
          </div>
          <div>
            <span className="block text-12 text-secondary">Min</span>
            <span className="text-14 font-semibold text-primary">
              {stats.min} <span className="text-12 font-normal text-secondary">{meta.unit}</span>
            </span>
          </div>
          <div>
            <span className="block text-12 text-secondary">Avg</span>
            <span className="text-14 font-semibold text-primary">
              {stats.avg} <span className="text-12 font-normal text-secondary">{meta.unit}</span>
            </span>
          </div>
          <div>
            <span className="block text-12 text-secondary">Max</span>
            <span className="text-14 font-semibold text-primary">
              {stats.max} <span className="text-12 font-normal text-secondary">{meta.unit}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
