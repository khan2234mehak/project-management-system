/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ink scale — the dark "control room" base used for the sidebar,
        // headers, and dark-mode surfaces.
        ink: {
          950: '#0B0E14',
          900: '#11151D',
          800: '#181D27',
          700: '#222836',
          600: '#2E3548',
          500: '#3D4458',
          400: '#5B6478',
          300: '#8A92A6',
          200: '#B8BFCE',
          100: '#E2E5EC',
          50: '#F4F5F8',
        },
        // Signal amber — the single accent color used for primary actions,
        // active states, and "this needs attention" cues.
        signal: {
          600: '#B8580A',
          500: '#E0700D',
          400: '#F0923B',
          300: '#F7B36E',
          100: '#FDEEDC',
        },
        // Status tokens map 1:1 to task/project statuses, used consistently
        // across Kanban chips, badges, and charts.
        status: {
          backlog: '#8A92A6',
          todo: '#3D7FE0',
          progress: '#E0700D',
          review: '#9456D6',
          done: '#1F9E6B',
        },
        priority: {
          low: '#5B9E6B',
          medium: '#3D7FE0',
          high: '#E0700D',
          critical: '#D8395B',
        },
      },
      fontFamily: {
        display: ['"Lexend"', '"Inter"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 14, 20, 0.06), 0 1px 1px rgba(11, 14, 20, 0.04)',
        'card-hover': '0 4px 12px rgba(11, 14, 20, 0.10), 0 2px 4px rgba(11, 14, 20, 0.06)',
        popover: '0 8px 24px rgba(11, 14, 20, 0.16)',
      },
      borderRadius: {
        card: '10px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
