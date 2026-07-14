"use client"

import { useEffect, useState, useCallback } from "react"

/**
 * Hook pour gérer les notifications push (Web Push API)
 * - Demande la permission
 * - Enregistre la subscription auprès du serveur
 * - Fournit l'état de permission
 */

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setSubscription(sub)
      }).catch(() => {})
    }
  }, [])

  const requestPermission = useCallback(async () => {
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        await subscribe()
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    const reg = await navigator.serviceWorker.ready
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      console.warn("VAPID public key not configured")
      return
    }

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
      setSubscription(sub)

      // Send subscription to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      })
    } catch { /* ignore */ }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe()
      await fetch("/api/push/subscribe", { method: "DELETE" })
      setSubscription(null)
    }
  }, [subscription])

  return { permission, subscription, loading, requestPermission, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
