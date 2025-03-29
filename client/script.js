const socket = io();


const room = window.location.pathname.includes("room2") ? "room2" : "room1";
socket.emit("join-room", room);


if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
            console.warn("Notifications are blocked. Enable them in browser settings.");
        }
    });
}


function loadSavedNotifications() {
    const savedNotifications = localStorage.getItem("room2Notifications");
    return savedNotifications ? JSON.parse(savedNotifications) : [];
}


function displayNotifications() {
    const container = document.getElementById("notifications-container");
    container.innerHTML = ""; // Clear previous content
    const notifications = loadSavedNotifications();
    
    notifications.forEach((notification) => {
        const div = document.createElement("div");
        div.classList.add("notification");
        div.textContent = notification.message;
        container.appendChild(div);
    });
}


function saveNotification(data) {
    let notifications = loadSavedNotifications();
    notifications.push(data);
    localStorage.setItem("room2Notifications", JSON.stringify(notifications));
}


socket.on("receive-notification", (data) => {
    saveNotification(data);
    displayNotification(data.message);
    showPopupNotification(data.message); 
});


function displayNotification(message) {
    const container = document.getElementById("notifications-container");
    const div = document.createElement("div");
    div.classList.add("notification");
    div.textContent = message;
    container.appendChild(div);
}


function showPopupNotification(message) {
    if (Notification.permission === "granted") {
        new Notification("New Notification", {
            body: message,
            icon: "/notification-icon.png" 
        });
    }
}


displayNotifications();
