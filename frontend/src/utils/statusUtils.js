/**
 * Standard baseline reference thresholds for each sensor parameter.
 */
export const THRESHOLDS = {
  ph:            { min: 6.5,  max: 8.5,  unit: 'pH',  label: 'pH Level',          precision: 2, yDomain: [5.5, 9.5] },
  turbidity_ntu: { min: 0,    max: 4.0,  unit: 'NTU', label: 'Turbidity',         precision: 2, yDomain: [0, 6] },
  temperature_c: { min: 10,   max: 30,   unit: '°C',  label: 'Temperature',       precision: 1, yDomain: [15, 35] },
  h2s_ppm:       { min: 0,    max: 0.05, unit: 'ppm', label: 'H₂S Concentration', precision: 3, yDomain: [0, 0.07] },
};

/**
 * Robustly parses backend timestamps.
 * SQLite/FastAPI timestamps often lack the 'Z' UTC indicator; this ensures
 * UTC timestamps are not incorrectly treated as local time.
 * @param {string|number|Date} ts
 * @returns {Date|null}
 */
export function parseTimestamp(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number') return new Date(ts);
  
  let str = String(ts).trim();
  if (str.includes('T') || str.includes(' ')) {
    str = str.replace(' ', 'T');
    // If lacks UTC indicator 'Z' or offset '+05:30', append 'Z'
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
      str += 'Z';
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(ts) : d;
}

/**
 * Returns whether a sensor value is within the safe range.
 * @param {string} key
 * @param {number} value
 * @returns {boolean}
 */
export function isWithinRange(key, value) {
  const t = THRESHOLDS[key];
  if (!t || value == null) return true;
  return value >= t.min && value <= t.max;
}

/**
 * Returns "OK" (Normal) | "WARNING" (Approaching) | "CRITICAL" (Exceeded).
 * Based on 10% tolerance margin near boundaries.
 * @param {string} key
 * @param {number} value
 * @returns {"OK"|"WARNING"|"CRITICAL"}
 */
export function sensorStatus(key, value) {
  const t = THRESHOLDS[key];
  if (!t || value == null) return 'OK';
  const range = t.max - t.min;
  const margin = range * 0.1;
  
  if (value < t.min || value > t.max) {
    return 'CRITICAL';
  }
  if (value < t.min + margin || value > t.max - margin) {
    return 'WARNING';
  }
  return 'OK';
}

/**
 * Returns hex color according to sensor status.
 * @param {"OK"|"WARNING"|"CRITICAL"} status
 */
export function getStatusColor(status) {
  switch (status) {
    case 'OK': return '#16a34a';       // Green
    case 'WARNING': return '#d97706';  // Amber/Yellow
    case 'CRITICAL': return '#dc2626'; // Red
    default: return '#6b7280';         // Gray
  }
}

/**
 * Formats a sensor value with exact professional precision.
 * @param {string} key
 * @param {number} val
 */
export function formatSensorValue(key, val) {
  if (val == null || typeof val !== 'number' || isNaN(val)) return '—';
  const t = THRESHOLDS[key];
  const prec = t ? t.precision : 2;
  return val.toFixed(prec);
}

/**
 * Evaluates ML model confidence rating and text rating.
 * @param {number} score
 */
export function getConfidenceMeta(score) {
  const pct = Math.round((score ?? 0.85) * 100);
  let rating = 'Moderate';
  let badgeColor = '#d97706';

  if (pct >= 80) {
    rating = 'High';
    badgeColor = '#16a34a';
  } else if (pct < 50) {
    rating = 'Low';
    badgeColor = '#dc2626';
  }

  return {
    percent: pct,
    rating,
    color: badgeColor,
  };
}

/**
 * Formats a timestamp to HH:MM:SS in local time.
 * @param {string} ts
 * @returns {string}
 */
export function formatTime(ts) {
  if (!ts) return '--:--:--';
  const d = parseTimestamp(ts);
  return d ? d.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';
}

/**
 * Returns accurate relative time string: "just now", "12s ago", "2m ago", "1h ago".
 * @param {string} ts
 * @returns {string}
 */
export function relativeTime(ts) {
  if (!ts) return '';
  const d = parseTimestamp(ts);
  if (!d) return '';
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${Math.round(diff)} sec ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  const hrs = Math.round(diff / 3600);
  return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
}

/**
 * Returns hex color for a given pollution label.
 */
export function statusColor(label) {
  const l = (label || '').toLowerCase();
  if (l === 'good' || l === 'safe') return '#16a34a';
  if (l === 'moderate') return '#d97706';
  if (l === 'poor' || l === 'hazardous' || l === 'not safe') return '#dc2626';
  return '#6b7280';
}
