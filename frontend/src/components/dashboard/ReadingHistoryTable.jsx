import { useState, useEffect, useRef } from 'react';
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Badge from '../ui/Badge';
import { relativeTime } from '../../utils/statusUtils';

const PAGE_SIZE = 10;

function SortIcon({ direction }) {
  if (!direction) return <ArrowUpDown className="w-3 h-3 text-secondary inline ml-1 opacity-50" strokeWidth={2} />;
  return direction === 'asc'
    ? <ArrowUp className="w-3 h-3 text-brand inline ml-1" strokeWidth={2} />
    : <ArrowDown className="w-3 h-3 text-brand inline ml-1" strokeWidth={2} />;
}

function exportCSV(data) {
  const headers = ['Timestamp', 'pH', 'Turbidity (NTU)', 'Temperature (C)', 'H2S (ppm)', 'Status', 'Score'];
  const rows = data.map(r => [
    r.timestamp,
    r.ph,
    r.turbidity_ntu,
    r.temperature_c,
    r.h2s_ppm,
    r.pollution_label,
    r.pollution_score,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cwrps-readings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Clean Reading History table conforming strictly to the design system:
 * - Inter font for all numbers and labels
 * - Fixed 12/14/16/24px type scale
 * - Lucide icons for sort and download
 * - Neutral borders and backgrounds
 * - ui-card standard styling
 */
export default function ReadingHistoryTable({ data = [], loading, newRowId }) {
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const prevDataLen = useRef(data.length);

  useEffect(() => {
    if (data.length > prevDataLen.current) {
      setPage(1);
    }
    prevDataLen.current = data.length;
  }, [data.length]);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === undefined) return 0;
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const COLS = [
    { key: 'timestamp', label: 'Time' },
    { key: 'ph', label: 'pH Level' },
    { key: 'turbidity_ntu', label: 'Turbidity (NTU)' },
    { key: 'temperature_c', label: 'Temp (°C)' },
    { key: 'h2s_ppm', label: 'H₂S (ppm)' },
    { key: 'pollution_label', label: 'Assessment' },
  ];

  if (loading) {
    return (
      <div className="ui-card space-y-4 animate-pulse">
        <div className="h-5 w-40 rounded bg-[var(--bg-elevated)]" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 rounded bg-[var(--bg-elevated)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="ui-card p-0! overflow-hidden">
      {/* Header (24px padding = px-6 py-4) */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div>
          <h3 className="text-16 font-semibold text-primary">Sensor Telemetry Log</h3>
          <p className="text-12 text-secondary mt-0.5">Showing last {data.length} records</p>
        </div>
        <button
          onClick={() => exportCSV(data)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-accent)] text-12 font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-14">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              {COLS.map(col => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-12 font-semibold uppercase tracking-wider text-secondary cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort(col.key)}
                >
                  <div className="flex items-center">
                    {col.label}
                    <SortIcon direction={sortKey === col.key ? sortDir : null} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-14 text-secondary">
                  No readings recorded yet
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const isNew = row.timestamp === newRowId;
                const isSafe = (row.pollution_label || '').toLowerCase() === 'safe';
                return (
                  <tr
                    key={row.timestamp ?? idx}
                    className={[
                      'hover:bg-[var(--bg-elevated)] transition-colors',
                      isNew ? 'bg-blue-50/50 dark:bg-blue-950/20' : '',
                    ].join(' ')}
                  >
                    <td className="px-6 py-3.5 text-12 text-secondary">
                      {relativeTime(row.timestamp)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-primary">
                      {row.ph != null ? row.ph.toFixed(2) : '—'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-primary">
                      {row.turbidity_ntu != null ? row.turbidity_ntu.toFixed(2) : '—'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-primary">
                      {row.temperature_c != null ? row.temperature_c.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-primary">
                      {row.h2s_ppm != null ? row.h2s_ppm.toFixed(4) : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={row.pollution_label ?? 'Safe'}
                        variant={isSafe ? 'safe' : 'danger'}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (strict 4px scale, 12px text) */}
      {totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-12 text-secondary">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-primary transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-primary transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
