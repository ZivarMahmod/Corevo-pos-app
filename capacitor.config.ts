import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'se.corevo.pos',
  appName: 'Corevo POS',
  webDir: 'dist',
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
