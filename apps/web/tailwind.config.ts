import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — soft emerald/teal
        primary: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Secondary — mint/sky
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        // Background — icy white / cool gray
        surface: {
          base: '#f8fafc',
          subtle: '#f1f5f9',
          muted: '#e2e8f0',
          card: 'rgba(255,255,255,0.85)',
          frost: 'rgba(255,255,255,0.70)',
          'frost-dark': 'rgba(248,250,252,0.80)',
        },
        // Text — dark slate, never pure black
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#475569',
          tertiary: '#94a3b8',
          disabled: '#cbd5e1',
        },
        // Status
        status: {
          live: '#16a34a',
          'live-bg': '#dcfce7',
          reported: '#d97706',
          'reported-bg': '#fef3c7',
          terminal: '#2563eb',
          'terminal-bg': '#dbeafe',
          offline: '#94a3b8',
          'offline-bg': '#f1f5f9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        frost: '0 4px 24px -4px rgba(20,184,166,0.10), 0 1px 4px -1px rgba(0,0,0,0.06)',
        'frost-md': '0 8px 32px -8px rgba(20,184,166,0.15), 0 2px 8px -2px rgba(0,0,0,0.08)',
        'frost-lg': '0 16px 48px -12px rgba(20,184,166,0.18), 0 4px 16px -4px rgba(0,0,0,0.10)',
        card: '0 2px 12px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        nav: '0 1px 0 rgba(226,232,240,0.8), 0 4px 16px rgba(0,0,0,0.04)',
        float: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.6', transform: 'scale(1.4)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}

export default config
