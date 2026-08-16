export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      animation: {
        float: "float 4s ease-in-out infinite",
        pulseSlow: "pulse 3s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },

          "50%": {
            transform: "translateY(-5px)",
          },
        },
      },

      boxShadow: {
        card: "0 10px 30px rgba(15,23,42,0.08)",
        glow: "0 0 25px rgba(34,197,94,0.25)",
      },

      borderRadius: {
        xl2: "1.25rem",
      },

    },
  },

  plugins: [],
}