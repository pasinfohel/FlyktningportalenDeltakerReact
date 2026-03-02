import { registerRootComponent } from 'expo';

import App from './App';

if (typeof window !== 'undefined') {
  const ensurePwaHeadTags = () => {
    const hasManifest = document.querySelector('link[rel="manifest"]');
    if (!hasManifest) {
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = '/manifest.webmanifest';
      document.head.appendChild(manifest);
    }

    const hasTheme = document.querySelector('meta[name="theme-color"]');
    if (!hasTheme) {
      const theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#f3fbf4';
      document.head.appendChild(theme);
    }
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch {
      // Service worker registration failure should not block app startup.
    }
  };

  ensurePwaHeadTags();
  void registerServiceWorker();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
