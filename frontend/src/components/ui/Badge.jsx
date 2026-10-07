/**
 * Reusable status badge / pill component conforming to the strict design system.
 * Only semantic colors (#16A34A green, #DC2626 red, #D97706 amber) or neutral.
 * Fixed 12px font size.
 */
export default function Badge({ label, variant = 'ok', size = 'sm' }) {
  const normalizedVariant = (() => {
    switch (variant) {
      case 'ok':
      case 'good':
      case 'live':
      case 'safe':
        return 'safe';
      case 'warning':
      case 'moderate':
        return 'warning';
      case 'critical':
      case 'hazardous':
      case 'poor':
      case 'not safe':
      case 'offline':
        return 'danger';
      default:
        return 'muted';
    }
  })();

  const variantStyles = {
    safe: {
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      color: '#16a34a',
      borderColor: 'rgba(22, 163, 74, 0.25)',
    },
    danger: {
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      color: '#dc2626',
      borderColor: 'rgba(220, 38, 38, 0.25)',
    },
    warning: {
      backgroundColor: 'rgba(217, 119, 6, 0.1)',
      color: '#d97706',
      borderColor: 'rgba(217, 119, 6, 0.25)',
    },
    muted: {
      backgroundColor: 'var(--bg-elevated)',
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-subtle)',
    },
  };

  const currentStyle = variantStyles[normalizedVariant] || variantStyles.muted;

  return (
    <span
      style={currentStyle}
      className="inline-flex items-center text-12 font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border"
    >
      {label}
    </span>
  );
}
