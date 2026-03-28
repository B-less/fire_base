
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCxqD8tYH6u2sqI6gnLmdRDhsd-Abb0Lfk',
  authDomain: 'chirpchat-w8ovb.firebaseapp.com',
  databaseURL: 'https://chirpchat-w8ovb-default-rtdb.firebaseio.com',
  projectId: 'chirpchat-w8ovb',
  storageBucket: 'chirpchat-w8ovb.appspot.com',
  messagingSenderId: '95851153319',
  appId: '1:95851153319:web:2644b1c9f020a78ed79882',
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'ChirpChat';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'Open ChirpChat to read your new message.',
    icon: '/icon-192x192.png',
    data: {
      senderPhoneNumber: payload.data?.senderPhoneNumber || payload.data?.contactId || '',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const senderPhoneNumber = event.notification.data?.senderPhoneNumber;
  const targetUrl = senderPhoneNumber
    ? `/?contact=${encodeURIComponent(senderPhoneNumber)}`
    : '/';

  event.waitUntil(clients.openWindow(targetUrl));
});
