// Service Worker for handling notification actions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'reply') {
    // Open the app and focus on the chat
    event.waitUntil(
      clients.openWindow(`${self.registration.scope}?action=reply&chatId=${event.notification.data.chatId}`)
    );
  } else if (event.action === 'view') {
    // Open the app and view the chat
    event.waitUntil(
      clients.openWindow(`${self.registration.scope}?action=view&chatId=${event.notification.data.chatId}`)
    );
  } else {
    // Default click - just open the app
    event.waitUntil(
      clients.openWindow(self.registration.scope)
    );
  }
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});
