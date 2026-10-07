import { useState, useMemo } from 'react';
import { Droplets, Cpu, Radio } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import PollutionStatusBanner from '../components/dashboard/PollutionStatusBanner';
import SensorMetricCard from '../components/dashboard/SensorMetricCard';
import SensorChart from '../components/dashboard/SensorChart';
import ReadingHistoryTable from '../components/dashboard/ReadingHistoryTable';
import CameraPanel from '../components/dashboard/CameraPanel';
import LocationDeviceCard from '../components/dashboard/LocationDeviceCard';
import AIPredictionCard from '../components/dashboard/AIPredictionCard';
import RecentAlertsCard from '../components/dashboard/RecentAlertsCard';

const SENSOR_KEYS = ['ph', 'turbidity_ntu', 'temperature_c', 'h2s_ppm'];

/**
 * Commercial-grade Environmental IoT Dashboard:
 * 1. Overall Water Quality Status
 * 2. Real-time Multi-sensor Threshold Cards
 * 3. Telemetry Trend History Charts (Unclipped Y-axis, Intelligently-spaced X-axis, Current/Min/Avg/Max)
 * 4. Dedicated AI Prediction, Recent Alerts, and Deployment Node section
 */
export default function Dashboard({ latest, history, isConnected, theme, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Build sparkline data per sensor from last 20 history points
  const sparkData = useMemo(() => {
    const last20 = history.slice(-20);
    const result = {};
    for (const key of SENSOR_KEYS) {
      result[key] = last20.map(d => ({ value: d[key] ?? 0 }));
    }
    return result;
  }, [history]);

  // Count active alerts from telemetry history
  const alertCount = useMemo(() => {
    return history.slice(-50).filter(r => r.alert_triggered).length;
  }, [history]);

  const newRowId = latest?.timestamp;
  const loading = !latest;

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-primary">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConnected={isConnected}
        latest={latest}
        alertCount={alertCount}
        deviceId={latest?.device_id}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-6 md:px-8 lg:px-8">
          {activeTab === 'dashboard' && loading && (
            <div className="ui-card flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-[12px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center mb-4 text-brand">
                <Droplets className="w-6 h-6" strokeWidth={2} />
              </div>
              <h2 className="text-24 font-bold text-primary mb-2">Connecting Telemetry</h2>
              <p className="text-14 text-secondary mb-4">
                Waiting for the underwater sensor node to transmit readings over WebSocket...
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isConnected ? '#16a34a' : '#dc2626' }}
                />
                <span className="text-12 font-medium text-secondary">
                  {isConnected ? 'WebSocket link active' : 'Connecting to gateway...'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && !loading && (
            <div className="space-y-6">
              {/* 1. Visually Dominant Water Quality Assessment */}
              <PollutionStatusBanner
                label={latest.pollution_label}
                score={latest.pollution_score}
              />

              {/* 2. Sensor Metric Cards (Grid of 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {SENSOR_KEYS.map((key) => (
                  <SensorMetricCard
                    key={key}
                    sensorKey={key}
                    value={latest[key]}
                    sparkData={sparkData[key]}
                  />
                ))}
              </div>

              {/* 3. Historical Telemetry Charts (2x2 Grid) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {SENSOR_KEYS.map((key) => (
                  <SensorChart
                    key={key}
                    sensorKey={key}
                    data={history}
                  />
                ))}
              </div>

              {/* 4. Operational Oversight Grid: AI Prediction + Recent Alerts + Deployment Node */}
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                <AIPredictionCard latest={latest} />
                <RecentAlertsCard history={history} />
                <LocationDeviceCard
                  isConnected={isConnected}
                  latest={latest}
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-24 font-bold text-primary">Reading History</h2>
                <p className="text-14 text-secondary mt-1">
                  Historical telemetry log received during this active monitoring session.
                </p>
              </div>
              <ReadingHistoryTable data={history} newRowId={newRowId} />
            </section>
          )}

          {activeTab === 'camera' && (
            <CameraPanel />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel isConnected={isConnected} deviceId={latest?.device_id} />
          )}
        </main>
    </div>
  );
}

function SettingsPanel({ isConnected, deviceId }) {
  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-24 font-bold text-primary">System Settings</h2>
        <p className="text-14 text-secondary mt-1">
          Hardware and environmental configuration for this monitoring station.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="ui-card">
          <div className="flex items-center gap-2 text-12 font-medium uppercase tracking-wider text-secondary mb-2">
            <Cpu className="w-4 h-4 text-brand" strokeWidth={2} />
            <span>Target Node</span>
          </div>
          <p className="text-24 font-bold text-primary">{deviceId || 'ESP32-001'}</p>
          <p className="text-12 text-secondary mt-1">Primary telemetry device source</p>
        </div>

        <div className="ui-card">
          <div className="flex items-center gap-2 text-12 font-medium uppercase tracking-wider text-secondary mb-2">
            <Radio className="w-4 h-4 text-brand" strokeWidth={2} />
            <span>Telemetry Link</span>
          </div>
          <p
            className="text-24 font-bold"
            style={{ color: isConnected ? '#16a34a' : '#dc2626' }}
          >
            {isConnected ? 'Connected' : 'Offline'}
          </p>
          <p className="text-12 text-secondary mt-1">Real-time WebSocket connection</p>
        </div>
      </div>

      <div className="ui-card space-y-4">
        <div>
          <h3 className="text-16 font-semibold text-primary">Threshold Reference Limits</h3>
          <p className="text-12 text-secondary mt-1">
            Standard regulatory safe water quality parameters (CPCB / WHO).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-14 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-secondary">pH Range</span>
          <span className="font-semibold text-primary">6.50 – 8.50 pH</span>

          <span className="text-secondary">Turbidity Ceiling</span>
          <span className="font-semibold text-primary">0.00 – 4.00 NTU</span>

          <span className="text-secondary">Temperature Range</span>
          <span className="font-semibold text-primary">10.0 – 30.0 °C</span>

          <span className="text-secondary">H₂S Concentration Limit</span>
          <span className="font-semibold text-primary">0.00 – 0.05 ppm</span>
        </div>
      </div>
    </section>
  );
}
