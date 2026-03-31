/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			colors: {
				brand: {
					50: '#f0f4ff',
					100: '#e0e9ff',
					500: '#3b5bdb',
					600: '#2f4cc0',
					700: '#2440a8'
				}
			}
		}
	},
	plugins: []
};
