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
        'accent-orange': 'var(--accent-primary)',
        'accent-orange-hover': 'var(--accent-primary-hover)',
        'accent-primary': 'var(--accent-primary)',
        'accent-primary-hover': 'var(--accent-primary-hover)',
        'accent-secondary': 'var(--accent-secondary)',
        'tag-cyan': 'var(--tag-blue)',
        'tag-cyan-bg': 'var(--tag-blue-bg)',
        'tag-cyan-hover': 'var(--tag-blue-hover)',
        'tag-purple': 'var(--tag-purple)',
        'tag-purple-bg': 'var(--tag-purple-bg)',
        'tag-purple-hover': 'var(--tag-purple-hover)',
        'border-color': 'var(--border-color)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'card-bg': 'var(--card-bg)',
        'card-bg-secondary': 'var(--card-bg-secondary)',
        'card-bg-hover': 'var(--card-bg-hover)',
        'header-bg': 'var(--header-bg)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--accent-gradient)',
        'gradient-primary-hover': 'var(--accent-gradient-hover)',
      }
    },
  },
  plugins: [],
}