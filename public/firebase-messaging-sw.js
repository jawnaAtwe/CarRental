
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// تهيئة Firebase
firebase.initializeApp({
  apiKey: "AIzaSyA53GyVedpvcQwf-8FCEt3hjnVbEaZW_uE",
  authDomain: "carrental-b58e9.firebaseapp.com",
  projectId: "carrental-b58e9",
  storageBucket: "carrental-b58e9.firebasestorage.app",
  messagingSenderId: "205423597403",
  appId: "1:205423597403:web:3e24b6006e3e445ebdec7e",
  measurementId: "G-HNFD7QD4TE"
});

const messaging = firebase.messaging();

// 📩 استقبال الإشعارات في الخلفية (عندما التطبيق مغلق أو في Background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 📩 Background message received:', payload);

  // استخراج البيانات من payload
  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/badge-icon.png', // أيقونة صغيرة في شريط المهام (اختياري)
    tag: payload.data?.type || 'notification', // منع التكرار (إذا جا نفس tag، يستبدل الإشعار القديم)
    data: payload.data, // بيانات إضافية (مثل tenant_id، booking_id، إلخ)
    requireInteraction: false, // الإشعار يختفي تلقائياً بعد فترة
    vibrate: [200, 100, 200], // اهتزاز (للموبايل)
    actions: [ // أزرار اختيارية (بعض المتصفحات ما بتدعمها)
      {
        action: 'view',
        title: 'عرض',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/close.png'
      }
    ]
  };

  // عرض الإشعار
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🖱️ معالجة الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 🖱️ Notification clicked:', event.notification.tag);
  
  // إغلاق الإشعار
  event.notification.close();

  // معالجة الأزرار (إذا موجودة)
  if (event.action === 'close') {
    console.log('User clicked Close');
    return;
  }

  // فتح التطبيق أو التوجيه لصفحة معينة
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // إذا في نافذة مفتوحة للتطبيق، ركز عليها
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // إذا ما في نافذة مفتوحة، افتح واحدة جديدة
        const urlToOpen = event.notification.data?.url || '/';
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 🔧 معالجة إغلاق الإشعار
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event.notification.tag);
});

// 📊 Log عند تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] ✅ Service Worker activated');
});

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] 📦 Service Worker installed');
  self.skipWaiting(); // تفعيل فوري بدون انتظار
});