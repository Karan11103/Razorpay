/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        buildathon: {
          bg: '#07090E',          // Moody dark night background
          surface: '#0D111A',     // Card surface
          surfaceHover: '#131826',
          border: '#182030',      // Ultra-clean 1px border
          borderLight: '#222D42',
          cream: '#FBF7EE',       // Iconic Razorpay buildathon cream
          creamMuted: '#E5DFD1',
          creamDark: '#C9C2B0',
          blue: '#0C66E4',        // Razorpay accent blue
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          muted: '#6B7A90',
          subtext: '#9BA8BA',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
