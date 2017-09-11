//NOTIFIER SERVICE WORKER 
//The name of the file should be this and this only.
// (you can change it but you'll have to change some stuff by reading the FCM docs)
//Get Access To Firebase Methods
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');

var FirebaseMessagingSenderId = "";

firebase.initializeApp({
	messagingSenderId: FirebaseMessagingSenderId
});

const messaging = firebase.messaging();

//handle messages when in background
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body : payload.notification.body,
    icon : payload.notification.icon,
    click_action : payload.notification.click_action
  };

  return self.registration.showNotification(notificationTitle,
      notificationOptions);
});

