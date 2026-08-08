/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      // Repoints `font-mono` at the same stack the article code blocks use.
      // Without this, Tailwind's own default mono stack (ui-monospace,
      // SFMono-Regular, Menlo, ...) applies to the `font-mono` spans in
      // Home.jsx, so the stat readouts there would render in a different face
      // than the `<code>` inside a post. One variable, one source of truth.
      fontFamily: {
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
}
