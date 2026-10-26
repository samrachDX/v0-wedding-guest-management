"use client"

/** Shrinks a photo to at most 1200px and re-encodes it as JPEG before upload. */
function compressImage(file: File, maxSize = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to load image"))
      img.onload = () => {
        const scale = Math.min(1, maxSize / img.width, maxSize / img.height)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Failed to get canvas context"))
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Failed to compress image"))),
          "image/jpeg",
          quality,
        )
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export class ProofImageError extends Error {}

/** Compresses a photo and uploads it, returning the stored image URL and the before/after sizes in KB. */
export async function uploadProofImage(file: File) {
  if (!file.type.startsWith("image/")) throw new ProofImageError("imageOnly")

  const compressed = await compressImage(file)
  const upload = new FormData()
  upload.append("file", new File([compressed], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" }))

  const response = await fetch("/api/upload", { method: "POST", body: upload })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "uploadFailed")

  return {
    url: data.url as string,
    fromKB: (file.size / 1024).toFixed(0),
    toKB: (compressed.size / 1024).toFixed(0),
  }
}
