import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'se.corevo.pos',
  appName: 'Corevo POS',
  webDir: 'dist',
  // Tillåt WebView-navigation till corevo.se (annars öppnas externa URL:er i
  // systemets browser). Krävs sedan vi bytte från iframe till top-level navigation.
  server: {
    allowNavigation: [
      'corevo.se',
      '*.corevo.se',
    ],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2d6b5a',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#2d6b5a',
      showSpinner: false,
    },
  },
}

export default config
