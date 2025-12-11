/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 현대 인증중고차 컬러 시스템
        primary: {
          DEFAULT: '#002C5F', // 현대 블루
          light: '#0066CC',
          dark: '#001E3C',
        },
        secondary: {
          DEFAULT: '#00AAD2', // 밝은 블루
          light: '#4DC3E0',
          dark: '#007A99',
        },
        accent: {
          DEFAULT: '#E63312', // 강조 레드
          light: '#FF5A3D',
          dark: '#B8280E',
        },
        gray: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
