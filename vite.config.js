import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Must stay '/'. This deploys to the user site qiqi776.github.io, served
  // from the domain root. Switching to a project site (base: '/blog/') would
  // break all 28 post images: the markdown hardcodes absolute paths like
  // /go/gmp/1.png, and those end up in the JS bundle as post *content*. Vite
  // rewrites its own asset URLs when base changes, but never string literals
  // inside content. backgroundSchemes.js ('/bg-sakura.jpg') has the same shape.
  base: '/',
  plugins: [react()],
})
