import { useMemo } from 'react';
import { Bell, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { THRESHOLDS, sensorStatus, formatTime } from '../../utils/statusUtils';

/**
 * Compact Recent Alerts section derived from real telemetry history.
 */
export default function RecentAlertsCard({ history = [] }) {
  // Analyze actual telemetry records to extract genuine threshold events
  const alerts = useMemo(() => {
    if (!history?.length) return [];

    const extracted = [];
    const reversed = [...history].reverse().slice(0, 50);

    for (const r of reversed) {
      const timeStr = r.timestamp ? formatTime(r.timestamp) : '';

      for (const [key, t] of Object.entries(THRESHOLDS)) {
        const val = r[key];
        if (val == null) continue;

        const status = sensorStatus(key, val);
        if (status === 'CRITICAL') {
          extracted.push({
            id: `${r.timestamp}-${key}-crit`,
            time: timeStr,
            type: 'critical',
            message: `${t.label} exceeded threshold`,
            detail: `${val.toFixed(t.precision)} ${t.unit}`,
          });
          break;
        } else if (status === 'WARNING') {
          extracted.push({
            id: `${r.timestamp}-${key}-warn`,
            time: timeStr,
            type: 'warning',
            message: `${t.label} approaching limit`,
            detail: `${val.toFixed(t.precision)} ${t.unit}`,
          });
          break;
        }
      }

      if (r.alert_triggered && (r.pollution_label || '').toLowerCase() === 'not safe') {
        extracted.push({
          id: `${r.timestamp}-ml`,
          time: timeStr,
          type: 'critical',
          message: 'AI hazard advisory',
          detail: 'Water quality not safe',
        });
      }

      if (extracted.length >= 6) break;
    }

    return extracted;
  }, [history]);

  return (
    <div className="ui-card flex h-[320px] max-h-[320px] flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-12 font-medium uppercase tracking-wider text-secondary">
          <Bell className="w-4 h-4 text-brand" strokeWidth={2} />
          <span>Recent Alerts</span>
        </div>
        <span className="text-12 text-secondary">
          {alerts.length > 0 ? `${alerts.length} Active` : 'Nominal'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {alerts.length > 0 ? (
          <div className="space-y-2.5 overflow-y-auto pr-1 min-h-0">
            {alerts.map(a => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 text-12 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2"
              >
                <span
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: a.type === 'critical' ? '#dc2626' : '#d97706',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate font-semibold text-primary">{a.message}</span>
                    <span className="flex-shrink-0 font-mono text-[11px] text-secondary">{a.time}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-secondary">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-[#16a34a]">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </div>
            <p className="text-14 font-semibold text-primary">No recent alerts</p>
            <p className="mt-0.5 text-12 text-secondary">
              All monitored parameters are within configured limits.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-12 text-secondary">
        <span>Threshold Mode: CPCB Regulatory</span>
        <span className="font-medium text-primary">Auto-evaluation Active</span>
      </div>
    </div>
  );
}
