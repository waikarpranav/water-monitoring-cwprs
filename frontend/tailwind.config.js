/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1e',
          900: '#111827',
          800: '#1a2235',
          700: '#1f2d40',
          600: '#2a3f5f',
        },
        sensor: {
          ph:          '#60a5fa',
          turbidity:   '#34d399',
          temperature: '#fb923c',
          gas:         '#c084fc',
        },
        status: {
          good:      '#10b981',
          moderate:  '#f59e0b',
          poor:      '#f97316',
          hazardous: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-dot':   'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fade-in 0.3s ease-out forwards',
        'slide-in':    'slide-in 0.4s ease-out forwards',
        'glow-hazard': 'glow-hazard 2s ease-in-out infinite',
        'value-flash': 'value-flash 0.5s ease-out forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(1.3)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-hazard': {
          '0%, 100%': { boxShadow: '0 0 0px rgba(239,68,68,0)' },
          '50%':      { boxShadow: '0 0 32px rgba(239,68,68,0.4)' },
        },
        'value-flash': {
          '0%':   { backgroundColor: 'rgba(59,130,246,0.25)', transform: 'scale(1.05)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        card:         '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px #1f2d40',
        'card-hover': '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px #2a3f5f',
        glow:         '0 0 24px rgba(59,130,246,0.25)',
      },
    },
  },
  plugins: [],
}
