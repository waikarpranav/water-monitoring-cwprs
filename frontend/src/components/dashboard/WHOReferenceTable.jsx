import Badge from '../ui/Badge';
import { THRESHOLDS, isWithinRange, statusColor } from '../../utils/statusUtils';

const PARAM_META = {
  ph: {
    label: 'pH',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
      </svg>
    ),
    color: '#60a5fa',
  },
  turbidity_ntu: {
    label: 'Turbidity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
    color: '#34d399',
  },
  temperature_c: {
    label: 'Temperature',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    ),
    color: '#fb923c',
  },
  h2s_ppm: {
    label: 'H2S',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M8 3s-.5 3 2 3 2.5-3 5-3 2 3 2 3" />
        <path d="M8 21s-.5-3 2-3 2.5 3 5 3 2-3 2-3" />
      </svg>
    ),
    color: '#c084fc',
  },
};

/**
 * WHO / CPCB safety standards table.
 * @param {{ latest: object|null, loading?: boolean }} props
 */
export default function WHOReferenceTable({ latest, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-5 animate-pulse">
        <div className="h-4 w-48 rounded bg-navy-800 mb-4" />
        {[1,2,3,4].map(i => <div key={i} className="h-9 rounded bg-navy-800 mb-2" />)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-900 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 hover:border-navy-600 transition-all duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-navy-700 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-[#f0f4ff]">WHO / CPCB Safety Standards</h3>
        <div className="group relative ml-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-[#4a5568] cursor-help">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div className="absolute left-5 top-0 w-56 bg-navy-800 border border-navy-700 rounded-xl p-3 text-[0.7rem] text-[#8899aa] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-card">
            Reference values based on WHO Drinking Water Quality Guidelines and CPCB standards.
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="text-left px-5 py-2.5 text-[#4a5568] font-semibold tracking-wider uppercase text-[0.6rem]">Parameter</th>
            <th className="text-left px-4 py-2.5 text-[#4a5568] font-semibold tracking-wider uppercase text-[0.6rem]">Safe Range</th>
            <th className="text-left px-4 py-2.5 text-[#4a5568] font-semibold tracking-wider uppercase text-[0.6rem]">Current</th>
            <th className="text-left px-4 py-2.5 text-[#4a5568] font-semibold tracking-wider uppercase text-[0.6rem]">Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(THRESHOLDS).map(([key, t], idx) => {
            const meta = PARAM_META[key];
            const value = latest?.[key];
            const inRange = value != null ? isWithinRange(key, value) : null;
            const displayVal = value != null
              ? (key === 'h2s_ppm' ? value.toFixed(3) : value.toFixed(2))
              : '--';

            return (
              <tr
                key={key}
                className={[
                  'border-b border-navy-700 last:border-0',
                  'hover:bg-navy-800 transition-colors',
                  idx % 2 === 0 ? 'bg-navy-900' : 'bg-[#0f1729]',
                ].join(' ')}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: meta?.color ?? '#8899aa' }}>{meta?.icon}</span>
                    <span className="font-medium text-[#f0f4ff]">{meta?.label ?? t.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[#8899aa]">
                  {t.min} – {t.max} {t.unit}
                </td>
                <td
                  className="px-4 py-3 font-mono font-semibold"
                  style={{ color: inRange === null ? '#8899aa' : inRange ? '#10b981' : '#ef4444' }}
                >
                  {displayVal} {value != null ? t.unit : ''}
                </td>
                <td className="px-4 py-3">
                  {inRange === null ? (
                    <Badge label="--" variant="muted" />
                  ) : (
                    <Badge label={inRange ? 'OK' : 'ALERT'} variant={inRange ? 'ok' : 'critical'} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
