/**
 * Reusable dark glass card wrapper with hover lift.
 * @param {{ children: React.ReactNode, className?: string, noPad?: boolean, onClick?: () => void }} props
 */
export default function Card({ children, className = '', noPad = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-2xl border border-navy-700 bg-navy-900',
        'shadow-card hover:shadow-card-hover hover:-translate-y-0.5',
        'transition-all duration-200 ease-out',
        noPad ? '' : 'p-6',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
