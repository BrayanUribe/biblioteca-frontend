/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{html,ts}",
];
export const theme = {
  extend: {
    colors: {
      crema: {
        50: '#fefaf6',
        100: '#fdf6f0',
        200: '#fae8d6',
        300: '#f5d4b3',
        400: '#e7c8a6',
        500: '#d4a574',
        600: '#b08c5a',
        700: '#8a6c47',
        800: '#6d5538',
        900: '#56432c',
      },
    },
    fontFamily: {
      'inter': ['Inter', 'sans-serif'],
    },
    animation: {
      'slide-down': 'slide-down 0.6s ease',
      'slide-up': 'slide-up 0.5s ease',
      'fade-in': 'fade-in 0.5s ease',
      'fade-in-row': 'fade-in-row 0.5s ease',
      'shake': 'shake 0.5s ease',
    },
    keyframes: {
      'slide-down': {
        from: { opacity: '0', transform: 'translateY(-20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'slide-up': {
        from: { opacity: '0', transform: 'translateY(20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'fade-in': {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      'fade-in-row': {
        from: { opacity: '0', transform: 'translateX(-10px)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      'shake': {
        '0%, 100%': { transform: 'translateX(0)' },
        '25%': { transform: 'translateX(-5px)' },
        '75%': { transform: 'translateX(5px)' },
      },
    }
  },
};
export const plugins = [];
