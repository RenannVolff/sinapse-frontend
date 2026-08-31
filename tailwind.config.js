import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Sinapse Edu (Identidade própria: petróleo clínico + âmbar de destaque)
        primary: {
          DEFAULT: '#1F5A56', // Petróleo profundo (Ação principal)
          hover: '#164541',
          light: '#E4EEED',   // Fundo suave em tom petróleo
        },
        accent: {
          DEFAULT: '#D97A3F', // Âmbar (destaque de evolução/sucesso, uso moderado)
          hover: '#C2652D',
        },
        background: '#FAF9F6', // Cinza-branco levemente quente
        surface: '#FFFFFF',    // Branco puro para cartões
        text: {
          primary: '#292420',   // Grafite quente (leitura)
          secondary: '#6B6560', // Cinza médio quente (legendas)
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],   // Corpo/dados
        display: ['Fraunces', 'serif'],  // Títulos de destaque
      }
    },
  },
  plugins: [tailwindcssAnimate],
}