import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { getConfidenceMeta } from '../../utils/statusUtils';

/**
 * Visually dominant Water Quality summary panel with transparent ML confidence metadata.
 * @param {{ label: string, score: number, loading?: boolean }} props
 */
export default function PollutionStatusBanner({ label, score, loading }) {
  if (loading) {
    return (
      <div className="ui-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-pulse">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-32 rounded bg-[var(--bg-elevated)]" />
          <div className="h-9 w-64 rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-48 rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="w-full md:w-72 h-16 rounded bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  const isSafe = (label || '').toLowerCase() === 'safe' || (label || '').toLowerCase() === 'good';
  const isModerate = (label || '').toLowerCase() === 'moderate';

  const statusColor = isSafe ? '#16a34a' : isModerate ? '#d97706' : '#dc2626';
  const statusBg = isSafe ? 'rgba(22, 163, 74, 0.08)' : isModerate ? 'rgba(217, 119, 6, 0.08)' : 'rgba(220, 38, 38, 0.08)';
  const statusBorder = isSafe ? 'rgba(22, 163, 74, 0.25)' : isModerate ? 'rgba(217, 119, 6, 0.25)' : 'rgba(220, 38, 38, 0.25)';

  const displayLabel = label ? label.toUpperCase() : 'SAFE';
  const confidenceMeta = getConfidenceMeta(score);

  return (
    <div
      className="ui-card relative overflow-hidden"
      style={{
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Overall Water Quality Assessment */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}
          >
            {isSafe ? (
              <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
            ) : isModerate ? (
              <AlertTriangle className="w-6 h-6" strokeWidth={2} />
            ) : (
              <XCircle className="w-6 h-6" strokeWidth={2} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-12 font-medium tracking-wider uppercase text-secondary">
                Water Quality Assessment
              </span>
              <span
                className="text-12 font-semibold px-2 py-0.5 rounded-full uppercase"
                style={{ backgroundColor: statusBg, color: statusColor }}
              >
                {isSafe ? 'Compliant' : 'Attention Required'}
              </span>
            </div>

            <h2 className="text-36 font-bold tracking-tight text-primary leading-none">
              {displayLabel}
            </h2>

            <p className="text-14 text-secondary mt-2">
              Aggregated real-time classification derived from continuous multi-parameter telemetry.
            </p>
          </div>
        </div>

        {/* Right: Transparent Model Confidence Details */}
        <div className="w-full lg:w-72 flex-shrink-0 p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-12 font-medium text-secondary">Model Confidence</span>
            <span className="text-14 font-semibold text-primary">
              {confidenceMeta.percent}% <span className="text-12 font-normal text-secondary">· {confidenceMeta.rating}</span>
            </span>
          </div>

          {/* Clean confidence progress bar */}
          <div className="w-full h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${confidenceMeta.percent}%`,
                backgroundColor: confidenceMeta.color,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-12 pt-1 border-t border-[var(--border-subtle)] text-secondary">
            <span>Algorithm</span>
            <span className="font-medium text-primary">Random Forest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
