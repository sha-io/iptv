import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [solid(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      '@libs/m3u': '/libs/m3u/src'
    }
  }
})
