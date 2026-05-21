import { defineConfig } from 'vite'
import { loadEnv } from 'vite'

export default defineConfig({
  root: 'src',
  server: {
    port: 5173,
    open: true
  },
  define: {
    'import.meta.env': JSON.stringify(loadEnv('', process.cwd()))
  }
})
