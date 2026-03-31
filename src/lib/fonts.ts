import localFont from 'next/font/local';

// Google Sans Flex - Variable font (wght + opsz axes, Latin subset)
export const googleSansFlex = localFont({
  src: '../../public/Google_Sans_Flex/GoogleSansFlex-Optimized.woff2',
  display: 'swap',
  variable: '--font-google-sans-flex',
  fallback: ['system-ui', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
});

// CSS variable for use in theme
export const fontFamily =
  'var(--font-google-sans-flex), system-ui, Roboto, Helvetica, Arial, sans-serif';
