module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },
    extend: {
      colors: {
        primary: '#3b82f6',
        background: '#f8fafc',
        card: '#ffffff',
      },
    },
  },
  plugins: [],
}; 