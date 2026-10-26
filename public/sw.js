// Minimal service worker so the app can be installed to the home screen.
// It does not cache anything: guest and gift data always comes fresh from the server.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))
self.addEventListener("fetch", () => {})
