import { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, LayoutDashboard, History, Video, Settings } from 'lucide-react';
import { formatTime, relativeTime } from '../../utils/statusUtils';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: History },
  { id: 'camera', label: 'Camera', icon: Video },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TopBar({
  activeTab,
  onTabChange,
  isConnected,
  latest,
  deviceId,
  theme = 'dark',
  onToggleTheme,
}) {
  const isLight = theme === 'light';
  const [, setTick] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const relTime = latest?.timestamp ? relativeTime(latest.timestamp) : 'Waiting…';
  const exactTime = latest?.timestamp ? formatTime(latest.timestamp) : '—';

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-5 lg:px-8">
        <div className="flex h-[64px] items-center gap-3 md:gap-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="flex min-w-0 items-center gap-2 leading-none md:gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand">CWPRS</span>
              <span className="text-sm font-semibold text-primary md:text-[15px]">Water Quality Monitor</span>
            </div>
            <span className="hidden items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] font-medium text-secondary md:inline-flex">
              {deviceId || 'ESP32-001'}
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  className={[
                    'inline-flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                    isActive
                      ? 'border border-blue-200 bg-blue-50 text-brand dark:border-blue-900/60 dark:bg-blue-950/40'
                      : 'text-secondary hover:bg-[var(--bg-elevated)] hover:text-primary',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: isConnected ? '#16a34a' : '#dc2626' }}
                aria-label={isConnected ? 'Device online' : 'Device offline'}
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: isConnected ? '#16a34a' : '#dc2626' }}
              >
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="hidden text-right lg:block">
              <div className="text-[10px] font-medium text-primary">Updated {relTime}</div>
              <div className="text-[9px] text-secondary">Last telemetry: {exactTime}</div>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[10px] font-medium text-secondary transition-colors hover:border-[var(--border-accent)] hover:text-primary"
            >
              {isLight ? <Moon className="h-3.5 w-3.5 text-brand" strokeWidth={2} /> : <Sun className="h-3.5 w-3.5 text-[#d97706]" strokeWidth={2} />}
              <span>{isLight ? 'Dark' : 'Light'}</span>
            </button>

            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[10px] font-bold text-brand">
              CW
            </div>

            <button
              type="button"
              aria-label="Toggle mobile navigation"
              className="inline-flex items-center justify-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-primary md:hidden"
              onClick={() => setMobileMenuOpen((value) => !value)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[var(--border-subtle)] py-2 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={[
                      'flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-sm font-medium',
                      isActive
                        ? 'bg-blue-50 text-brand dark:bg-blue-950/40'
                        : 'text-secondary hover:bg-[var(--bg-elevated)] hover:text-primary',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
