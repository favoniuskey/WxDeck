/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f7fa',
          100: '#e4e8ef',
          200: '#c6cfdb',
          300: '#9aa8bd',
          400: '#6f8099',
          500: '#52617a',
          600: '#3f4c61',
          700: '#2f3a4b',
          800: '#1f2734',
          900: '#121821',
          950: '#0a0e15'
        },
        accent: {
          DEFAULT: '#60a5fa',
          warm: '#fbbf24',
          danger: '#f87171',
          ok: '#4ade80'
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Segoe UI Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace']
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};
