/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Figtree"', 'ui-sans-serif', 'system-ui'],
        body: ['"Figtree"', 'ui-sans-serif', 'system-ui']
      }
    }
  }
};

