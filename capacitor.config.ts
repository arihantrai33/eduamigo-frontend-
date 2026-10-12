import type { CapacitorConfig } from '@capacitor/cli';

// Android and iOS apps built from this web app (see docs/MOBILE.md).
// CAP_LOCAL_DEV=true is only for trying the app against a backend on this computer over plain http
// (Android emulator: http://10.0.2.2:8000). Release builds leave it unset: https only, no mixed content.
const localDev = process.env.CAP_LOCAL_DEV === 'true';

const config: CapacitorConfig = {
  appId: 'in.eduamigo.app',
  appName: 'EduAmigo',
  webDir: 'dist',
  backgroundColor: '#0f172a',
  server: localDev ? { androidScheme: 'http', cleartext: true } : { androidScheme: 'https' },
  android: { allowMixedContent: localDev },
  plugins: {
    FirebaseMessaging: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
