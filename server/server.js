require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));


const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("VAPID keys not found. Set them in .env file.");
  process.exit(1);
}


webpush.setVapidDetails(
  'mailto:sreejamukherjee25@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);


const subscriptions = new Set();
const recentNotifications = [];


const ROOM1 = 'room1';
const ROOM2 = 'room2';


app.post('/subscribe', (req, res) => {
  const subscription = req.body;

  const subscriptionString = JSON.stringify(subscription);
  if (!subscriptions.has(subscriptionString)) {
    subscriptions.add(subscriptionString);
    console.log('New subscription added');
  }

  res.status(201).json({ publicKey: VAPID_PUBLIC_KEY });
});


app.post('/send-global-notification', async (req, res) => {
  const { message, timestamp } = req.body;

  const notificationPayload = JSON.stringify({
    title: 'New Notification from Room 1',
    body: message,
    timestamp
  });

  const failedSubscriptions = new Set();

  await Promise.all(
    Array.from(subscriptions).map(async (subscriptionJson) => {
      try {
        const subscription = JSON.parse(subscriptionJson);
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (error) {
        console.error('Notification sending error:', error);
        failedSubscriptions.add(subscriptionJson);
      }
    })
  );

  
  failedSubscriptions.forEach(sub => subscriptions.delete(sub));

  res.status(200).json({ success: true, totalSubscriptions: subscriptions.size });
});


io.on('connection', (socket) => {
  console.log(` New client connected: ${socket.id}`);

  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(` Socket ${socket.id} joined ${room}`);

    if (room === ROOM2) {
      socket.emit('recent-notifications', recentNotifications);
    }
  });

  
  socket.on('send-notification', async (data) => {
    const notificationWithId = {
      ...data,
      id: Date.now()
    };
    recentNotifications.push(notificationWithId);

    if (recentNotifications.length > 10) {
      recentNotifications.shift();
    }

    
    io.to(ROOM2).emit('receive-notification', notificationWithId);

   
    try {
      await fetch(`http://localhost:${PORT}/send-global-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Global notification trigger failed:', error);
    }
  });

  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});


app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`VAPID Public Key: ${VAPID_PUBLIC_KEY}`);
});
