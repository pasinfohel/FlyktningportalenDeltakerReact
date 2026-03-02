import { registerRootComponent } from 'expo';

import App from './App';

if (typeof window !== 'undefined') {
  const buildNumber = process.env.EXPO_PUBLIC_BUILD_NUMBER ?? 'local-dev';

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
      const registration = await navigator.serviceWorker.register(
        `/sw.js?b=${encodeURIComponent(buildNumber)}`,
      );

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      let hasRefreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasRefreshed) return;
        hasRefreshed = true;
        window.location.reload();
      });
    } catch {
      // Service worker registration failure should not block app startup.
    }
  };

  ensurePwaHeadTags();
  void registerServiceWorker();
}

// registerRootComponent wires the Expo root entry for web/PWA runtime.
registerRootComponent(App);
