// Service Worker for Web Push Notifications

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received');
  
  if (!event.data) {
    console.log('[SW] No push data');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('[SW] Push data parsed:', data.title);
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    data = { title: 'StayBuki', message: event.data.text() };
  }
  const title = data.title || 'StayBuki Notification';
  const options = {
    body: data.message || data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/apple-touch-icon.png',
    data: {
      url: data.url,
      type: data.type,
      referenceId: data.referenceId
    },
    requireInteraction: true,
    tag: data.type + '-' + data.referenceId
  };

  console.log('[SW] Showing notification:', title);
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch(err => console.error('[SW] Failed to show notification:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/';

  // Determine the target URL based on notification type
  // Use paths that match actual routing (mobile uses different paths)
  if (data.url) {
    targetUrl = data.url;
  } else if (data.type) {
    switch(data.type) {
      case 'visit_request':
        targetUrl = '/owner-visit-requests';
        break;
      case 'onboarding_request':
        targetUrl = '/owner-onboarding-requests';
        break;
      case 'payment':
        targetUrl = '/payments';
        break;
      case 'complaint':
        targetUrl = '/complaints';
        break;
      default:
        targetUrl = '/dashboard';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(client => {
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
