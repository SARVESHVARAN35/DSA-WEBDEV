/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Intellexa design tokens — see src/index.css :root for the full list.
        ink: '#0B1330',        // deep navy background
        ink2: '#101B45',       // secondary panel navy
        cobalt: '#2451FF',     // primary electric-blue accent
        cobalt2: '#5B7CFF',    // lighter cobalt for hovers/gradients
        sky: '#E7ECFF',        // pale blue surface
        mist: '#F5F7FF',       // near-white app background
        teal: '#17C3B2',       // success / live accent
        amber: '#FFB020',      // sparing highlight for badges/streaks
        slateink: '#4B5876',   // muted text on light surfaces
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 27, 69, 0.06), 0 8px 24px -8px rgba(15, 27, 69, 0.12)',
        glow: '0 0 0 1px rgba(36,81,255,0.12), 0 12px 40px -12px rgba(36,81,255,0.45)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
