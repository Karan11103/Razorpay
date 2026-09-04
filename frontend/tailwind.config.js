/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rzp: {
          bg: '#090D16',         // Deep enterprise canvas
          surface: '#0F1626',    // Card background
          surfaceHover: '#141D30',
          border: '#1E293B',     // Subtle 1px dividing border
          borderLight: '#334155',
          blue: '#0C66E4',       // Official Razorpay corporate blue
          blueHover: '#0052CC',
          blueLight: 'rgba(12, 102, 228, 0.08)',
          navy: '#0C2340',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#64748B',
          text: '#F8FAFC',
          subtext: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
