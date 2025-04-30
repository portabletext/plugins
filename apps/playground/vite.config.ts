import path from 'node:path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]},
    }),
  ],
  resolve: {
    alias: {
      '@portabletext/plugin-one-line': path.resolve(
        __dirname,
        '../../plugins/one-line/src',
      ),
    },
  },
})
