import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/**
 * Cohesive sparkline chart using the strict brand blue palette.
 */
export default function SparkLine({ data, color = '#2563eb' }) {
  if (!data || data.length < 2) {
    return <div className="h-8 w-full rounded bg-[var(--bg-elevated)] opacity-40 animate-pulse" />;
  }

  // Consistent brand color
  const strokeColor = '#2563eb';

  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="brand-sparkline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={1.5}
          fill="url(#brand-sparkline)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
