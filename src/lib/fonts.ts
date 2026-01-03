import localFont from 'next/font/local'

// Google Sans Flex - Variable font with 6 axes
// Axes: wght (weight), wdth (width), opsz (optical size), slnt (slant), GRAD (grade), ROND (roundedness)
export const googleSansFlex = localFont({
  src: '../../public/Google_Sans_Flex/GoogleSansFlex-Variable.ttf',
  display: 'swap',
  variable: '--font-google-sans-flex',
  fallback: ['system-ui', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
})

// CSS variable for use in theme
export const fontFamily = 'var(--font-google-sans-flex), system-ui, Roboto, Helvetica, Arial, sans-serif'
