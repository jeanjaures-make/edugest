"use client"

import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2, CheckCircle2 } from "lucide-react"
import { usePushNotifications } from "@/lib/hooks/use-push"
import { useState, useEffect } from "react"

export function PushNotificationToggle() {
  const { permission, subscription, loading, requestPermission, unsubscribe } = usePushNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !("Notification" in window)) {
    return null
  }

  if (permission === "granted" && subscription) {
    return (
      <Button variant="outline" size="sm" onClick={unsubscribe} disabled={loading}>
        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
        Notifications activées
      </Button>
    )
  }

  if (permission === "denied") {
    return (
      <Button variant="outline" size="sm" disabled>
        <BellOff className="h-4 w-4 mr-2" />
        Notifications bloquées
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={requestPermission} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
      Activer les notifications
    </Button>
  )
}
