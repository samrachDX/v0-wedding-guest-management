"use client"

import { useEffect, useSyncExternalStore } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/** Registers the service worker that makes the app installable. */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Service worker failed:", error))
  }, [])
}

// The browser fires beforeinstallprompt once, often before the Settings page mounts, so keep it here
let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    listeners.forEach((notify) => notify())
  })
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null
    listeners.forEach((notify) => notify())
  })
}

export type InstallState = "installed" | "prompt" | "ios" | "manual"

function currentState(): InstallState {
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone) {
    return "installed"
  }
  if (deferredPrompt) return "prompt"
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios"
  return "manual"
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

/** Tells the Settings page how this device can install the app, and offers the browser's install prompt. */
export function useInstallPrompt() {
  const state = useSyncExternalStore<InstallState | null>(subscribe, currentState, () => null)

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    listeners.forEach((notify) => notify())
  }

  return { state, install }
}
