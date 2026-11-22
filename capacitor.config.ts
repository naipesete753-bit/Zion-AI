import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.naipesete.zionai',
  appName: 'Zion AI',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // O WebView usa HTTPS local; a API remota deve ser HTTPS.
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#09110e',
    allowMixedContent: false,
  },
}

export default config
