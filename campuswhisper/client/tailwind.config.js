/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        ui: ['Outfit', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#0a0e1a',
        'bg-secondary': '#111827',
        'bg-card': '#1a2035',
        'accent-primary': '#7c6af7',
        'accent-sos': '#ef4444',
        'accent-ship': '#f59e0b',
        'accent-understood': '#10b981',
        'text-primary': '#e2e8f0',
        'text-muted': '#64748b',
        'border-color': '#1e293b',
      },
      animation: {
        'float-up': 'floatUp 20s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'noise': 'noise 0.5s steps(1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(100vh)', opacity: '0' },
          '10%': { opacity: '0.3' },
          '90%': { opacity: '0.3' },
          '100%': { transform: 'translateY(-100px)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px #ef4444, 0 0 20px #ef4444' },
          '50%': { boxShadow: '0 0 20px #ef4444, 0 0 60px #ef4444' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
