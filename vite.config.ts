import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Roda no Node durante o build (não é afetado pelo drop de console do
// bundle): avisa, sem falhar, se a URL do back estiver ausente ou sem HTTPS.
function avisarApiUrl(mode: string) {
  const url = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL?.trim()
  if (!url) {
    console.warn(
      '\n[AVISO] VITE_API_URL não definida: o front publicado não vai conseguir falar com o back. ' +
        'Configure-a na Vercel e gere o build de novo.\n',
    )
  } else if (!url.startsWith('https://')) {
    console.warn('\n[AVISO] VITE_API_URL não começa com https://: em produção o back precisa ser acessado por HTTPS.\n')
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') avisarApiUrl(mode)

  return {
    plugins: [react()],
    // Produção: sem sourcemap (o DevTools não mostra o código-fonte nem os
    // caminhos dos arquivos) e sem console.*/debugger no bundle.
    build: {
      sourcemap: false,
    },
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,
    server: {
      proxy: {
        '/backend-api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend-api/, ''),
        },
      },
    },
  }
})
