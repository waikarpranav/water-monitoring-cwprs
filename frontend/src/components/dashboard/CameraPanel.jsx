import { useState } from 'react';
import { Camera, RefreshCw, Video, VideoOff } from 'lucide-react';

/**
 * Camera panel for live ESP32-CAM stream and still capture,
 * conforming to strict design system.
 */
export default function CameraPanel() {
  const [cameraIp, setCameraIp] = useState('192.168.4.2');
  const [streamError, setStreamError] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Camera standby');

  const streamUrl = `http://${cameraIp}:81/stream`;
  const captureUrl = `http://${cameraIp}/capture`;

  const handleCapture = async () => {
    setCapturing(true);
    setStatusMessage('Capturing snapshot...');
    try {
      const res = await fetch(captureUrl);
      if (!res.ok) throw new Error('Capture request failed');
      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      setCapturedImage(imgUrl);
      setStatusMessage('Snapshot captured.');
    } catch (err) {
      console.error(err);
      setStatusMessage('Capture request failed. Verify camera network.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <section className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-24 font-bold text-primary">Live Optical Feed</h2>
        <p className="text-14 text-secondary mt-1">
          Real-time video feed and still frame capture from the underwater optical module.
        </p>
      </div>

      <div className="ui-card space-y-4">
        {/* Controls and IP Configuration */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <label className="text-12 font-medium uppercase tracking-wider text-secondary">
              Camera IP:
            </label>
            <input
              type="text"
              value={cameraIp}
              onChange={(e) => {
                setCameraIp(e.target.value);
                setStreamError(false);
              }}
              placeholder="e.g. 192.168.4.2"
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[8px] px-3 py-1.5 text-14 text-primary focus:outline-none focus:border-brand w-44"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStreamError(false)}
              className="flex items-center gap-1.5 text-12 font-medium bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-secondary hover:text-primary border border-[var(--border-subtle)] px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
              Reconnect
            </button>
            <button
              onClick={handleCapture}
              disabled={capturing}
              className="flex items-center gap-1.5 text-14 font-medium bg-[var(--brand-blue)] hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-[8px] transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" strokeWidth={2} />
              <span>{capturing ? 'Capturing...' : 'Capture Photo'}</span>
            </button>
          </div>
        </div>

        {/* Video feed viewport */}
        <div className="relative aspect-video w-full rounded-[12px] overflow-hidden bg-black border border-[var(--border-subtle)] flex items-center justify-center">
          {!streamError ? (
            <img
              src={streamUrl}
              alt="ESP32-CAM Video Stream"
              className="w-full h-full object-contain"
              onError={() => setStreamError(true)}
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-[12px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-[#dc2626]">
                <VideoOff className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="text-14 font-medium text-primary">Camera feed offline or unreachable</p>
              <p className="text-12 text-secondary max-w-md">
                Verify the ESP32-CAM node is powered and reachable at{' '}
                <span className="text-brand font-medium">{streamUrl}</span>.
              </p>
            </div>
          )}

          {/* Status badge overlay */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-12 text-white flex items-center gap-2 border border-white/10">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: !streamError ? '#16a34a' : '#dc2626',
              }}
            />
            <span className="font-semibold text-12">
              {!streamError ? 'LIVE MJPEG' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-12 text-secondary pt-1">
          <span>{statusMessage}</span>
          <span>Endpoint: {streamUrl}</span>
        </div>
      </div>

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="ui-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-16 font-semibold text-primary">Captured Snapshot</h3>
            <button
              onClick={() => setCapturedImage(null)}
              className="text-12 text-secondary hover:text-primary cursor-pointer font-medium"
            >
              Dismiss
            </button>
          </div>
          <div className="max-w-2xl rounded-[12px] overflow-hidden border border-[var(--border-subtle)] bg-black">
            <img src={capturedImage} alt="Captured snapshot" className="w-full object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}
