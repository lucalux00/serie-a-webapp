import { useState, useEffect } from 'react';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

export type NotificationPreferences = {
  teamNews: boolean;
  teamTransfers: boolean;
  matchStart: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId?: string) {
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        setIsSubscribed(true);
        setSubscription(sub);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  useEffect(() => {
    if (isSupported) {
      const timer = window.setTimeout(() => { void registerServiceWorker(); }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isSupported]);

  const subscribe = async (preferences: NotificationPreferences) => {
    if (!userId) return false;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (!publicVapidKey) throw new Error('Chiave VAPID non configurata');
      const sub = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      setIsSubscribed(true);
      setSubscription(sub);
      
      // Salva la sottoscrizione nel DB
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, preferences })
      });
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  };

  const testNotification = async () => {
    if (!userId) return;
    await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId,
        title: '⚽ Gol!',
        body: 'La tua squadra del cuore ha appena segnato!'
      })
    });
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    subscribe,
    testNotification
  };
}
