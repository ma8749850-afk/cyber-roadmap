importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyBp1MBq44Vc8RpzCfAk-PpJB2qz6WOCr1o",
  authDomain: "cyber-roadmap-chat.firebaseapp.com",
  databaseURL: "https://cyber-roadmap-chat-default-rtdb.firebaseio.com",
  projectId: "cyber-roadmap-chat",
  storageBucket: "cyber-roadmap-chat.firebasestorage.app",
  messagingSenderId: "527807248570",
  appId: "1:527807248570:web:cd7458c3e03c1e905a6a83"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {

self.registration.showNotification(payload.notification.title, {
body: payload.notification.body,
icon: "/icon.png"
});

});

self.addEventListener("notificationclick", function(event) {
event.notification.close();

event.waitUntil(
clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
for (let i = 0; i < clientList.length; i += 1) {
if (clientList[i].url.includes("/chat.html")) {
return clientList[i].focus();
}
}

if (clients.openWindow) {
return clients.openWindow("/chat.html");
}

return null;
})
);
});
