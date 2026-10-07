import { BrainCircuit, Cpu, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { formatTime, getConfidenceMeta } from '../../utils/statusUtils';

/**
 * Dedicated professional AI Water Quality Prediction card.
 * Highlights the Random Forest classification engine, confidence, and timestamp.
 */
export default function AIPredictionCard({ latest }) {
  if (!latest) {
    return (
      <div className="ui-card flex h-full min-h-[220px] flex-col justify-between">
        <div className="flex items-center gap-2 text-12 font-medium uppercase tracking-wider text-secondary mb-2">
          <BrainCircuit className="w-4 h-4 text-brand" strokeWidth={2} />
          <span>AI Water Quality Prediction</span>
        </div>
        <p className="text-14 text-secondary py-4">No prediction available yet</p>
      </div>
    );
  }

  const label = latest.pollution_label || 'Safe';
  const isSafe = label.toLowerCase() === 'safe' || label.toLowerCase() === 'good';
  const confidenceMeta = getConfidenceMeta(latest.pollution_score);
  const timeStr = latest.timestamp ? formatTime(latest.timestamp) : '—';

  return (
    <div className="ui-card flex h-full min-h-[220px] flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-12 font-medium uppercase tracking-wider text-secondary">
            <BrainCircuit className="w-4 h-4 text-brand" strokeWidth={2} />
            <span>AI Water Quality Prediction</span>
          </div>
          <span
            className="text-12 font-semibold px-2 py-0.5 rounded-full uppercase"
            style={{
              backgroundColor: isSafe ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              color: isSafe ? '#16a34a' : '#dc2626',
            }}
          >
            {isSafe ? 'Normal Status' : 'Anomaly Detected'}
          </span>
        </div>

        {/* Prediction Headline */}
        <div className="flex items-baseline gap-3 my-2">
          <span className="text-24 font-bold text-primary">
            {label.toUpperCase()}
          </span>
          <span className="text-14 text-secondary">
            Pollution Index
          </span>
        </div>
      </div>

      {/* Structured Technical Metadata Grid */}
      <div className="grid grid-cols-3 gap-3 pt-3 mt-3 border-t border-[var(--border-subtle)] text-12">
        <div>
          <span className="block text-secondary">Model Architecture</span>
          <span className="font-semibold text-primary text-14 mt-0.5 block truncate">Random Forest</span>
        </div>
        <div>
          <span className="block text-secondary">Inference Confidence</span>
          <span className="font-semibold text-primary text-14 mt-0.5 block">
            {confidenceMeta.percent}% <span className="text-12 font-normal text-secondary">({confidenceMeta.rating})</span>
          </span>
        </div>
        <div>
          <span className="block text-secondary">Last Prediction</span>
          <span className="font-semibold text-primary text-14 mt-0.5 block font-mono">{timeStr}</span>
        </div>
      </div>
    </div>
  );
}
