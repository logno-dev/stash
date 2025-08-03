/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-orange': 'var(--accent-orange)',
        'accent-orange-hover': 'var(--accent-orange-hover)',
        'tag-cyan': 'var(--tag-cyan)',
        'tag-cyan-bg': 'var(--tag-cyan-bg)',
        'tag-cyan-hover': 'var(--tag-cyan-hover)',
        'border-color': 'var(--border-color)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
      }
    },
  },
  plugins: [],
}