/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0e1a',
          card: '#111827',
          border: '#1f293d',
          accent: '#00BAF2', // Razorpay cyan
          blue: '#0C2340',   // Razorpay deep blue
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
