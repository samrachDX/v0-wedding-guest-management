import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wedding Guest System",
    short_name: "Wedding Guests",
    description: "Manage wedding guests, gifts, and attendance",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf8f8",
    theme_color: "#fbf8f8",
    lang: "km",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Gifts", url: "/gifts", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Guests", url: "/guests", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
