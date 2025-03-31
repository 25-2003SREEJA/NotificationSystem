const socket = io();

// Dynamically determine the room based on URL
const room = window.location.pathname.split("/").pop() || "room1";
socket.emit("join-room", room);

// Request Notification Permission
if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
            console.warn("Notifications are blocked. Enable them in browser settings.");
        }
    });
}

// Load saved notifications for the current room
function loadSavedNotifications() {
    const savedNotifications = localStorage.getItem(`${room}Notifications`);
    return savedNotifications ? JSON.parse(savedNotifications) : [];
}

// Display notifications on UI
function displayNotifications() {
    const container = document.getElementById("notifications-container");
    container.innerHTML = ""; 
    const notifications = loadSavedNotifications();
    
    notifications.forEach((notification) => {
        const div = document.createElement("div");
        div.classList.add("notification");
        div.textContent = notification.message;
        container.appendChild(div);
    });
}

// Save new notification
function saveNotification(data) {
    let notifications = loadSavedNotifications();
    notifications.push(data);
    localStorage.setItem(`${room}Notifications`, JSON.stringify(notifications));
}

// Receive notification from server
socket.on("receive-notification", (data) => {
    saveNotification(data);
    displayNotification(data.message);
    showPopupNotification(data.message);
});

// Display notification in UI
function displayNotification(message) {
    const container = document.getElementById("notifications-container");
    const div = document.createElement("div");
    div.classList.add("notification");
    div.textContent = message;
    container.appendChild(div);
}

// Show browser popup notification
function showPopupNotification(message) {
    if (Notification.permission === "granted") {
        new Notification("New Notification", {
            body: message,
            icon: "/notification-icon.png"
        });
    }
}

// Load existing notifications on page load
displayNotifications();
