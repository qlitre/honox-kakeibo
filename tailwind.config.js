/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1', // Indigo-600
          hover: '#4F46E5', // Indigo-500
        },
        danger: {
          DEFAULT: '#EF4444', // Red-500
          hover: '#DC2626', // Red-600
        },
        success: {
          DEFAULT: '#10B981', // Green-500
          hover: '#059669', // Green-600
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'),],
}