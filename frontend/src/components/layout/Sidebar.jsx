import { useState } from 'react';
import { LayoutDashboard, History, Video, Settings, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history',   label: 'History',   icon: History },
  { id: 'camera',    label: 'Camera',    icon: Video },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

/**
 * Minimalist collapsible sidebar conforming to strict design system.
 * Resizes dynamically and shifts dashboard content without overlaying.
 */
export default function Sidebar({
  activeTab,
  onTabChange,
  isConnected,
  deviceId,
  expanded: controlledExpanded,
  onToggleExpanded,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggle = onToggleExpanded || (() => setInternalExpanded(!internalExpanded));

  return (
    <aside
      className={[
        'fixed top-0 left-0 h-full z-40 flex flex-col',
        'bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]',
        'transition-all duration-200 ease-in-out',
        isExpanded ? 'w-56' : 'w-16',
      ].join(' ')}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--border-subtle)]">
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-brand hover:border-[var(--border-accent)] transition-colors cursor-pointer flex-shrink-0"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Droplets className="w-4 h-4 text-brand" strokeWidth={2} />
        </button>
        {isExpanded && (
          <span className="font-bold text-16 tracking-tight text-primary whitespace-nowrap">
            CWPRS
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={[
                'flex items-center gap-3 rounded-[8px] px-3 py-2.5 w-full text-left text-14 font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-brand border border-blue-200 dark:border-blue-900/60 font-semibold'
                  : 'text-secondary hover:text-primary hover:bg-[var(--bg-elevated)] border border-transparent',
              ].join(' ')}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              {isExpanded && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Device Status */}
      <div className="border-t border-[var(--border-subtle)] p-3">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: isConnected ? '#16a34a' : '#dc2626',
            }}
          />
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-12 font-medium text-primary truncate leading-none">
                {deviceId || 'ESP32-001'}
              </p>
              <p
                className="text-[11px] font-semibold tracking-wider uppercase mt-1 leading-none"
                style={{
                  color: isConnected ? '#16a34a' : '#dc2626',
                }}
              >
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
