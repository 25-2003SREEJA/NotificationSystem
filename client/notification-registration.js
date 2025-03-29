// client/notification-registration.js

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker not supported in this browser");
        return;
    }

    try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("Service Worker registered successfully:", registration);

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return;
        }

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            // Subscribe to push notifications
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array("YOUR_VAPID_PUBLIC_KEY")
            });

            console.log("Push Subscription:", subscription);

            // Send subscription to server
            await fetch("/subscribe", {
                method: "POST",
                body: JSON.stringify(subscription),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        } else {
            console.log("Already subscribed to push notifications");
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
            console.log("Message from service worker:", event.data);
        });

    } catch (error) {
        console.error("Service Worker registration failed:", error);
    }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", registerServiceWorker);
