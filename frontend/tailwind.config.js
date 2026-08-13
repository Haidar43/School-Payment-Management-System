/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#17324D',
          light: '#1E4060',
          dark: '#0F2438',
        },
        accent: {
          DEFAULT: '#0F766E',
          light: '#14A89B',
          dark: '#0A5A54',
        },
        background: '#F7F8F7',
        surface: '#FFFFFF',
        border: '#E4E7EC',
        text: {
          primary: '#17202A',
          secondary: '#667085',
        },
        status: {
          paid: '#15803D',
          partial: '#B45309',
          unpaid: '#B42318',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        full: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.07)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}