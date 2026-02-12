/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Sinapse Edu (Sutil e Profissional)
        primary: {
          DEFAULT: '#2563EB', // Azul Royal (Ação principal)
          hover: '#1D4ED8',
          light: '#DBEAFE',   // Fundo suave
        },
        secondary: {
          DEFAULT: '#10B981', // Verde Esmeralda (Sucesso/Evolução)
          hover: '#059669',
        },
        background: '#F8FAFC', // Cinza muito claro (para não cansar a vista)
        surface: '#FFFFFF',    // Branco puro para cartões
        text: {
          primary: '#1E293B',   // Cinza escuro (leitura)
          secondary: '#64748B', // Cinza médio (legendas)
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Fonte moderna e legível
      }
    },
  },
  plugins: [],
}