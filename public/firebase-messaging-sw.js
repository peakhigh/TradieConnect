/* Firebase Cloud Messaging service worker (web push).
 *
 * Handles background push messages for the web app. Foreground messages are
 * handled in-app by app/services/webPush.ts.
 *
 * Firebase config is passed as query params when the app registers this worker
 * (see serviceWorkerUrl() in webPush.ts) because a service worker cannot read
 * the app's environment variables. All of these values are public client config.
 *
 * This file is served from the hosting root. With Expo's Metro web build, files
 * in the project-root /public directory are copied into the export output (dist/).
 */
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('authDomain') || '',
  projectId: params.get('projectId') || '',
  storageBucket: params.get('storageBucket') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
};

if (firebaseConfig.projectId && firebaseConfig.messagingSenderId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || 'TradieConnect';
    const options = {
      body: (payload.notification && payload.notification.body) || '',
      icon: '/favicon.png',
      data: payload.data || {},
    };
    self.registration.showNotification(title, options);
  });
}

// Focus or open the app when a notification is clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
      return undefined;
    })
  );
});
