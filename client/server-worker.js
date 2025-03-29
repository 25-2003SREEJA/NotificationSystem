self.addEventListener('push', (event) => {
    console.log('Push event received:', event);
    
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || "You have a new message!",
        icon: "/icon.png", 
        badge: "/badge.png", 
        vibrate: [200, 100, 200],
        data: { url: data.url || "/" } 
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "Notification", options)
    );
});


self.addEventListener('notificationclick', (event) => {
    console.log('Notification click event:', event);
    
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === event.notification.data.url && "focus" in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
