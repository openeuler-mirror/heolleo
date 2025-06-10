import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { OpenDesignResolver } from '@computing/opendesign2/themes/plugins/resolver'
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        OpenDesignResolver(ElementPlusResolver, { importStyle: 'sass' })
      ],
      imports: [
        'vue'
      ]
    }),
    Components({
      resolvers: [OpenDesignResolver(ElementPlusResolver, { importStyle: 'sass' })]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        {
          name: 'disable-crypto',
          resolveId(source) {
            if (source === 'crypto') {
              return false
            }
          }
        }
      ]
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  define: {
    'process.env': {},
    global: {}
  }
})
