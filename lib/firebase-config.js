

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA53GyVedpvcQwf-8FCEt3hjnVbEaZW_uE",
  authDomain: "carrental-b58e9.firebaseapp.com",
  projectId: "carrental-b58e9",
  storageBucket: "carrental-b58e9.firebasestorage.app",
  messagingSenderId: "205423597403",
  appId: "1:205423597403:web:3e24b6006e3e445ebdec7e",
  measurementId: "G-HNFD7QD4TE"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

/**
 * طلب إذن الإشعارات وجلب FCM Token
 * @returns {Promise<string|null>} FCM Token أو null إذا فشل
 */
export async function requestNotificationPermission() {
  try {
    // ✅ 1️⃣ التحقق من دعم المتصفح للإشعارات
    if (!("Notification" in window)) {
      console.error("❌ هذا المتصفح لا يدعم الإشعارات");
      return null;
    }

    // ✅ 2️⃣ التحقق من وجود messaging
    if (!messaging) {
      console.error("❌ Firebase Messaging غير مُهيأ");
      return null;
    }

    console.log("🔔 طلب إذن الإشعارات...");

    // ✅ 3️⃣ طلب الإذن من المستخدم
    const permission = await Notification.requestPermission();
    console.log("📱 حالة الإذن:", permission);

    // ✅ 4️⃣ التحقق من الإذن
    if (permission !== "granted") {
      console.warn("⚠️ المستخدم رفض إذن الإشعارات");
      
      if (permission === "denied") {
        console.error("🚫 الإشعارات محظورة. يرجى تفعيلها من إعدادات المتصفح");
      }
      
      return null;
    }

    // ✅ 5️⃣ جلب FCM Token
    console.log("🔑 جلب FCM Token...");
    
    const token = await getToken(messaging, {
      vapidKey: 'BOhC4dlEuOsh-7l05acJ5sViffwY-mL01AlkxR03gwX5OaUjcnZt0xYpBLE1xOI5nplA8af-XqrnGESviqY02BY'
    });

    if (token) {
      console.log("✅ FCM Token تم الحصول عليه:", token.substring(0, 30) + "...");
      return token;
    } else {
      console.error("❌ لم يتم الحصول على FCM Token");
      return null;
    }

  } catch (error) {
    console.error("❌ خطأ في requestNotificationPermission:", error);

    // ✅ معالجة أخطاء محددة
    if (error.code === "messaging/permission-blocked") {
      console.error("🚫 الإشعارات محظورة من قبل المستخدم");
    } else if (error.code === "messaging/failed-service-worker-registration") {
      console.error("🔧 Service Worker غير مُسجل. تأكد من وجود /firebase-messaging-sw.js");
    } else if (error.code === "messaging/unsupported-browser") {
      console.error("🌐 المتصفح لا يدعم Firebase Messaging");
    } else if (error.code === "messaging/invalid-vapid-key") {
      console.error("🔑 VAPID Key غير صحيح");
    }

    return null;
  }
}

/**
 * حذف FCM Token (عند تسجيل الخروج مثلاً)
 */
export async function deleteNotificationToken() {
  try {
    if (!messaging) {
      console.warn("⚠️ Messaging غير مُهيأ");
      return false;
    }

    const { deleteToken } = await import('firebase/messaging');
    await deleteToken(messaging);
    console.log("✅ FCM Token تم حذفه");
    return true;
  } catch (error) {
    console.error("❌ خطأ في حذف Token:", error);
    return false;
  }
}