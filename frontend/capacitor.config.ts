import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jab.app',
  appName: 'JAB',
  webDir: 'dist',
  // Points the native shell at the live Vite dev server for fast iteration
  // (edits show up on save, no rebuild needed). Remove this block before
  // shipping a real build - then it'll load the bundled webDir instead.
  server: {
    url: 'http://localhost:5173',
    cleartext: true,
  },
};

export default config;
