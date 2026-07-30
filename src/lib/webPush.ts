import webpush from 'web-push';

export type StoredPushSubscription = { endpoint: string; p256dh: string; auth: string };

export function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails('mailto:privacy@serieapronostici.it', publicKey, privateKey);
  return true;
}

export async function sendPush(subscription: StoredPushSubscription, payload: { title: string; body: string; url: string; tag: string }) {
  return webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ ...payload, icon: '/icon-192x192.jpg' }));
}
